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

import { IType, ITypeDefinition, PrimitiveType } from "conjure-api";
import * as fs from "fs";
import * as path from "path";
import { directory } from "tempy";
import { SimpleAst } from "../simpleAst";
import { generateEnum, generateObject, generateUnion } from "../typeGenerator";
import { createHashableTypeName } from "../utils";
import {
    assertOutputAndExpectedAreEqual,
    foreignObject,
    typesLocalObject as localObject,
} from "./testTypesGeneratorTest";

const stringAliasName = { name: "StringAlias", package: "com.palantir.types" };
const stringAlias: ITypeDefinition = ITypeDefinition.alias({
    alias: { primitive: PrimitiveType.STRING, type: "primitive" },
    typeName: stringAliasName,
});
const stringAliasReference: IType = IType.reference(stringAliasName);

describe("typeGenerator", () => {
    const expectedDir = path.join(__dirname, "./resources");
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("emits to the correct location", async () => {
        await generateEnum(
            {
                typeName: { name: "MyEnum", package: "com.palantir.types" },
                values: [{ value: "FOO" }, { value: "BAR" }],
            },
            simpleAst,
        );
        const outFile = path.join(outDir, "types/myEnum.ts");
        expect(fs.existsSync(outFile)).toBeTruthy();
    });

    it("emits enums", async () => {
        await generateEnum(
            {
                typeName: { name: "EnumExample", package: "com.palantir.types" },
                values: [{ value: "ONE" }, { value: "TWO" }],
            },
            simpleAst,
        );

        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/enumExample.ts");
    });

    it("emits enums with docs", async () => {
        await generateEnum(
            {
                docs: "Some documentation",
                typeName: { name: "EnumWithDocs", package: "com.palantir.types" },
                values: [{ value: "FOO", docs: "Some field documentation" }, { value: "BAR" }],
            },
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/enumWithDocs.ts");
    });

    it("emits objects with primitive fields", async () => {
        await generateObject(
            {
                fields: [
                    {
                        fieldName: "bar",
                        type: IType.primitive(PrimitiveType.INTEGER),
                    },
                    {
                        fieldName: "foo",
                        type: IType.primitive(PrimitiveType.STRING),
                    },
                ],
                typeName: { name: "PrimitiveObject", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/primitiveObject.ts");
    });

    it("emits objects with uuids ", async () => {
        await generateObject(
            {
                fields: [
                    {
                        fieldName: "uuid",
                        type: IType.primitive(PrimitiveType.UUID),
                    },
                ],
                typeName: { name: "UuidObject", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/uuidObject.ts");
    });

    it("emits objects with map of enum", async () => {
        const someEnum = {
            docs: "Some documentation",
            typeName: { name: "EnumWithDocs", package: "com.palantir.types" },
            values: [{ value: "FOO", docs: "Some field documentation" }, { value: "BAR" }],
        };
        await generateObject(
            {
                fields: [
                    {
                        fieldName: "someMap",
                        type: IType.map({
                            keyType: IType.reference(someEnum.typeName),
                            valueType: IType.primitive(PrimitiveType.STRING),
                        }),
                    },
                ],
                typeName: { name: "EnumMapObject", package: "com.palantir.types" },
            },
            new Map([[createHashableTypeName(someEnum.typeName), ITypeDefinition.enum_(someEnum)]]),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/enumMapObject.ts");
    });

    it("emits objects with references", async () => {
        await generateObject(
            {
                fields: [
                    {
                        fieldName: "differentPackage",
                        type: foreignObject.reference,
                    },
                    {
                        fieldName: "samePackage",
                        type: localObject.reference,
                    },
                ],
                typeName: { name: "ReferenceObject", package: "com.palantir.types" },
            },
            new Map([
                [createHashableTypeName(foreignObject.typeName), foreignObject.definition],
                [createHashableTypeName(localObject.typeName), localObject.definition],
            ]),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/referenceObject.ts");
    });

    it("emits objects with alias references", async () => {
        await generateObject(
            {
                fields: [
                    {
                        fieldName: "referenceAlias",
                        type: localObject.reference,
                    },
                    {
                        fieldName: "stringAlias",
                        type: stringAliasReference,
                    },
                ],
                typeName: { name: "AliasReferenceObject", package: "com.palantir.types" },
            },
            new Map<string, ITypeDefinition>([
                [createHashableTypeName(localObject.typeName), localObject.definition],
                [createHashableTypeName(stringAliasName), stringAlias],
            ]),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/aliasReferenceObject.ts");
    });

    it("handles nested aliases", async () => {
        const stringAliasAlias: ITypeDefinition = ITypeDefinition.alias({
            alias: { reference: stringAlias.alias.typeName, type: "reference" },
            typeName: { name: "StringAliasAlias", package: "com.palantir.types" },
        });

        await generateObject(
            {
                fields: [
                    {
                        fieldName: "stringAliasAlias",
                        type: IType.reference(stringAliasAlias.alias.typeName),
                    },
                ],
                typeName: { name: "NestedAliasReferenceObject", package: "com.palantir.types" },
            },
            new Map([
                [createHashableTypeName(stringAliasAlias.alias.typeName), stringAliasAlias],
                [createHashableTypeName(stringAlias.alias.typeName), stringAlias],
            ]),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/nestedAliasReferenceObject.ts");
    });

    it("emits objects with optional fields", async () => {
        await generateObject(
            {
                fields: [
                    {
                        fieldName: "optionalString",
                        type: {
                            optional: {
                                itemType: { primitive: PrimitiveType.STRING, type: "primitive" },
                            },
                            type: "optional",
                        },
                    },
                ],
                typeName: { name: "OptionalObject", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/optionalObject.ts");
    });

    it("emits objects with docs", async () => {
        await generateObject(
            {
                docs: "my object",
                fields: [
                    {
                        docs: "docs",
                        fieldName: "bar",
                        type: IType.primitive(PrimitiveType.INTEGER),
                    },
                    {
                        docs: "more docs",
                        fieldName: "foo",
                        type: IType.primitive(PrimitiveType.STRING),
                    },
                ],
                typeName: { name: "ObjectWithDocs", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/objectWithDocs.ts");
    });

    it("emits unions with primitive fields", async () => {
        await generateUnion(
            {
                typeName: { name: "PrimitiveUnion", package: "com.palantir.types" },
                union: [
                    {
                        fieldName: "bar",
                        type: IType.primitive(PrimitiveType.INTEGER),
                    },
                    {
                        fieldName: "foo",
                        type: IType.primitive(PrimitiveType.STRING),
                    },
                    {
                        fieldName: "uuid",
                        type: IType.primitive(PrimitiveType.UUID),
                    },
                ],
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/primitiveUnion.ts");
    });

    it("emits complex union", async () => {
        await generateUnion(
            {
                typeName: { name: "UnionTypeExample", package: "com.palantir.types" },
                union: [
                    { fieldName: "string", type: IType.primitive(PrimitiveType.STRING) },
                    { fieldName: "set", type: IType.set({ itemType: IType.primitive(PrimitiveType.STRING) }) },
                ],
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/unionTypeExample.ts");
    });

    it("emits unions with docs", async () => {
        await generateUnion(
            {
                docs: "Some documentation",
                typeName: { name: "UnionWithDocs", package: "com.palantir.types" },
                union: [
                    {
                        docs: "Some field documentation",
                        fieldName: "bar",
                        type: IType.primitive(PrimitiveType.INTEGER),
                    },
                    {
                        fieldName: "foo",
                        type: IType.primitive(PrimitiveType.STRING),
                    },
                ],
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/unionWithDocs.ts");
    });

    it("sanitizes keywords in union factory names", async () => {
        await generateUnion(
            {
                typeName: { name: "MyUnion", package: "com.palantir.types" },
                union: [
                    {
                        fieldName: "enum",
                        type: IType.primitive(PrimitiveType.STRING),
                    },
                    {
                        fieldName: "function",
                        type: IType.primitive(PrimitiveType.INTEGER),
                    },
                ],
            },
            new Map(),
            simpleAst,
        );
        const outFile = path.join(outDir, "types/myUnion.ts");
        const contents = fs.readFileSync(outFile, "utf8");

        expect(contents).toContain(`function enum_(obj: string): IMyUnion_Enum {
    return {
        enum: obj,
        type: "enum",
    };
}`);
        expect(contents).toContain(`function function_(obj: number): IMyUnion_Function {
    return {
        function: obj,
        type: "function",
    };
}`);
    });

    it("emits imports for unions with references", async () => {
        await generateUnion(
            {
                typeName: { name: "MyUnion", package: "com.palantir.types" },
                union: [
                    {
                        fieldName: "bar",
                        type: foreignObject.reference,
                    },
                    {
                        fieldName: "foo",
                        type: localObject.reference,
                    },
                ],
            },
            new Map([
                [createHashableTypeName(foreignObject.typeName), foreignObject.definition],
                [createHashableTypeName(localObject.typeName), localObject.definition],
            ]),
            simpleAst,
        );
        const outFile = path.join(outDir, "types/myUnion.ts");
        const contents = fs.readFileSync(outFile, "utf8");
        expect(contents).toContain(
            `import { IOtherObject } from "../other/otherObject";
import { ISomeObject } from "./someObject";
`,
        );
    });

    it("emits unions with alias references", async () => {
        await generateUnion(
            {
                typeName: { name: "MyUnion", package: "com.palantir.types" },
                union: [
                    {
                        fieldName: "referenceAlias",
                        type: localObject.reference,
                    },
                    {
                        fieldName: "stringAlias",
                        type: stringAliasReference,
                    },
                ],
            },
            new Map<string, ITypeDefinition>([
                [createHashableTypeName(localObject.typeName), localObject.definition],
                [createHashableTypeName(stringAliasName), stringAlias],
            ]),
            simpleAst,
        );
        const outFile = path.join(outDir, "types/myUnion.ts");
        const contents = fs.readFileSync(outFile, "utf8");
        expect(contents).toContain(`import { ISomeObject } from "./someObject";

export interface IMyUnion_ReferenceAlias {
    'referenceAlias': ISomeObject;
    'type': "referenceAlias";
}

export interface IMyUnion_StringAlias {
    'stringAlias': string;
    'type': "stringAlias";
}`);
    });

    it("emits unions of unions", async () => {
        const littleTypeName = { name: "Little", package: "com.palantir.types" };
        const littleUnion = {
            typeName: littleTypeName,
            union: [{ fieldName: "double", type: IType.primitive(PrimitiveType.DOUBLE) }],
        };
        await generateUnion(littleUnion, new Map(), simpleAst);
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/little.ts");

        await generateUnion(
            {
                typeName: { name: "Big", package: "com.palantir.types" },
                union: [{ fieldName: "little", type: IType.reference(littleTypeName) }],
            },
            new Map([[createHashableTypeName(littleTypeName), ITypeDefinition.union(littleUnion)]]),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/big.ts");
    });

    it("emits recursively defined unions", async () => {
        const recursiveObject: ITypeDefinition = ITypeDefinition.union({
            typeName: { name: "RecursiveUnion", package: "com.palantir.types" },
            union: [
                {
                    fieldName: "recursiveField",
                    type: IType.reference({ name: "RecursiveUnion", package: "com.palantir.types" }),
                },
                {
                    fieldName: "stringAlias",
                    type: stringAliasReference,
                },
            ],
        });

        await generateUnion(
            recursiveObject.union,
            new Map<string, ITypeDefinition>([
                [createHashableTypeName(recursiveObject.union.typeName), recursiveObject],
                [createHashableTypeName(stringAliasName), stringAlias],
            ]),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/recursiveUnion.ts");
    });

    it("emits recursively defined objects", async () => {
        const recursiveObject: ITypeDefinition = ITypeDefinition.object({
            fields: [
                {
                    fieldName: "recursiveField",
                    type: IType.reference({ name: "RecursiveObject", package: "com.palantir.types" }),
                },
                {
                    fieldName: "stringAlias",
                    type: stringAliasReference,
                },
            ],
            typeName: { name: "RecursiveObject", package: "com.palantir.types" },
        });

        await generateObject(
            recursiveObject.object,
            new Map<string, ITypeDefinition>([
                [createHashableTypeName(recursiveObject.object.typeName), recursiveObject],
                [createHashableTypeName(stringAliasName), stringAlias],
            ]),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "types/recursiveObject.ts");
    });
});
