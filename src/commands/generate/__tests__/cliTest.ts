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

import * as child_process from "child_process";
import * as fs from "fs-extra";
import * as path from "path";
import { directory } from "tempy";
import { IPackageJson, ISlsManifestDependency } from "../../../utils";
import { createPackageJson, createTsconfigJson, GenerateCommand } from "../index";

describe("generate command", () => {
    let outDir: string;
    const input = path.join(__dirname, "../../../../build/ir-test-cases/example-types.json");
    const generateCommand = new GenerateCommand();

    beforeEach(() => {
        outDir = directory();
    });

    describe("package.json generation", () => {
        const inputPackage: IPackageJson = {
            dependencies: { "conjure-client": "1.0.0" },
            devDependencies: { typescript: "2.7.2" },
        } as any;

        it("generates simple package.json", async () => {
            expect(await createPackageJson(inputPackage, "foo", "1.0.0")).toEqual({
                name: "foo",
                version: "1.0.0",
                main: "index.js",
                types: "index.d.ts",
                sideEffects: false,
                scripts: {
                    build: "tsc",
                },
                dependencies: { "conjure-client": "1.0.0" },
                devDependencies: {
                    typescript: "2.7.2",
                },
                author: "Conjure",
                license: "UNLICENSED",
            });
        });

        it("generate packageJson with productDependencies", async () => {
            const productDependencies: ISlsManifestDependency[] = [
                {
                    "product-group": "com.palantir.conjure",
                    "product-name": "conjure",
                    "minimum-version": "1.0.0",
                    "recommended-version": "1.2.0",
                    "maximum-version": "2.x.x",
                },
            ];
            const productDependencyPath = path.join(outDir, "productDependencies.json");
            await fs.writeJSON(productDependencyPath, productDependencies);
            const expectedPackageJson = {
                name: "foo",
                version: "1.0.0",
                sls: {
                    dependencies: {
                        "com.palantir.conjure:conjure": {
                            minVersion: "1.0.0",
                            recommendedVersion: "1.2.0",
                            maxVersion: "2.x.x",
                        },
                    },
                },
                main: "index.js",
                types: "index.d.ts",
                sideEffects: false,
                scripts: {
                    build: "tsc",
                },
                dependencies: { "conjure-client": "1.0.0" },
                devDependencies: {
                    typescript: "2.7.2",
                },
                author: "Conjure",
                license: "UNLICENSED",
            };
            expect(await createPackageJson(inputPackage, "foo", "1.0.0", productDependencyPath)).toEqual(
                expectedPackageJson,
            );
        });

        it("generate packageJson with productDependencies without recommendedVersion", async () => {
            const productDependencies: ISlsManifestDependency[] = [
                {
                    "product-group": "com.palantir.conjure",
                    "product-name": "conjure",
                    "minimum-version": "1.0.0",
                    "maximum-version": "2.x.x",
                },
            ];
            const productDependencyPath = path.join(outDir, "productDependencies.json");
            await fs.writeJSON(productDependencyPath, productDependencies);
            const expectedPackageJson = {
                name: "foo",
                version: "1.0.0",
                sls: {
                    dependencies: {
                        "com.palantir.conjure:conjure": {
                            minVersion: "1.0.0",
                            maxVersion: "2.x.x",
                        },
                    },
                },
                main: "index.js",
                types: "index.d.ts",
                sideEffects: false,
                scripts: {
                    build: "tsc",
                },
                dependencies: { "conjure-client": "1.0.0" },
                devDependencies: {
                    typescript: "2.7.2",
                },
                author: "Conjure",
                license: "UNLICENSED",
            };
            expect(await createPackageJson(inputPackage, "foo", "1.0.0", productDependencyPath)).toEqual(
                expectedPackageJson,
            );
        });
    });

    it("only generates raw source", async () => {
        jest.setTimeout(10000);
        await generateCommand.handler({
            _: ["generate", input, outDir],
            rawSource: true,
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
        });
        expect(fs.existsSync(path.join(outDir, "index.ts"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "tsconfig.json"))).toBeFalsy();
        expect(fs.existsSync(path.join(outDir, "package.json"))).toBeFalsy();
    });

    it("generates correct tsconfig", () => {
        expect(createTsconfigJson(true).compilerOptions.module).toEqual("commonjs");
        expect(createTsconfigJson(false).compilerOptions.module).toEqual("es2015");
    });

    it("generates code", async () => {
        jest.setTimeout(10000);
        await generateCommand.handler({
            _: ["generate", input, outDir],
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
            rawSource: false,
        });
        expect(fs.existsSync(path.join(outDir, "index.ts"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "tsconfig.json"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "package.json"))).toBeTruthy();
    });

    it("generated code installs dependencies", async () => {
        jest.setTimeout(10000);
        await generateCommand.handler({
            _: ["generate", input, outDir],
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
            rawSource: false,
        });
        await executeCommand("yarn install --no-lockfile", outDir);
        expect(fs.existsSync(path.join(outDir, "node_modules"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "node_modules/typescript/bin/tsc")));
    });

    jest.setTimeout(10000);
    it("generated code compiles", async () => {
        await generateCommand.handler({
            _: ["generate", input, outDir],
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
            rawSource: false,
        });
        await executeCommand("yarn install --no-lockfile", outDir);
        await executeCommand("yarn build", outDir);
        expect(fs.existsSync(path.join(outDir, "index.js"))).toBeTruthy();
    });

    it("generates .npmignore file", async () => {
        jest.setTimeout(10000);
        await generateCommand.handler({
            _: ["generate", input, outDir],
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
            rawSource: false,
        });
        expect(fs.existsSync(path.join(outDir, ".npmignore"))).toBeTruthy();
        expect(fs.readFileSync(path.join(outDir, ".npmignore"), { encoding: "utf8" })).toEqual(
            "*.ts\n!*.d.ts\ntsconfig.json",
        );
    });

    it("throws if missing rawSource or packageName/Version", async () => {
        await expect(
            generateCommand.handler({
                _: ["generate", input, outDir],
                nodeCompatibleModules: false,
                rawSource: false,
            }),
        ).rejects.toThrowError('Must either specify "rawSource" or specify "packageName" and "packageVersion"');
    });

    it("throws on missing directory", async () => {
        await expect(
            generateCommand.handler({
                _: ["generate", input, "missing"],
                packageName: "foo",
                packageVersion: "1.0.0",
                nodeCompatibleModules: false,
                rawSource: false,
            }),
        ).rejects.toThrowError('Directory "missing" does not exist');
    });

    function executeCommand(command: string, cwd: string) {
        return new Promise<number>((resolve, reject) => {
            const child = child_process.exec(command, { cwd });
            child.on("error", reject);
            child.on("exit", code => {
                resolve(code || 0);
            });
        });
    }
});
