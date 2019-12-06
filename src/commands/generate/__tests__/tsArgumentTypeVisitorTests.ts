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
import { TsArgumentTypeVisitor } from "../tsArgumentTypeVisitor";
import { createHashableTypeName } from "../utils";

describe("TsTypeVisitor", () => {
    const binaryAliasName = { name: "BinaryAlias", package: "" };
    const binaryAliasReference = IType.reference(binaryAliasName);
    const binaryAlias = ITypeDefinition.alias({
        alias: { primitive: PrimitiveType.BINARY, type: "primitive" },
        typeName: binaryAliasName,
    });

    const fakeTypeName = { name: "someObject", package: "com.palantir.example" };

    const visitor = new TsArgumentTypeVisitor(
        new Map<string, ITypeDefinition>([[createHashableTypeName(binaryAliasName), binaryAlias]]),
        fakeTypeName,
        false,
    );

    const topLevelVisitor = new TsArgumentTypeVisitor(
        new Map<string, ITypeDefinition>([[createHashableTypeName(binaryAliasName), binaryAlias]]),
        fakeTypeName,
        true,
    );

    it("returns primitive types", () => {
        expect(visitor.primitive(PrimitiveType.STRING)).toEqual("string");
        expect(visitor.primitive(PrimitiveType.DATETIME)).toEqual("string");
        expect(visitor.primitive(PrimitiveType.INTEGER)).toEqual("number");
        expect(visitor.primitive(PrimitiveType.DOUBLE)).toEqual('number | "NaN"');
        expect(visitor.primitive(PrimitiveType.SAFELONG)).toEqual("number");
        expect(visitor.primitive(PrimitiveType.BINARY)).toEqual("string");
        expect(visitor.primitive(PrimitiveType.ANY)).toEqual("any");
        expect(visitor.primitive(PrimitiveType.BOOLEAN)).toEqual("boolean");
        expect(visitor.primitive(PrimitiveType.RID)).toEqual("string");
        expect(visitor.primitive(PrimitiveType.BEARERTOKEN)).toEqual("string");
        expect(visitor.primitive(PrimitiveType.UUID)).toEqual("string");
    });

    it("has correct top level types", () => {
        expect(topLevelVisitor.primitive(PrimitiveType.STRING)).toEqual("string");
        expect(topLevelVisitor.primitive(PrimitiveType.DATETIME)).toEqual("string");
        expect(topLevelVisitor.primitive(PrimitiveType.INTEGER)).toEqual("number");
        expect(topLevelVisitor.primitive(PrimitiveType.DOUBLE)).toEqual('number | "NaN"');
        expect(topLevelVisitor.primitive(PrimitiveType.SAFELONG)).toEqual("number");
        expect(topLevelVisitor.primitive(PrimitiveType.BINARY)).toEqual(
            "ReadableStream<Uint8Array> | BufferSource | Blob",
        );
        expect(topLevelVisitor.primitive(PrimitiveType.ANY)).toEqual("any");
        expect(topLevelVisitor.primitive(PrimitiveType.BOOLEAN)).toEqual("boolean");
        expect(topLevelVisitor.primitive(PrimitiveType.RID)).toEqual("string");
        expect(topLevelVisitor.primitive(PrimitiveType.BEARERTOKEN)).toEqual("string");
        expect(topLevelVisitor.primitive(PrimitiveType.UUID)).toEqual("string");
    });

    it("follows alias reference", () => {
        expect(visitor.reference(binaryAliasName)).toEqual("string");
        expect(topLevelVisitor.reference(binaryAliasName)).toEqual("ReadableStream<Uint8Array> | BufferSource | Blob");
    });

    it("returns optional type", () => {
        expect(visitor.optional({ itemType: binaryAliasReference })).toEqual("string | null");
        expect(topLevelVisitor.optional({ itemType: binaryAliasReference })).toEqual(
            "ReadableStream<Uint8Array> | BufferSource | Blob | null",
        );
    });
});
