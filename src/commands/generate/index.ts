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
import { isValid } from "sls-version";
import { Argv, CommandModule } from "yargs";
import { IPackageJson, writeJson } from "../../utils";
import { generate } from "./generator";

export * from "./generator";

export interface IGenerateCommandArgs {
    /* Positional arguments */
    _: string[];

    packageVersion: string;

    packageName: string;

    nodeCompatibleModules?: boolean;
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
                required: true,
                type: "string",
            })
            .option("packageName", {
                default: undefined,
                describe: "The name of the generated package",
                required: true,
                type: "string",
            })
            .option("nodeCompatibleModules", {
                default: undefined,
                describe: "Generate node compatible javascript",
                type: "boolean",
            })
            .demand(2);
    }

    public handler = async (args: IGenerateCommandArgs) => {
        const { packageName, packageVersion, nodeCompatibleModules } = args;
        const [, input, output] = args._;
        if (!fs.existsSync(output)) {
            throw new Error(`Directory "${output}" does not exist`);
        } else if (!isValid(packageVersion)) {
            throw new Error(`Expected version to be valid SLS version but found "${packageVersion}"`);
        }

        const contents = fs.readFileSync(input, "utf8");
        const conjureDefinition: IConjureDefinition = {
            errors: [],
            services: [],
            types: [],
            ...JSON.parse(contents),
        };

        const srcDir = path.join(output, "src");
        fs.mkdirpSync(srcDir);
        return Promise.all([
            writeJson(
                path.join(output, "package.json"),
                createPackageJson(require("../../../package.json"), packageName, packageVersion),
            ),
            writeJson(path.join(srcDir, "tsconfig.json"), createTsconfigJson(nodeCompatibleModules)),
            generate(conjureDefinition, srcDir),
        ]);
    };
}

export function createPackageJson(projectPackageJson: IPackageJson, packageName: string, version: string) {
    const peerDependencies = {
        "conjure-client": projectPackageJson.dependencies["conjure-client"],
    };
    return {
        name: `${packageName}`,
        version,
        main: "dist/index.js",
        types: "dist/index.d.ts",
        sideEffects: false,
        scripts: {
            build: "tsc -p src",
        },
        peerDependencies,
        devDependencies: {
            ...peerDependencies,
            typescript: projectPackageJson.devDependencies.typescript,
        },
        author: "Conjure",
        license: "UNLICENSED",
    };
}

export function createTsconfigJson(generateNodeCompatibleModule: boolean | undefined) {
    return {
        compilerOptions: {
            declaration: true,
            outDir: "../dist",
            module: generateNodeCompatibleModule ? "commonjs" : "es2015",
            moduleResolution: "node",
            noImplicitAny: true,
            removeComments: false,
            stripInternal: true,
            target: "es5",
            typeRoots: [],
        },
    };
}
