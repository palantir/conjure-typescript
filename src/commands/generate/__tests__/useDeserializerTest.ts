/**
 * @license
 * Copyright 2026 Palantir Technologies, Inc.
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

import { HttpMethod, IType, ITypeDefinition, PrimitiveType } from "conjure-api";
import * as fs from "fs";
import * as path from "path";
import { directory } from "tempy";
import { createHashableTypeName } from "../../../utils/hashingUtils";
import {
    APPLY_FROM_JSON_GENERATION_FLAGS,
    DEFAULT_TYPE_GENERATION_FLAGS,
    FLAVORED_TYPE_GENERATION_FLAGS,
    FROM_JSON_GENERATION_FLAGS,
    JSON_TYPES_GENERATION_FLAGS,
} from "../../../__tests__/utils/constants";
import { generateAlias, generateEnum, generateObject, generateUnion } from "../generators/generateType";
import { generateNonThrowingService } from "../generators/generateNonThrowingService";
import { generateThrowingService } from "../generators/generateThrowingService";
import { SimpleAst } from "../simpleAst";

// ---------------------------------------------------------------------------
// generateJsonTypes — IFooJSON interface generation
// ---------------------------------------------------------------------------

describe("generateJsonTypes — IFooJSON interface generation", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("emits IFooJSON interface with nullable collection fields", async () => {
        await generateObject(
            {
                fields: [
                    { fieldName: "items", type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }) },
                    { fieldName: "count", type: IType.primitive(PrimitiveType.INTEGER) },
                ],
                typeName: { name: "SimpleObject", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
            JSON_TYPES_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/simpleObject.ts"), "utf8");
        expect(contents).toContain("ISimpleObjectJSON");
        // list field is nullable in JSON
        expect(contents).toContain("Array<string> | null | undefined");
        // primitive field is unchanged
        expect(contents).toContain("count");
        // Regular interface still present
        expect(contents).toContain("ISimpleObject");
    });

    it("emits IFooJSON with IBarJSON reference for object fields", async () => {
        const childTypeName = { name: "ChildObject", package: "com.palantir.types" };
        const childDef = ITypeDefinition.object({
            typeName: childTypeName,
            fields: [{ fieldName: "id", type: IType.primitive(PrimitiveType.STRING) }],
        });
        await generateObject(
            {
                fields: [{ fieldName: "child", type: IType.reference(childTypeName) }],
                typeName: { name: "ParentObject", package: "com.palantir.types" },
            },
            new Map([[createHashableTypeName(childTypeName), childDef]]),
            simpleAst,
            JSON_TYPES_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/parentObject.ts"), "utf8");
        expect(contents).toContain("IParentObjectJSON");
        // Reference field uses the JSON variant
        expect(contents).toContain("IChildObjectJSON");
    });

    it("does not emit IFooJSON for enums", async () => {
        await generateEnum(
            {
                typeName: { name: "SimpleEnum", package: "com.palantir.types" },
                values: [{ value: "A" }, { value: "B" }],
            },
            simpleAst,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/simpleEnum.ts"), "utf8");
        expect(contents).not.toContain("JSON");
        expect(contents).not.toContain("fromSimpleEnumJson");
    });

    it("does not emit IFooJSON for flavorized aliases", async () => {
        await generateAlias(
            {
                alias: IType.primitive(PrimitiveType.RID),
                typeName: { name: "EntityRid", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
            { ...FLAVORED_TYPE_GENERATION_FLAGS, generateJsonTypes: true },
        );
        const contents = fs.readFileSync(path.join(outDir, "types/entityRid.ts"), "utf8");
        expect(contents).not.toContain("JSON");
        expect(contents).not.toContain("fromEntityRidJson");
    });

    it("does not emit IFooJSON when all flags are off", async () => {
        await generateObject(
            {
                fields: [
                    { fieldName: "items", type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }) },
                ],
                typeName: { name: "SimpleObject", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/simpleObject.ts"), "utf8");
        expect(contents).not.toContain("ISimpleObjectJSON");
        expect(contents).not.toContain("fromSimpleObjectJson");
    });

    it("emits IFooJSON for unions with nullable collection variants", async () => {
        await generateUnion(
            {
                typeName: { name: "SimpleUnion", package: "com.palantir.types" },
                union: [
                    { fieldName: "items", type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }) },
                    { fieldName: "count", type: IType.primitive(PrimitiveType.INTEGER) },
                ],
            },
            new Map(),
            simpleAst,
            JSON_TYPES_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/simpleUnion.ts"), "utf8");
        expect(contents).toContain("ISimpleUnionJSON");
        expect(contents).toContain("Array<string> | null | undefined");
    });
});

// ---------------------------------------------------------------------------
// generateFromJson — fromFooJson() function generation
// ---------------------------------------------------------------------------

describe("generateFromJson — fromFooJson() function generation", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("emits fromFooJson with ?? [] for list fields", async () => {
        await generateObject(
            {
                fields: [
                    { fieldName: "items", type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }) },
                    { fieldName: "count", type: IType.primitive(PrimitiveType.INTEGER) },
                ],
                typeName: { name: "SimpleObject", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
            FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/simpleObject.ts"), "utf8");
        expect(contents).toContain("fromSimpleObjectJson");
        expect(contents).toContain("ISimpleObjectJSON");
        // list field null-coerced
        expect(contents).toContain("json.items ?? []");
        // primitive field passed through unchanged
        expect(contents).toContain("json.count");
    });

    it("emits fromFooJson calling fromBarJson for reference fields", async () => {
        const childTypeName = { name: "ChildObject", package: "com.palantir.types" };
        const childDef = ITypeDefinition.object({
            typeName: childTypeName,
            fields: [{ fieldName: "id", type: IType.primitive(PrimitiveType.STRING) }],
        });
        await generateObject(
            {
                fields: [{ fieldName: "child", type: IType.reference(childTypeName) }],
                typeName: { name: "ParentObject", package: "com.palantir.types" },
            },
            new Map([[createHashableTypeName(childTypeName), childDef]]),
            simpleAst,
            FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/parentObject.ts"), "utf8");
        expect(contents).toContain("fromParentObjectJson");
        expect(contents).toContain("fromChildObjectJson");
        expect(contents).toContain("fromChildObjectJson(json.child)");
    });

    it("inlines non-flavorized alias transparently in fromFooJson", async () => {
        const stringAliasName = { name: "RawAlias", package: "com.palantir.types" };
        const stringAlias = ITypeDefinition.alias({
            alias: { primitive: PrimitiveType.STRING, type: "primitive" },
            typeName: stringAliasName,
        });
        await generateObject(
            {
                fields: [{ fieldName: "value", type: IType.reference(stringAliasName) }],
                typeName: { name: "AliasHolder", package: "com.palantir.types" },
            },
            new Map([[createHashableTypeName(stringAliasName), stringAlias]]),
            simpleAst,
            FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/aliasHolder.ts"), "utf8");
        expect(contents).toContain("fromAliasHolderJson");
        // Non-flavorized alias: field value passed through directly (string is not null-coerced)
        expect(contents).toContain("json.value");
        expect(contents).not.toContain("fromRawAliasJson");
    });

    it("emits fromFooJson with switch statement for unions", async () => {
        await generateUnion(
            {
                typeName: { name: "SimpleUnion", package: "com.palantir.types" },
                union: [
                    { fieldName: "items", type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }) },
                    { fieldName: "count", type: IType.primitive(PrimitiveType.INTEGER) },
                ],
            },
            new Map(),
            simpleAst,
            FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/simpleUnion.ts"), "utf8");
        expect(contents).toContain("fromSimpleUnionJson");
        expect(contents).toContain(`switch (json.type)`);
        expect(contents).toContain(`case "items"`);
        expect(contents).toContain("json.items ?? []");
        expect(contents).toContain(`case "count"`);
    });

    it("does not emit fromFooJson when generateFromJson flag is off", async () => {
        await generateObject(
            {
                fields: [{ fieldName: "items", type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }) }],
                typeName: { name: "SimpleObject", package: "com.palantir.types" },
            },
            new Map(),
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "types/simpleObject.ts"), "utf8");
        expect(contents).not.toContain("fromSimpleObjectJson");
    });
});

// ---------------------------------------------------------------------------
// applyFromJson — throwing service generation
// ---------------------------------------------------------------------------

describe("applyFromJson throwing service generation", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("wraps object return type with fromFooJson", async () => {
        const objectTypeName = { name: "MyObject", package: "com.palantir.services" };
        const objectDef = ITypeDefinition.object({
            typeName: objectTypeName,
            fields: [{ fieldName: "id", type: IType.primitive(PrimitiveType.STRING) }],
        });
        await generateThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "getObject",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/object",
                        markers: [],
                        returns: IType.reference(objectTypeName),
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "ObjectService", package: "com.palantir.services" },
            },
            new Map([[createHashableTypeName(objectTypeName), objectDef]]),
            simpleAst,
            APPLY_FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/objectService.ts"), "utf8");
        expect(contents).toContain("fromMyObjectJson");
        expect(contents).toContain("IMyObjectJSON");
        expect(contents).toContain(".then(fromMyObjectJson)");
        expect(contents).toContain(".call<IMyObjectJSON>(");
    });

    it("does not wrap primitive return type", async () => {
        await generateThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "getCount",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/count",
                        markers: [],
                        returns: { primitive: PrimitiveType.INTEGER, type: "primitive" },
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "CountService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
            APPLY_FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/countService.ts"), "utf8");
        expect(contents).not.toContain("fromCountJson");
        expect(contents).not.toContain(".then(");
    });

    it("does not wrap void return type", async () => {
        await generateThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "doSomething",
                        httpMethod: HttpMethod.POST,
                        httpPath: "/do",
                        markers: [],
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "VoidService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
            APPLY_FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/voidService.ts"), "utf8");
        expect(contents).not.toContain(".then(");
    });

    it("wraps list<object> return type with null-coercing map", async () => {
        const objectTypeName = { name: "Item", package: "com.palantir.services" };
        const objectDef = ITypeDefinition.object({
            typeName: objectTypeName,
            fields: [{ fieldName: "id", type: IType.primitive(PrimitiveType.STRING) }],
        });
        await generateThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "getItems",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/items",
                        markers: [],
                        returns: IType.list({ itemType: IType.reference(objectTypeName) }),
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "ItemService", package: "com.palantir.services" },
            },
            new Map([[createHashableTypeName(objectTypeName), objectDef]]),
            simpleAst,
            APPLY_FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/itemService.ts"), "utf8");
        expect(contents).toContain("fromItemJson");
        expect(contents).toContain("Array<IItemJSON> | null | undefined");
        expect(contents).toContain("fromItemJson");
        expect(contents).toContain(".map((item) => fromItemJson(item))");
    });

    it("does not apply fromJson when flag is off", async () => {
        const objectTypeName = { name: "MyObject", package: "com.palantir.services" };
        const objectDef = ITypeDefinition.object({
            typeName: objectTypeName,
            fields: [{ fieldName: "id", type: IType.primitive(PrimitiveType.STRING) }],
        });
        await generateThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "getObject",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/object",
                        markers: [],
                        returns: IType.reference(objectTypeName),
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "ObjectService", package: "com.palantir.services" },
            },
            new Map([[createHashableTypeName(objectTypeName), objectDef]]),
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/objectService.ts"), "utf8");
        expect(contents).not.toContain("fromMyObjectJson");
        expect(contents).not.toContain(".then(");
    });
});

// ---------------------------------------------------------------------------
// applyFromJson — non-throwing service generation
// ---------------------------------------------------------------------------

describe("applyFromJson non-throwing service generation", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("wraps object return type with fromFooJson inside IConjureResult", async () => {
        const objectTypeName = { name: "MyObject", package: "com.palantir.services" };
        const objectDef = ITypeDefinition.object({
            typeName: objectTypeName,
            fields: [{ fieldName: "id", type: IType.primitive(PrimitiveType.STRING) }],
        });
        await generateNonThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "getObject",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/object",
                        markers: [],
                        returns: IType.reference(objectTypeName),
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "ObjectService", package: "com.palantir.services" },
            },
            new Map([[createHashableTypeName(objectTypeName), objectDef]]),
            simpleAst,
            APPLY_FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/objectServiceWithErrors.ts"), "utf8");
        expect(contents).toContain("fromMyObjectJson");
        expect(contents).toContain("IMyObjectJSON");
        expect(contents).toContain(
            `.then((__result) => ({ status: "success" as const, result: fromMyObjectJson(__result) }))`,
        );
    });

    it("does not apply fromJson when flag is off", async () => {
        await generateNonThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "getCount",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/count",
                        markers: [],
                        returns: { primitive: PrimitiveType.INTEGER, type: "primitive" },
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "CountService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/countServiceWithErrors.ts"), "utf8");
        expect(contents).not.toContain("fromCountJson");
        expect(contents).toContain(`.then(result => ({ status: "success" as const, result }))`);
    });

    it("does not deserialize binary (octet-stream) streaming endpoints", async () => {
        const objectTypeName = { name: "MyObject", package: "com.palantir.services" };
        const objectDef = ITypeDefinition.object({
            typeName: objectTypeName,
            fields: [{ fieldName: "id", type: IType.primitive(PrimitiveType.STRING) }],
        });
        await generateNonThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "download",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/download",
                        markers: [],
                        returns: { primitive: PrimitiveType.BINARY, type: "primitive" },
                        tags: [],
                        errors: [],
                    },
                ],
                serviceName: { name: "BinaryService", package: "com.palantir.services" },
            },
            new Map([[createHashableTypeName(objectTypeName), objectDef]]),
            simpleAst,
            APPLY_FROM_JSON_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/binaryServiceWithErrors.ts"), "utf8");
        // Binary endpoints are exempt from fromJson application
        expect(contents).not.toContain("fromMyObjectJson");
        expect(contents).not.toContain("IMyObjectJSON");
    });
});
