/**
 * @license
 * Copyright 2018 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IConjureDefinition } from "conjure-api";
import * as fs from "fs-extra";
import * as path from "path";
import { isValid, SlsVersionMatcher } from "sls-version";
import { Argv, CommandModule } from "yargs";
import { IPackageJson, IProductDependency, ISlsManifestDependency, writeJson } from "../../utils";
import { generate } from "./generator";

export interface IGenerateCommandArgs {
    /*
     * Positional arguments
     */
    _: string[];

    /*
     * The name of the package to generate
     */
    packageName?: string;

    /*
     * The version of the package to generate
     */
    packageVersion?: string;

    /*
     * Configure TypeScript compilation to generate modules that are node compatible
     */
    nodeCompatibleModules: boolean;

    /*
     * Generate raw source without any package metadata
     */
    rawSource: boolean;

    /**
     * Path to a file containing a list of product dependencies
     */
    productDependencies?: string;
}

interface ICleanedGenerateCommandArgs {
    conjureDefinition: IConjureDefinition;
    packageJson: IPackageJson;
    tsConfig: ITsConfig;
    gitIgnore: string;
}

export interface ITsConfig {
    compilerOptions: {
        [option: string]: any;
    };
}

export class GenerateCommand implements CommandModule {
    public aliases = [];

    public command = "generate";

    public describe = "Generate TypeScript bindings for a conjure api";

    public builder(args: Argv) {
        return args
            .positional("input", {
                describe: "The location of the apis IR",
            })
            .positional("output", {
                describe: "The output location of the generated code",
            })
            .option("packageVersion", {
                default: undefined,
                describe: "The version of the generated package",
                type: "string",
            })
            .option("packageName", {
                default: undefined,
                describe: "The name of the generated package",
                type: "string",
            })
            .option("nodeCompatibleModules", {
                default: false,
                describe: "Generate node compatible javascript",
                type: "boolean",
            })
            .option("rawSource", {
                default: false,
                describe: "Generate raw source without any package metadata",
                type: "boolean",
            })
            .option("productDependencies", {
                default: undefined,
                describe: "Path to a file containing a list of product dependencies",
                type: "string",
            })
            .demand(2);
    }

    public handler = async (args: IGenerateCommandArgs) => {
        const [, , output] = args._;
        const { rawSource } = args;
        const { conjureDefinition, packageJson, tsConfig, gitIgnore } = await this.parseCommandLineArguments(args);

        const generatePromise = generate(conjureDefinition, output);
        if (rawSource) {
            return generatePromise;
        }
        return Promise.all([
            writeJson(path.join(output, "package.json"), packageJson),
            writeJson(path.join(output, "tsconfig.json"), tsConfig),
            fs.writeFile(path.join(output, ".npmignore"), gitIgnore),
            generatePromise,
        ]);
    };

    private async parseCommandLineArguments(args: IGenerateCommandArgs): Promise<ICleanedGenerateCommandArgs> {
        const { packageName, packageVersion, productDependencies, rawSource } = args;
        const [, input, output] = args._;
        if (!rawSource && (packageName == null || packageVersion == null)) {
            throw Error('Must either specify "rawSource" or specify "packageName" and "packageVersion"');
        } else if (!fs.existsSync(output)) {
            throw new Error(`Directory "${output}" does not exist`);
        } else if (!rawSource && !isValid(packageVersion!)) {
            throw new Error(
                `Expected version to be valid SLS version but found "${packageVersion}. ` +
                    "Please see https://github.com/palantir/sls-version-js for more details on SLS version.",
            );
        }

        return {
            conjureDefinition: await loadConjureDefinition(input),
            packageJson: await createPackageJson(
                require("../../../package.json"),
                packageName!,
                packageVersion!,
                productDependencies,
            ),
            tsConfig: await createTsconfigJson(args.nodeCompatibleModules),
            gitIgnore: ["*.ts", "!*.d.ts", "tsconfig.json"].join("\n"),
        };
    }
}

export async function loadConjureDefinition(input: string): Promise<IConjureDefinition> {
    return { errors: [], services: [], types: [], ...JSON.parse(await fs.readFile(input, "utf8")) };
}

export async function createPackageJson(
    projectPackageJson: IPackageJson,
    packageName: string,
    packageVersion: string,
    productDependencies?: string,
): Promise<IPackageJson> {
    const peerDependencies = { "conjure-client": projectPackageJson.dependencies["conjure-client"] };
    const packageJson: IPackageJson = {
        name: packageName!,
        version: packageVersion!,
        main: "index.js",
        types: "index.d.ts",
        sideEffects: false,
        scripts: { build: "tsc" },
        dependencies: {},
        peerDependencies,
        devDependencies: { ...peerDependencies, typescript: projectPackageJson.devDependencies.typescript },
        author: "Conjure",
        license: "UNLICENSED",
    };

    if (productDependencies != null) {
        const dependencies = await resolveProductDependencies(productDependencies);
        if (Object.keys(dependencies).length > 0) {
            packageJson.sls = { dependencies };
        }
    }

    return packageJson;
}

export async function resolveProductDependencies(
    productDependencies: string,
): Promise<{ [coordinate: string]: IProductDependency }> {
    const resolvedProductDependencies: ISlsManifestDependency[] = await fs.readJSON(productDependencies);
    const dependencies: { [coordinate: string]: IProductDependency } = {};
    resolvedProductDependencies.forEach(productDependency => {
        const coordinate = `${productDependency["product-group"]}:${productDependency["product-name"]}`;
        if (
            SlsVersionMatcher.safeValueOf(productDependency["maximum-version"]) == null ||
            !isValid(productDependency["minimum-version"]) ||
            !isValid(productDependency["recommended-version"])
        ) {
            throw new Error("Encountered invalid product dependency");
        }
        dependencies[coordinate] = {
            minVersion: productDependency["minimum-version"],
            recommendedVersion: productDependency["recommended-version"],
            maxVersion: productDependency["maximum-version"],
        };
    });
    return dependencies;
}

export function createTsconfigJson(nodeCompatibleModules: boolean): ITsConfig {
    return {
        compilerOptions: {
            declaration: true,
            module: nodeCompatibleModules ? "commonjs" : "es2015",
            moduleResolution: "node",
            noImplicitAny: true,
            removeComments: false,
            stripInternal: true,
            target: "es5",
            typeRoots: [],
        },
    };
}
