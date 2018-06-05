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
import { generateCode } from "../index";

describe("end to end tests", () => {
    let outDir: string;
    const input = path.join(__dirname, "./resources/ir/service.json");

    beforeEach(() => {
        outDir = directory();
    });

    it("generates code", async () => {
        await generateCode({ input, output: outDir, packageName: "foo", version: "1.0.0", moduleType: "es2015" });
        expect(fs.existsSync(path.join(outDir, "index.ts"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "package.json"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "tsconfig.json"))).toBeTruthy();
    });

    it("generated code installs dependencies", async () => {
        await generateCode({ input, output: outDir, packageName: "foo", version: "1.0.0", moduleType: "es2015" });
        await executeCommand("yarn install --no-lockfile", outDir);
        expect(fs.existsSync(path.join(outDir, "node_modules"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "node_modules/typescript/bin/tsc")));
    });

    it("generated code compiles", async () => {
        await generateCode({ input, output: outDir, packageName: "foo", version: "1.0.0", moduleType: "es2015" });
        await executeCommand("yarn install --no-lockfile", outDir);
        await executeCommand("yarn build", outDir);
        expect(fs.existsSync(path.join(outDir, "index.js"))).toBeTruthy();
    });

    it("throws if invalid moduleType", async () => {
        await expect(
            generateCode({ input, output: outDir, packageName: "foo", version: "1.0.0", moduleType: "foo" }),
        ).rejects.toThrowError('Expected moduleType to be either "es2015" or "commonjs", but found "foo"');
    });

    it("throws on missing directory", async () => {
        await expect(
            generateCode({ input, output: "missing", packageName: "foo", version: "1.0.0", moduleType: "es2015" }),
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
