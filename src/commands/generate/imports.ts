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

import {
    IExternalReference,
    IListType,
    IMapType,
    IOptionalType,
    ISetType,
    IType,
    ITypeDefinition,
    ITypeName,
    ITypeVisitor,
    PrimitiveType,
} from "conjure-api";
import * as path from "path";
import { ImportDeclarationStructure, ImportSpecifierStructure, StructureKind } from "ts-morph";
import { TsReturnTypeVisitor } from "./tsReturnTypeVisitor";
import { ITypeGenerationFlags } from "./typeGenerationFlags";
import { createHashableTypeName, isFlavorizable } from "./utils";

export class ImportsVisitor implements ITypeVisitor<ImportDeclarationStructure[]> {
    private tsTypeVisitor: TsReturnTypeVisitor;

    constructor(
        private knownTypes: Map<string, ITypeDefinition>,
        private currType: ITypeName,
        private typeGenerationFlags: ITypeGenerationFlags,
    ) {
        this.tsTypeVisitor = new TsReturnTypeVisitor(knownTypes, currType, false, typeGenerationFlags);
    }

    public primitive = (_: PrimitiveType): ImportDeclarationStructure[] => [];

    public map = (obj: IMapType): ImportDeclarationStructure[] => {
        return IType.visit(obj.keyType, this).concat(IType.visit(obj.valueType, this));
    };
    public list = (obj: IListType): ImportDeclarationStructure[] => {
        return IType.visit(obj.itemType, this);
    };
    public set = (obj: ISetType): ImportDeclarationStructure[] => {
        return IType.visit(obj.itemType, this);
    };
    public optional = (obj: IOptionalType): ImportDeclarationStructure[] => {
        return IType.visit(obj.itemType, this);
    };
    public reference = (obj: ITypeName): ImportDeclarationStructure[] => {
        const typeDefinition = this.knownTypes.get(createHashableTypeName(obj));
        if (typeDefinition == null) {
            throw new Error(`unknown reference type. package: '${obj.package}', name: '${obj.name}'`);
        } else if (
            ITypeDefinition.isAlias(typeDefinition) &&
            !isFlavorizable(typeDefinition.alias.alias, this.typeGenerationFlags.flavorizedAliases)
        ) {
            return IType.visit(typeDefinition.alias.alias, this);
        } else if (obj.package === this.currType.package && obj.name === this.currType.name) {
            return [];
        }
        const moduleSpecifier = relativePath(this.currType, obj);
        const name = this.tsTypeVisitor.reference(obj);
        if (ITypeDefinition.isUnion(typeDefinition)) {
            return [
                {
                    kind: StructureKind.ImportDeclaration,
                    moduleSpecifier,
                    // assumes that union names are of the form IMyUnion.IMyUnion
                    namespaceImport: name.split(".")[0],
                },
            ];
        }

        return [
            {
                kind: StructureKind.ImportDeclaration,
                moduleSpecifier,
                namedImports: [{ name }],
            },
        ];
    };
    public external = (obj: IExternalReference): ImportDeclarationStructure[] => {
        return IType.visit(obj.fallback, this);
    };
    public unknown = (_obj: IType): ImportDeclarationStructure[] => {
        throw new Error("unknown");
    };
}

function relativePath(currType: ITypeName, toType: ITypeName) {
    if (currType.package === toType.package) {
        return "./" + module(toType);
    }
    const relativeImport = path.relative(dir(currType), path.join(dir(toType), module(toType)));
    return relativeImport.startsWith("../") ? relativeImport : "./" + relativeImport;
}

export function dir(typeName: ITypeName) {
    const parts = typeName.package.split(".");
    if (parts.length < 3) {
        throw new Error("package should have at least 3 segments");
    }
    return parts.slice(2).join("-");
}

/** Lowercases the name. */
export function module(typeName: ITypeName) {
    return typeName.name.charAt(0).toLowerCase() + typeName.name.slice(1);
}

export function sortImports(imports: ImportDeclarationStructure[]): ImportDeclarationStructure[] {
    const namedImports = new Map();
    const namespaceImports = new Map();
    imports.forEach(i => {
        const isNamedImport = i.namedImports != null;
        const isNamespaceImport = i.namespaceImport != null;
        if (isNamedImport === isNamespaceImport) {
            throw new Error("expected only one of the fields 'namedImports' and 'namespaceImport' to be defined");
        }
        if (isNamedImport) {
            const curImport = namedImports.get(i.moduleSpecifier);
            if (curImport != null && Array.isArray(i.namedImports)) {
                const newImports = i.namedImports.filter(namedImport => {
                    const newName = typeof namedImport === "string" ? namedImport : namedImport.name;
                    return (
                        curImport.namedImports.find(({ name }: ImportSpecifierStructure) => name === newName) == null
                    );
                });
                curImport.namedImports.push(...newImports);
            } else {
                namedImports.set(i.moduleSpecifier, i);
            }
        } else if (isNamespaceImport) {
            const curImport = namespaceImports.get(i.moduleSpecifier);
            if (curImport != null && curImport.namespaceImport !== i.namespaceImport) {
                throw new Error(`only one namespace import for module '${i.moduleSpecifier}' is permitted`);
            } else {
                namespaceImports.set(i.moduleSpecifier, i);
            }
        }
    });

    return Array.from(namedImports.values())
        .concat(Array.from(namespaceImports.values()))
        .sort((a, b) => (a.moduleSpecifier < b.moduleSpecifier ? -1 : a.moduleSpecifier > b.moduleSpecifier ? 1 : 0));
}
