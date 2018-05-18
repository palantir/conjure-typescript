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

import * as fs from "fs";
import * as path from "path";
import { directory, file } from "tempy";
import { generateCode, generateModule } from "../index";

describe("cli", () => {
    let output: string;
    let input: string;
    beforeEach(() => {
        input = file();
        output = directory();
    });

    it("throws on missing directory", () => {
        expect(() => generateCode({ input, output: "missing", packageName: "foo", version: "1.0.0" })).toThrow(
            "Directory missing does not exist",
        );
    });

    it("generates correct module", () => {
        const packageName = "somePackage";
        const version = "1.0.0";
        generateModule(packageName, version, output);

        // tslint:disable:object-literal-sort-keys
        expect(JSON.parse(fs.readFileSync(path.join(output, "package.json"), "utf8"))).toEqual({
            name: "somePackage",
            version: "1.0.0",
            sideEffects: false,
            peerDependencies: {
                "conjure-client": require("../../package.json").dependencies["conjure-client"],
            },
            author: "Conjure",
            license: "UNLICENSED",
        });
        expect(JSON.parse(fs.readFileSync(path.join(output, "tsconfig.json"), "utf8"))).toEqual({
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
        });
        // tslint:enable:object-literal-sort-keys
    });
});
