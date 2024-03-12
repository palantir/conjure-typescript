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
import { ImportDeclarationStructure, StructureKind } from "ts-morph";
import { ImportsVisitor, sortImports } from "../imports";
import { createHashableTypeName } from "../utils";
import { FLAVORED_TYPE_GENERATION_FLAGS } from "./resources/constants";
import { foreignObject, importsLocalObject as localObject } from "./testTypesGeneratorTest";

const GENERATION_FLAGS_TO_USE_FOR_IMPORTS = FLAVORED_TYPE_GENERATION_FLAGS;

describe("imports", () => {
    const currType = {
        name: "Foo",
        package: "com.palantir.foo",
    };

    const stringAliasName = { name: "Alias", package: "com.palantir.imports" };
    const stringAlias = ITypeDefinition.alias({
        alias: { primitive: PrimitiveType.STRING, type: "primitive" },
        typeName: stringAliasName,
    });

    const listReferenceAliasName = { name: "ComplexAlias", package: "com.palantir.imports" };
    const listReferenceAlias = ITypeDefinition.alias({
        alias: IType.list({ itemType: localObject.reference }),
        typeName: listReferenceAliasName,
    });

    const enumName = { name: "Enum", package: "com.palantir.imports" };
    const enumType = ITypeDefinition.enum_({
        typeName: enumName,
        values: [{ value: "FOO" }],
    });

    const visitor = new ImportsVisitor(
        new Map<string, ITypeDefinition>([
            [createHashableTypeName(localObject.typeName), localObject.definition],
            [createHashableTypeName(foreignObject.typeName), localObject.definition],
            [createHashableTypeName(stringAliasName), stringAlias],
            [createHashableTypeName(listReferenceAliasName), listReferenceAlias],
            [createHashableTypeName(enumName), enumType],
        ]),
        new Map(),
        currType,
        GENERATION_FLAGS_TO_USE_FOR_IMPORTS,
    );

    function namedImport(moduleSpecifier: string, name: string): ImportDeclarationStructure {
        return {
            kind: StructureKind.ImportDeclaration,
            moduleSpecifier,
            namedImports: [{ name }],
        };
    }

    it("produces no imports for all primitive types except uuid", () => {
        expect(visitor.primitive(PrimitiveType.STRING)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.DATETIME)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.INTEGER)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.DOUBLE)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.SAFELONG)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.BINARY)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.ANY)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.BOOLEAN)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.RID)).toEqual([]);
        expect(visitor.primitive(PrimitiveType.BEARERTOKEN)).toEqual([]);
    });

    it("produces error for unknown reference type", () => {
        const noKnownTypesVisitor = new ImportsVisitor(new Map(), new Map(), currType, GENERATION_FLAGS_TO_USE_FOR_IMPORTS);
        expect(() => noKnownTypesVisitor.reference(localObject.typeName)).toThrowError(/unknown reference type/);
    });

    it("produces import for reference type in the same package", () => {
        expect(visitor.reference(localObject.typeName)).toEqual([namedImport("../imports/someObject", "ISomeObject")]);
    });

    it("produces import for reference type in different package", () => {
        expect(visitor.reference(foreignObject.typeName)).toEqual([
            namedImport("../other/otherObject", "IOtherObject"),
        ]);
    });

    it("follows alias reference", () => {
        expect(visitor.reference(stringAliasName)).toEqual([namedImport("../imports/alias", "IAlias")]);
        expect(visitor.reference(listReferenceAliasName)).toEqual([
            namedImport("../imports/someObject", "ISomeObject"),
        ]);
    });

    it("returns enum import without I prefix", () => {
        expect(visitor.reference(enumName)).toEqual([namedImport("../imports/enum", "Enum")]);
    });

    it("produces imports for optional type", () => {
        const imports = visitor.optional({ itemType: localObject.reference });
        expect(imports).toEqual([namedImport("../imports/someObject", "ISomeObject")]);
    });

    it("produces imports for list type", () => {
        const imports = visitor.list({ itemType: localObject.reference });
        expect(imports).toEqual([namedImport("../imports/someObject", "ISomeObject")]);
    });

    it("produces imports for set type", () => {
        const imports = visitor.set({ itemType: localObject.reference });
        expect(imports).toEqual([namedImport("../imports/someObject", "ISomeObject")]);
    });

    it("produces imports for map type", () => {
        const imports = visitor.map({ keyType: localObject.reference, valueType: foreignObject.reference });
        expect(imports).toEqual([
            namedImport("../imports/someObject", "ISomeObject"),
            namedImport("../other/otherObject", "IOtherObject"),
        ]);
    });

    it("follows primitive external fallback", () => {
        const unusedTypeName = { name: "Unused", package: "" };
        const imports = visitor.external({
            externalReference: unusedTypeName,
            fallback: IType.primitive(PrimitiveType.ANY),
        });
        expect(imports).toEqual([]);
    });

    it("follows complex external fallback", () => {
        const unusedTypeName = { name: "Unused", package: "" };
        const imports = visitor.external({
            externalReference: unusedTypeName,
            fallback: IType.list({ itemType: localObject.reference }),
        });
        expect(imports).toEqual([namedImport("../imports/someObject", "ISomeObject")]);
    });

    it("sorts imports", () => {
        const module1 = "../bar";
        const module2 = "../foo";
        const module3 = "./Bar";
        const module4 = "./bar";
        expect(
            sortImports([
                namedImport(module4, "D"),
                namedImport(module3, "C"),
                namedImport(module2, "B"),
                namedImport(module1, "A"),
            ]).map(({ moduleSpecifier }) => moduleSpecifier),
        ).toEqual([module1, module2, module3, module4]);
    });

    it("does not emit duplicate imports", async () => {
        const imports = sortImports([namedImport("module", "A"), namedImport("module", "A")]);
        expect(imports.length).toEqual(1);
        expect(imports[0].namedImports!.length).toEqual(1);
    });

    it("combines imports from the same module", () => {
        const imports = sortImports([namedImport("module", "A"), namedImport("module", "B")]);
        expect(imports.length).toEqual(1);
        expect(imports[0].namedImports!.length).toEqual(2);
    });

    it("adds both named and namespace imports", async () => {
        const imports = sortImports([
            namedImport("module", "name"),
            { kind: StructureKind.ImportDeclaration, moduleSpecifier: "module", namespaceImport: "namespace" },
        ]);
        expect(imports.length).toEqual(2);
    });

    it("throws if both namespaceImport and namedImports are defined", () => {
        const sort = () =>
            sortImports([
                {
                    kind: StructureKind.ImportDeclaration,
                    moduleSpecifier: "module",
                    namedImports: [{ name: "name" }],
                    namespaceImport: "namespace",
                },
            ]);
        expect(sort).toThrowError("expected only one of the fields 'namedImports' and 'namespaceImport' to be defined");
    });

    it("throws for multiple namespace imports for same module", () => {
        const sort = () =>
            sortImports([
                {
                    kind: StructureKind.ImportDeclaration,
                    moduleSpecifier: "module",
                    namespaceImport: "namespace",
                },
                {
                    kind: StructureKind.ImportDeclaration,
                    moduleSpecifier: "module",
                    namespaceImport: "anotherNamespace",
                },
            ]);
        expect(sort).toThrowError("only one namespace import for module 'module' is permitted");
    });

    it("generates relative imports", async () => {
        const someType = { package: "com.palantir.foo", name: "Foo" };
        const otherType = { package: "com.palantir.foo.request", name: "Bar" };
        const importVisistor = new ImportsVisitor(
            new Map([
                [
                    createHashableTypeName(otherType),
                    ITypeDefinition.object({
                        fields: [],
                        typeName: otherType,
                    }),
                ],
            ]),
            new Map(),
            someType,
            GENERATION_FLAGS_TO_USE_FOR_IMPORTS,
        );
        expect(IType.visit(IType.reference(otherType), importVisistor)).toEqual([
            {
                kind: StructureKind.ImportDeclaration,
                moduleSpecifier: "../foo-request/bar",
                namedImports: [{ name: "I" + otherType.name }],
            },
        ]);
    });
});
