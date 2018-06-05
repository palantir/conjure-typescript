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
import { generate } from "./generate";

export interface IGeneratorConfig {
    input: string;
    output: string;
    packageName: string;
    version: string;
    moduleType: string;
}

export interface IPackageJson {
    dependencies: { [dependency: string]: string };
    devDependencies: { [dependency: string]: string };
}

export async function generateCode(config: IGeneratorConfig): Promise<void> {
    if (!fs.existsSync(config.output)) {
        throw new Error(`Directory "${config.output}" does not exist`);
    } else if (!isValid(config.version)) {
        throw new Error(`Expected version to be valid SLS version but found "${config.version}"`);
    } else if (config.moduleType !== "es2015" && config.moduleType !== "commonjs") {
        throw new Error(`Expected moduleType to be either "es2015" or "commonjs", but found "${config.moduleType}"`);
    }

    generateModule(config.packageName, config.version, config.moduleType, config.output);
    return runGenerator(config.input, config.output);
}

export function generateModule(packageName: string, version: string, moduleType: string, outDir: string) {
    fs.writeFileSync(
        path.join(outDir, "package.json"),
        JSON.stringify(createPackageJson(require("../package.json"), packageName, version), null, "    "),
    );
    fs.writeFileSync(path.join(outDir, `tsconfig.json`), JSON.stringify(createTsconfigJson(moduleType), null, "    "));
}

export function createPackageJson(projectPackageJson: IPackageJson, packageName: string, version: string) {
    // To conform with standard package.json structure
    const peerDependencies = {
        "conjure-client": projectPackageJson.dependencies["conjure-client"],
    };
    // tslint:disable:object-literal-sort-keys
    return {
        name: `${packageName}`,
        version,
        sideEffects: false,
        scripts: {
            build: "tsc",
        },
        peerDependencies,
        devDependencies: {
            ...peerDependencies,
            typescript: projectPackageJson.devDependencies.typescript,
        },
        author: "Conjure",
        license: "UNLICENSED",
    };
    // tslint:enable:object-literal-sort-keys
}

function createTsconfigJson(module: string) {
    // To conform with standard package.json structure
    // tslint:disable:object-literal-sort-keys
    return {
        compilerOptions: {
            declaration: true,
            inlineSourceMap: true,
            inlineSources: true,
            module,
            moduleResolution: "node",
            noImplicitAny: true,
            removeComments: false,
            stripInternal: true,
            target: "es5",
            typeRoots: [],
        },
    };
    // tslint:enable:object-literal-sort-keys
}

function runGenerator(irPath: string, outputDir: string) {
    const contents = fs.readFileSync(irPath, "utf8");
    const conjureDefinition: IConjureDefinition = {
        errors: [],
        services: [],
        types: [],
        ...JSON.parse(contents),
    };
    return generate(conjureDefinition, outputDir);
}
