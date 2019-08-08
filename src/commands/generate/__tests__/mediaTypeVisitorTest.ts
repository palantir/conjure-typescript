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
import { MediaTypeVisitor } from "../mediaTypeVisitor";
import { createHashableTypeName } from "../utils";

describe("testMediaTypeGenerator", () => {
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
    const enumType = ITypeDefinition.enum_({
        typeName: enumName,
        values: [{ value: "FOO" }],
    });

    const visitor = new MediaTypeVisitor(
        new Map<string, ITypeDefinition>([
            [createHashableTypeName(objectName), object],
            [createHashableTypeName(aliasName), alias],
            [createHashableTypeName(binaryAliasName), binaryAlias],
            [createHashableTypeName(enumName), enumType],
        ]),
    );

    it("returns primitive types", () => {
        expect(visitor.primitive(PrimitiveType.STRING)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.DATETIME)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.INTEGER)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.DOUBLE)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.SAFELONG)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.BINARY)).toEqual("MediaType.APPLICATION_OCTET_STREAM");
        expect(visitor.primitive(PrimitiveType.ANY)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.BOOLEAN)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.RID)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.BEARERTOKEN)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.primitive(PrimitiveType.UUID)).toEqual("MediaType.APPLICATION_JSON");
    });

    it("produces error for unknown reference", () => {
        const tsType = () => new MediaTypeVisitor(new Map<string, ITypeDefinition>()).reference(objectName);
        expect(tsType).toThrowError(/unknown reference type/);
    });

    it("returns reference type", () => {
        expect(visitor.reference(objectName)).toEqual("MediaType.APPLICATION_JSON");
    });

    it("follows alias reference", () => {
        expect(visitor.reference(aliasName)).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.reference(binaryAliasName)).toEqual("MediaType.APPLICATION_OCTET_STREAM");
    });

    it("returns enum reference without I prefix", () => {
        expect(visitor.reference(enumName)).toEqual("MediaType.APPLICATION_JSON");
    });

    it("returns optional type", () => {
        expect(visitor.optional({ itemType: objectReference })).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.optional({ itemType: binaryAliasReference })).toEqual("MediaType.APPLICATION_OCTET_STREAM");
    });

    it("returns list type", () => {
        expect(visitor.list({ itemType: objectReference })).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.list({ itemType: binaryAliasReference })).toEqual("MediaType.APPLICATION_JSON");
    });

    it("returns set type", () => {
        expect(visitor.set({ itemType: objectReference })).toEqual("MediaType.APPLICATION_JSON");
        expect(visitor.set({ itemType: binaryAliasReference })).toEqual("MediaType.APPLICATION_JSON");
    });

    it("returns map type", () => {
        expect(visitor.map({ keyType: aliasReference, valueType: objectReference })).toEqual(
            "MediaType.APPLICATION_JSON",
        );
        expect(visitor.map({ keyType: aliasReference, valueType: binaryAliasReference })).toEqual(
            "MediaType.APPLICATION_JSON",
        );
    });
    it("follows primitive external fallback", () => {
        const unusedTypeName = { name: "Unused", package: "" };
        const externalType = {
            externalReference: unusedTypeName,
            fallback: IType.primitive(PrimitiveType.ANY),
        };
        expect(visitor.external(externalType)).toEqual("MediaType.APPLICATION_JSON");
    });

    it("follows complex external fallback", () => {
        const unusedTypeName = { name: "Unused", package: "" };
        const externalType = {
            externalReference: unusedTypeName,
            fallback: IType.list({ itemType: objectReference }),
        };
        expect(visitor.external(externalType)).toEqual("MediaType.APPLICATION_JSON");
    });
});
