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
import { TsReturnTypeVisitor } from "../tsReturnTypeVisitor";
import { createHashableTypeName } from "../utils";

describe("TsTypeVisitor", () => {
    const objectName = { name: "Object", package: "" };
    const objectReference = IType.reference(objectName);
    const object = ITypeDefinition.object({
        fields: [],
        typeName: objectName,
    });

    const aliasName = { name: "Alias", package: "" };
    const aliasReference = IType.reference(aliasName);
    const alias = ITypeDefinition.alias({
        alias: { primitive: PrimitiveType.STRING, type: "primitive" },
        typeName: aliasName,
    });

    const binaryAliasName = { name: "BinaryAlias", package: "" };
    const binaryAliasReference = IType.reference(binaryAliasName);
    const binaryAlias = ITypeDefinition.alias({
        alias: { primitive: PrimitiveType.BINARY, type: "primitive" },
        typeName: binaryAliasName,
    });

    const enumName = { name: "Enum", package: "" };
    const enumReference = IType.reference(enumName);
    const enumType = ITypeDefinition.enum_({
        typeName: enumName,
        values: [{ value: "FOO" }],
    });

    const fakeTypeName = { name: "someObject", package: "com.palantir.example" };

    const visitor = new TsReturnTypeVisitor(
        new Map<string, ITypeDefinition>([
            [createHashableTypeName(objectName), object],
            [createHashableTypeName(aliasName), alias],
            [createHashableTypeName(binaryAliasName), binaryAlias],
            [createHashableTypeName(enumName), enumType],
        ]),
        fakeTypeName,
        false,
    );

    const topLevelVisitor = new TsReturnTypeVisitor(
        new Map<string, ITypeDefinition>([
            [createHashableTypeName(objectName), object],
            [createHashableTypeName(aliasName), alias],
            [createHashableTypeName(binaryAliasName), binaryAlias],
            [createHashableTypeName(enumName), enumType],
        ]),
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
        expect(topLevelVisitor.primitive(PrimitiveType.BINARY)).toEqual("ReadableStream<Uint8Array>");
        expect(topLevelVisitor.primitive(PrimitiveType.ANY)).toEqual("any");
        expect(topLevelVisitor.primitive(PrimitiveType.BOOLEAN)).toEqual("boolean");
        expect(topLevelVisitor.primitive(PrimitiveType.RID)).toEqual("string");
        expect(topLevelVisitor.primitive(PrimitiveType.BEARERTOKEN)).toEqual("string");
        expect(topLevelVisitor.primitive(PrimitiveType.UUID)).toEqual("string");
    });

    it("produces error for unknown reference", () => {
        const tsType = () => new TsReturnTypeVisitor(new Map(), fakeTypeName, false).reference(objectName);
        expect(tsType).toThrowError(/unknown reference type/);
    });

    it("returns reference type", () => {
        expect(visitor.reference(objectName)).toEqual("IObject");
    });

    it("follows alias reference", () => {
        expect(visitor.reference(aliasName)).toEqual("string");
        expect(visitor.reference(binaryAliasName)).toEqual("string");
        expect(topLevelVisitor.reference(aliasName)).toEqual("string");
        expect(topLevelVisitor.reference(binaryAliasName)).toEqual("ReadableStream<Uint8Array>");
    });

    it("returns enum reference without I prefix", () => {
        expect(visitor.reference(enumName)).toEqual("Enum");
    });

    it("returns optional type", () => {
        expect(visitor.optional({ itemType: objectReference })).toEqual("IObject | null");
        expect(visitor.optional({ itemType: binaryAliasReference })).toEqual("string | null");
        expect(topLevelVisitor.optional({ itemType: binaryAliasReference })).toEqual(
            "ReadableStream<Uint8Array> | null",
        );
    });

    it("returns list type", () => {
        expect(visitor.list({ itemType: objectReference })).toEqual("Array<IObject>");
        expect(visitor.list({ itemType: binaryAliasReference })).toEqual("Array<string>");
        expect(topLevelVisitor.list({ itemType: binaryAliasReference })).toEqual("Array<string>");
    });

    it("returns set type", () => {
        expect(visitor.set({ itemType: objectReference })).toEqual("Array<IObject>");
        expect(visitor.set({ itemType: binaryAliasReference })).toEqual("Array<string>");
        expect(topLevelVisitor.set({ itemType: binaryAliasReference })).toEqual("Array<string>");
    });

    it("returns map type", () => {
        expect(visitor.map({ keyType: aliasReference, valueType: objectReference })).toEqual(
            "{ [key: string]: IObject }",
        );
        expect(visitor.map({ keyType: aliasReference, valueType: binaryAliasReference })).toEqual(
            "{ [key: string]: string }",
        );
        expect(topLevelVisitor.map({ keyType: aliasReference, valueType: binaryAliasReference })).toEqual(
            "{ [key: string]: string }",
        );
    });

    it("returns map type with enum keys", () => {
        const tsType = visitor.map({ keyType: enumReference, valueType: objectReference });
        expect(tsType).toEqual(`{ [key in ${enumName.name}]?: IObject }`);
    });

    it("follows primitive external fallback", () => {
        const unusedTypeName = { name: "Unused", package: "" };
        const externalType = {
            externalReference: unusedTypeName,
            fallback: IType.primitive(PrimitiveType.ANY),
        };
        expect(visitor.external(externalType)).toEqual("any");
    });

    it("follows complex external fallback", () => {
        const unusedTypeName = { name: "Unused", package: "" };
        const externalType = {
            externalReference: unusedTypeName,
            fallback: IType.list({ itemType: objectReference }),
        };
        expect(visitor.external(externalType)).toEqual("Array<IObject>");
    });
});
