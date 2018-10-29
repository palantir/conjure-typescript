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

import { IType, ITypeDefinition, ITypeName, PrimitiveType } from "conjure-api";
import * as fs from "fs";
import * as path from "path";
import { directory } from "tempy";
import { SimpleAst } from "../simpleAst";
import { generateType } from "../typeGenerator";

export function assertOutputAndExpectedAreEqual(outDir: string, expectedDir: string, fname: string) {
    const actual = fs.readFileSync(path.join(outDir, fname), "utf8");
    if (process.env.RECREATE === "true") {
        fs.writeFileSync(path.join(expectedDir, fname), actual);
    } else {
        const expected = fs.readFileSync(path.join(expectedDir, fname), "utf8");
        expect(actual).toEqual(expected);
    }
}

function createSimpleObject(
    name: string,
    packageName: string,
): { typeName: ITypeName; definition: ITypeDefinition; reference: IType } {
    const typeName = { name, package: packageName };
    return {
        definition: ITypeDefinition.object({
            fields: [],
            typeName,
        }),
        reference: IType.reference(typeName),
        typeName,
    };
}

export const typesLocalObject = createSimpleObject("SomeObject", "com.palantir.types");
export const servicesLocalObject = createSimpleObject("SomeObject", "com.palantir.services");
export const importsLocalObject = createSimpleObject("SomeObject", "com.palantir.imports");
export const foreignObject = createSimpleObject("OtherObject", "com.palantir.other");

describe("testTypesGenerator", () => {
    const expectedDir = path.join(__dirname, "./resources");
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("generate type with many fields", async () => {
        await generateType(
            ITypeDefinition.object({
                typeName: { package: "com.palantir.types", name: "ManyFieldExample" },
                fields: [
                    { fieldName: "string", type: IType.primitive(PrimitiveType.STRING) },
                    { fieldName: "integer", type: IType.primitive(PrimitiveType.INTEGER) },
                    {
                        fieldName: "optionalItem",
                        type: IType.optional({ itemType: IType.primitive(PrimitiveType.STRING) }),
                    },
                    { fieldName: "items", type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }) },
                ],
            }),
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/manyFieldExample.ts");
    });

    it("generates types local object", async () => {
        await generateType(typesLocalObject.definition, new Map(), simpleAst);
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/someObject.ts");
    });

    it("generates services local object", async () => {
        await generateType(servicesLocalObject.definition, new Map(), simpleAst);
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "services/someObject.ts");
    });
    it("generates foreign object", async () => {
        await generateType(foreignObject.definition, new Map(), simpleAst);
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "other/otherObject.ts");
    });
});
