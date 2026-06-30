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
    DEFAULT_TYPE_GENERATION_FLAGS,
    FLAVORED_TYPE_GENERATION_FLAGS,
    USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
} from "../../../__tests__/utils/constants";
import { generateAlias, generateEnum, generateObject, generateUnion } from "../generators/generateType";
import { generateNonThrowingService } from "../generators/generateNonThrowingService";
import { generateThrowingService } from "../generators/generateThrowingService";
import { SimpleAst } from "../simpleAst";

describe("useDeserializer type generation", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    describe("enum", () => {
        it("emits _TypeName = enumType() descriptor constant", async () => {
            await generateEnum(
                {
                    typeName: { name: "SimpleEnum", package: "com.palantir.types" },
                    values: [{ value: "A" }, { value: "B" }],
                },
                simpleAst,
                USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/simpleEnum.ts"), "utf8");
            expect(contents).toContain(`from "conjure-client"`);
            expect(contents).toContain("enumType");
            expect(contents).toContain("export const _SimpleEnum = enumType();");
        });

        it("does not emit descriptor constant when flag is off", async () => {
            await generateEnum(
                {
                    typeName: { name: "SimpleEnum", package: "com.palantir.types" },
                    values: [{ value: "A" }, { value: "B" }],
                },
                simpleAst,
                DEFAULT_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/simpleEnum.ts"), "utf8");
            expect(contents).not.toContain("_SimpleEnum");
            expect(contents).not.toContain("enumType");
        });
    });

    describe("object", () => {
        it("emits _TypeName = object({...}) with primitive field descriptors", async () => {
            await generateObject(
                {
                    fields: [
                        { fieldName: "count", type: IType.primitive(PrimitiveType.INTEGER) },
                        { fieldName: "name", type: IType.primitive(PrimitiveType.STRING) },
                    ],
                    typeName: { name: "SimpleObject", package: "com.palantir.types" },
                },
                new Map(),
                simpleAst,
                USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/simpleObject.ts"), "utf8");
            expect(contents).toContain(`from "conjure-client"`);
            expect(contents).toContain("integer");
            expect(contents).toContain("stringType");
            expect(contents).toContain("object");
            expect(contents).toContain(
                `export const _SimpleObject = object({ "count": integer(), "name": stringType() });`,
            );
        });

        it("emits reference(() => _TypeName) for cross-type object fields", async () => {
            const enumTypeName = { name: "StatusEnum", package: "com.palantir.types" };
            const enumDef = ITypeDefinition.enum_({ typeName: enumTypeName, values: [{ value: "OK" }] });
            await generateObject(
                {
                    fields: [{ fieldName: "status", type: IType.reference(enumTypeName) }],
                    typeName: { name: "StatusHolder", package: "com.palantir.types" },
                },
                new Map([[createHashableTypeName(enumTypeName), enumDef]]),
                simpleAst,
                USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/statusHolder.ts"), "utf8");
            expect(contents).toContain(`_StatusEnum`);
            expect(contents).toContain(`reference(() => _StatusEnum)`);
            expect(contents).toContain(
                `export const _StatusHolder = object({ "status": reference(() => _StatusEnum) });`,
            );
        });

        it("inlines non-flavorized alias transparently in object descriptor", async () => {
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
                USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/aliasHolder.ts"), "utf8");
            // Non-flavorized alias inlines to the underlying primitive descriptor
            expect(contents).toContain(`export const _AliasHolder = object({ "value": stringType() });`);
            expect(contents).not.toContain("reference");
        });

        it("does not emit descriptor constant when flag is off", async () => {
            await generateObject(
                {
                    fields: [{ fieldName: "count", type: IType.primitive(PrimitiveType.INTEGER) }],
                    typeName: { name: "SimpleObject", package: "com.palantir.types" },
                },
                new Map(),
                simpleAst,
                DEFAULT_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/simpleObject.ts"), "utf8");
            expect(contents).not.toContain("_SimpleObject");
        });
    });

    describe("union", () => {
        it("emits _TypeName = union({...}) with primitive variant descriptors", async () => {
            await generateUnion(
                {
                    typeName: { name: "SimpleUnion", package: "com.palantir.types" },
                    union: [
                        { fieldName: "integer", type: IType.primitive(PrimitiveType.INTEGER) },
                        { fieldName: "string", type: IType.primitive(PrimitiveType.STRING) },
                    ],
                },
                new Map(),
                simpleAst,
                USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/simpleUnion.ts"), "utf8");
            expect(contents).toContain(`from "conjure-client"`);
            expect(contents).toContain("union");
            expect(contents).toContain(
                `export const _SimpleUnion = union({ "integer": integer(), "string": stringType() });`,
            );
        });

        it("emits optional and list field descriptors in union", async () => {
            await generateUnion(
                {
                    typeName: { name: "ComplexUnion", package: "com.palantir.types" },
                    union: [
                        {
                            fieldName: "items",
                            type: IType.list({ itemType: IType.primitive(PrimitiveType.STRING) }),
                        },
                        {
                            fieldName: "value",
                            type: IType.optional({ itemType: IType.primitive(PrimitiveType.INTEGER) }),
                        },
                    ],
                },
                new Map(),
                simpleAst,
                USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/complexUnion.ts"), "utf8");
            expect(contents).toContain(`"items": list(stringType())`);
            expect(contents).toContain(`"value": optional(integer())`);
        });

        it("does not emit descriptor constant when flag is off", async () => {
            await generateUnion(
                {
                    typeName: { name: "SimpleUnion", package: "com.palantir.types" },
                    union: [{ fieldName: "x", type: IType.primitive(PrimitiveType.STRING) }],
                },
                new Map(),
                simpleAst,
                DEFAULT_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/simpleUnion.ts"), "utf8");
            expect(contents).not.toContain("_SimpleUnion");
        });
    });

    describe("flavorized alias", () => {
        it("emits _TypeName = alias(rid()) descriptor constant", async () => {
            await generateAlias(
                {
                    alias: IType.primitive(PrimitiveType.RID),
                    typeName: { name: "EntityRid", package: "com.palantir.types" },
                },
                new Map(),
                simpleAst,
                { ...FLAVORED_TYPE_GENERATION_FLAGS, useDeserializer: true },
            );
            const contents = fs.readFileSync(path.join(outDir, "types/entityRid.ts"), "utf8");
            expect(contents).toContain(`from "conjure-client"`);
            expect(contents).toContain("alias");
            expect(contents).toContain("rid");
            expect(contents).toContain("export const _EntityRid = alias(rid());");
        });

        it("does not emit descriptor constant for flavorized alias when flag is off", async () => {
            await generateAlias(
                {
                    alias: IType.primitive(PrimitiveType.RID),
                    typeName: { name: "EntityRid", package: "com.palantir.types" },
                },
                new Map(),
                simpleAst,
                FLAVORED_TYPE_GENERATION_FLAGS,
            );
            const contents = fs.readFileSync(path.join(outDir, "types/entityRid.ts"), "utf8");
            expect(contents).not.toContain("_EntityRid");
        });
    });
});

describe("useDeserializer throwing service generation", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("wraps primitive return type with deserialize", async () => {
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
            USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/countService.ts"), "utf8");
        expect(contents).toContain("deserialize");
        expect(contents).toContain("integer");
        expect(contents).toContain(".then((__result) => deserialize(integer(), __result));");
    });

    it("wraps object return type with reference descriptor", async () => {
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
            USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/objectService.ts"), "utf8");
        expect(contents).toContain("deserialize");
        expect(contents).toContain("_MyObject");
        expect(contents).toContain("reference");
        expect(contents).toContain(".then((__result) => deserialize(reference(() => _MyObject), __result));");
    });

    it("does not emit deserialize for void return type", async () => {
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
            USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/voidService.ts"), "utf8");
        expect(contents).not.toContain("deserialize");
    });

    it("does not wrap with deserialize when flag is off", async () => {
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
            DEFAULT_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/countService.ts"), "utf8");
        expect(contents).not.toContain("deserialize");
        expect(contents).not.toContain(".then(");
    });
});

describe("useDeserializer non-throwing service generation", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("wraps primitive return type with deserialize inside IConjureResult", async () => {
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
            USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/countServiceWithErrors.ts"), "utf8");
        expect(contents).toContain("deserialize");
        expect(contents).toContain(
            `.then((__result) => ({ status: "success" as const, result: deserialize(integer(), __result) }))`,
        );
    });

    it("does not wrap with deserialize when flag is off", async () => {
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
        expect(contents).not.toContain("deserialize");
        expect(contents).toContain(`.then(result => ({ status: "success" as const, result }))`);
    });

    it("does not deserialize binary (octet-stream) streaming endpoints", async () => {
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
            new Map(),
            simpleAst,
            USE_DESERIALIZER_TYPE_GENERATION_FLAGS,
        );
        const contents = fs.readFileSync(path.join(outDir, "services/binaryServiceWithErrors.ts"), "utf8");
        // Binary (octet-stream) endpoints are exempt from deserialization per the spec
        expect(contents).not.toContain("deserialize");
    });
});
