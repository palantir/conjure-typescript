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

import { ITypeDefinition } from "@conjure/conjure-api";
import * as fs from "fs";
import * as path from "path";
import { directory } from "tempy";
import { generate } from "../generate";

describe("generator", () => {
    let outDir: string;

    beforeEach(() => {
        outDir = directory();
    });

    it("emits multiple files into same directory without errors", async () => {
        const enumDefinition1: ITypeDefinition = ITypeDefinition.enum_({
            typeName: { name: "MyEnum", package: "com.palantir.integration" },
            values: [{ value: "FOO" }],
        });
        const enumDefinition2: ITypeDefinition = ITypeDefinition.enum_({
            typeName: { name: "MyEnum2", package: "com.palantir.integration" },
            values: [{ value: "FOO" }],
        });
        await generate(
            {
                errors: [],
                services: [],
                types: [enumDefinition1, enumDefinition2],
                version: 1,
            },
            outDir,
        );
        const outFile1 = path.join(outDir, "integration/myEnum.ts");
        const outFile2 = path.join(outDir, "integration/myEnum2.ts");
        expect(fs.existsSync(outFile1)).toBeTruthy();
        expect(fs.existsSync(outFile2)).toBeTruthy();
    });

    it("generates multiple modules", async () => {
        const enumDefinition1: ITypeDefinition = ITypeDefinition.enum_({
            typeName: { name: "MyEnum", package: "com.palantir.integration.first" },
            values: [{ value: "FOO" }],
        });
        const enumDefinition2: ITypeDefinition = ITypeDefinition.enum_({
            typeName: { name: "MyEnum2", package: "com.palantir.integration.second" },
            values: [{ value: "FOO" }],
        });
        await generate(
            {
                errors: [],
                services: [],
                types: [enumDefinition1, enumDefinition2],
                version: 1,
            },
            outDir,
        );
        expect(fs.existsSync(path.join(outDir, "integration-first/myEnum.ts"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "integration-second/myEnum2.ts"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "integration-first/index.ts"))).toBeTruthy();
        expect(fs.existsSync(path.join(outDir, "integration-second/index.ts"))).toBeTruthy();
        expect(fs.readFileSync(path.join(outDir, "index.ts"), "utf8")).toEqual(
            `import * as integrationFirst from "./integration-first";
import * as integrationSecond from "./integration-second";

export { integrationFirst };
export { integrationSecond };
`,
        );
    });
});
