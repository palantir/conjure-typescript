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
import { IPackageJson } from "../../../utils";
import { createPackageJson, createTsconfigJson, GenerateCommand } from "../index";

describe("generate command", () => {
    let outDir: string;
    const input = path.join(__dirname, "./resources/ir/service.json");
    const generateCommand = new GenerateCommand();

    beforeEach(() => {
        outDir = directory();
    });

    it("generates correct packageJson", () => {
        const inputPackage: IPackageJson = {
            dependencies: { "conjure-client": "1.0.0" },
            devDependencies: { typescript: "2.7.2" },
        };
        expect(createPackageJson(inputPackage, "foo", "1.0.0")).toEqual({
            name: "foo",
            version: "1.0.0",
            main: "index.js",
            types: "index.d.ts",
            sideEffects: false,
            scripts: {
                build: "tsc",
            },
            peerDependencies: { "conjure-client": "1.0.0" },
            devDependencies: {
                "conjure-client": "1.0.0",
                typescript: "2.7.2",
            },
            author: "Conjure",
            license: "UNLICENSED",
        });
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
            generateGitIgnore: false,
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
            generateGitIgnore: false,
        });
        await executeCommand("yarn install --no-lockfile", outDir);
        expect(fs.existsSync(path.join(outDir, "node_modules"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "node_modules/typescript/bin/tsc")));
    });

    it("generated code compiles", async () => {
        jest.setTimeout(10000);
        await generateCommand.handler({
            _: ["generate", input, outDir],
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
            generateGitIgnore: false,
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
            generateGitIgnore: false,
        });
        expect(fs.existsSync(path.join(outDir, ".npmignore"))).toBeTruthy();
        expect(fs.readFileSync(path.join(outDir, ".npmignore"), { encoding: "utf8" })).toEqual(
            "*.ts\n!*.d.ts\ntsconfig.json",
        );
    });

    it("generates .gitignore files", async () => {
        await generateCommand.handler({
            _: ["generate", input, outDir],
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
            generateGitIgnore: true,
        });
        expect(fs.existsSync(path.join(outDir, ".gitignore"))).toBeTruthy();
    });

    it("tolerates existing .gitignore files", async () => {
        fs.writeFileSync(path.join(outDir, ".gitignore"), "");
        await generateCommand.handler({
            _: ["generate", input, outDir],
            packageName: "foo",
            packageVersion: "1.0.0",
            nodeCompatibleModules: false,
            generateGitIgnore: true,
        });
    });

    it("throws on missing directory", async () => {
        await expect(
            generateCommand.handler({
                _: ["generate", input, "missing"],
                packageName: "foo",
                packageVersion: "1.0.0",
                nodeCompatibleModules: false,
                generateGitIgnore: false,
            }),
        ).rejects.toThrowError('Directory "missing" does not exist');
    });

    function executeCommand(command: string, cwd: string) {
        return new Promise<number>((resolve, reject) => {
            const child = child_process.exec(command, { cwd });
            child.on("error", reject);
            child.on("exit", code => {
                resolve(code);
            });
        });
    }
});
