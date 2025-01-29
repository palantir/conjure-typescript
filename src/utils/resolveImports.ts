/**
 * @license
 * Copyright 2025 Palantir Technologies, Inc.
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
    PrimitiveType,
} from "conjure-api";
import { ImportDeclarationStructure, SourceFile, StructureKind } from "ts-morph";
import { ITypeGenerationFlags } from "../types/typeGenerationFlags";
import { moduleNameForType, relativePath } from "./fileUtils";
import { isFlavorizable } from "./flavorizingUtils";
import { createHashableTypeName } from "./hashingUtils";

export const resolveImports = (
    conjureType: IType,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): ImportDeclarationStructure[] => {
    switch (conjureType.type) {
        case "primitive":
            return resolveImportsForPrimitiveType(conjureType.primitive);
        case "list":
            return resolveImportsForListType(conjureType.list, baseType, knownConjureTypes, typeGenerationFlags);
        case "set":
            return resolveImportsForSetType(conjureType.set, baseType, knownConjureTypes, typeGenerationFlags);
        case "map":
            return resolveImportsForMapType(conjureType.map, baseType, knownConjureTypes, typeGenerationFlags);
        case "optional":
            return resolveImportsForOptionalType(
                conjureType.optional,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
            );
        case "reference":
            return resolveImportsForReferenceType(
                conjureType.reference,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
            );
        case "external":
            return resolveImportsForExternalType(
                conjureType.external,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
            );
    }
};

export const resolveImportsForPrimitiveType = (_primitiveType: PrimitiveType): ImportDeclarationStructure[] => {
    return [];
};

export const resolveImportsForListType = (
    listType: IListType,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): ImportDeclarationStructure[] => {
    return resolveImports(listType.itemType, baseType, knownConjureTypes, typeGenerationFlags);
};

export const resolveImportsForSetType = (
    setType: ISetType,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): ImportDeclarationStructure[] => {
    return resolveImports(setType.itemType, baseType, knownConjureTypes, typeGenerationFlags);
};

export const resolveImportsForMapType = (
    mapType: IMapType,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): ImportDeclarationStructure[] => {
    return [
        ...resolveImports(mapType.keyType, baseType, knownConjureTypes, typeGenerationFlags),
        ...resolveImports(mapType.valueType, baseType, knownConjureTypes, typeGenerationFlags),
    ];
};

export const resolveImportsForOptionalType = (
    optionalType: IOptionalType,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): ImportDeclarationStructure[] => {
    return resolveImports(optionalType.itemType, baseType, knownConjureTypes, typeGenerationFlags);
};

export const resolveImportsForReferenceType = (
    referencedType: ITypeName,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): ImportDeclarationStructure[] => {
    if (referencedType.package === baseType.package) {
        return [];
    }

    const referencedTypeDefinition = knownConjureTypes.get(createHashableTypeName(referencedType));

    if (referencedTypeDefinition == null) {
        throw new Error(`Unknown reference type. package: '${referencedType.package}', name: '${referencedType.name}'`);
    }

    if (
        ITypeDefinition.isAlias(referencedTypeDefinition) &&
        !isFlavorizable(referencedTypeDefinition.alias.alias, typeGenerationFlags.flavorizedAliases)
    ) {
        return resolveImports(referencedTypeDefinition.alias.alias, baseType, knownConjureTypes, typeGenerationFlags);
    }

    return [
        {
            kind: StructureKind.ImportDeclaration,
            moduleSpecifier: relativePath(baseType, referencedType),
            namespaceImport: moduleNameForType(referencedType),
            isTypeOnly: true,
        },
    ];
};

export const resolveImportsForExternalType = (
    externalReference: IExternalReference,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): ImportDeclarationStructure[] => {
    return resolveImports(externalReference.fallback, baseType, knownConjureTypes, typeGenerationFlags);
};

export function sortImports(imports: ImportDeclarationStructure[]): ImportDeclarationStructure[] {
    const namespaceImports: Map<string, ImportDeclarationStructure> = new Map();

    imports.forEach(i => {
        const existingImportDeclaration = namespaceImports.get(i.moduleSpecifier);
        if (existingImportDeclaration != null && existingImportDeclaration.namespaceImport !== i.namespaceImport) {
            throw new Error(`only one namespace import for module '${i.moduleSpecifier}' is permitted`);
        } else {
            namespaceImports.set(i.moduleSpecifier, i);
        }
    });

    return Array.from(namespaceImports.values()).sort((a, b) =>
        a.moduleSpecifier < b.moduleSpecifier ? -1 : a.moduleSpecifier > b.moduleSpecifier ? 1 : 0,
    );
}

export function combineImports(sourceFile: SourceFile, importDeclarations: ReadonlyArray<ImportDeclarationStructure>) {
    for (const declaration of importDeclarations) {
        const existingDeclaration = sourceFile.getImportDeclaration(declaration.moduleSpecifier);
        if (existingDeclaration == null) {
            sourceFile.addImportDeclaration(declaration);
        }
    }
}
