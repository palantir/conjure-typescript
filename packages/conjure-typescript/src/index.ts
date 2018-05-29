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

import { IConjureDefinition } from "@conjure/conjure-api";
import * as fs from "fs-extra";
import * as path from "path";
import { generate } from "./generate";

export interface IGeneratorConfig {
    input: string;
    output: string;
    packageName: string;
    version: string;
}

export function generateCode(config: IGeneratorConfig): Promise<void> {
    if (!fs.existsSync(config.output)) {
        throw new Error(`Directory ${config.output} does not exist`);
    } else if (!isValid(config.version)) {
        throw new Error(`Expected version to be valid SLS version but found "${config.version}"`);
    }

    generateModule(config.packageName, config.version, config.output);
    return runGenerator(config.input, config.output);
}

export function generateModule(packageName: string, version: string, outDir: string) {
    fs.writeFileSync(
        path.join(outDir, "package.json"),
        JSON.stringify(createPackageJson(packageName, version), null, "    "),
    );
    fs.writeFileSync(path.join(outDir, `tsconfig.json`), JSON.stringify(createTsconfigJson(), null, "    "));
}

function createPackageJson(packageName: string, version: string) {
    // To conform with standard package.json structure
    const packageJson = require("../package.json");
    const peerDependencies = {
        "conjure-client": packageJson.dependencies["conjure-client"],
    };
    // tslint:disable:object-literal-sort-keys
    return {
        name: `${packageName}`,
        version,
        scripts: {
            buildAndPublish: "tsc && npm publish",
        },
        sideEffects: false,
        peerDependencies,
        devDependencies: {
            ...peerDependencies,
            typescript: packageJson.devDependencies.typescript,
        },
        author: "Conjure",
        license: "UNLICENSED",
    };
    // tslint:enable:object-literal-sort-keys
}

function createTsconfigJson() {
    // To conform with standard package.json structure
    // tslint:disable:object-literal-sort-keys
    return {
        compilerOptions: {
            declaration: true,
            inlineSourceMap: true,
            inlineSources: true,
            module: process.env.CONJURE_TYPESCRIPT_MODULE === "common" ? "commonjs" : "es2015",
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

function isValid(version: string) {
    const versionRegex = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-rc([0-9]+))?(?:-([0-9]+)-g([a-f0-9]+))?$/;
    return versionRegex.test(version);
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
