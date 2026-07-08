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

import { IType, ITypeDefinition, ITypeName } from "conjure-api";
import { ITypeGenerationFlags } from "../types/typeGenerationFlags";
import { isFlavorizable } from "./flavorizingUtils";
import { createHashableTypeName } from "./hashingUtils";
import { resolveTsTypeForPrimitiveType } from "./resolveTsType";

/**
 * Resolves the JSON wire-accurate TypeScript type string for a Conjure type.
 *
 * Differences from `resolveTsType`:
 *  - `list` / `set` / `map` fields append `| null | undefined` (the whole collection can be null/absent on the wire).
 *  - References to object and union types use the `IFooJSON` variant instead of `IFoo`.
 *
 * Used to generate `IFooJSON` interface fields and bridge call generic types when `generateJsonTypes` is true.
 */
export function resolveJsonTsType(
    conjureType: IType,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
    isParameterType: boolean,
    isTopLevelBinary: boolean,
): string {
    switch (conjureType.type) {
        case "primitive":
            return resolveTsTypeForPrimitiveType(conjureType.primitive, isParameterType, isTopLevelBinary);

        case "list": {
            const itemType = resolveJsonTsType(
                conjureType.list.itemType,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
                isParameterType,
                false,
            );
            const arrType =
                isParameterType || typeGenerationFlags.readonlyInterfaces
                    ? `ReadonlyArray<${itemType}>`
                    : `Array<${itemType}>`;
            return `${arrType} | null | undefined`;
        }

        case "set": {
            const itemType = resolveJsonTsType(
                conjureType.set.itemType,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
                isParameterType,
                false,
            );
            const arrType =
                isParameterType || typeGenerationFlags.readonlyInterfaces
                    ? `ReadonlyArray<${itemType}>`
                    : `Array<${itemType}>`;
            return `${arrType} | null | undefined`;
        }

        case "map": {
            const valueType = resolveJsonTsType(
                conjureType.map.valueType,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
                isParameterType,
                false,
            );
            const maybeReadonly = typeGenerationFlags.readonlyInterfaces ? "readonly " : "";

            if (IType.isReference(conjureType.map.keyType)) {
                const keyTypeDefinition = knownConjureTypes.get(createHashableTypeName(conjureType.map.keyType.reference));
                if (keyTypeDefinition == null) {
                    throw new Error(
                        `Unknown reference type. package: '${conjureType.map.keyType.reference.package}', name: '${conjureType.map.keyType.reference.name}'`,
                    );
                }
                if (ITypeDefinition.isEnum(keyTypeDefinition)) {
                    return `{ ${maybeReadonly}[key in ${conjureType.map.keyType.reference.name}]?: ${valueType} } | null | undefined`;
                } else if (
                    ITypeDefinition.isAlias(keyTypeDefinition) &&
                    isFlavorizable(keyTypeDefinition.alias.alias, typeGenerationFlags.flavorizedAliases)
                ) {
                    return `{ ${maybeReadonly}[key: I${conjureType.map.keyType.reference.name}]: ${valueType} } | null | undefined`;
                }
            }
            return `{ ${maybeReadonly}[key: string]: ${valueType} } | null | undefined`;
        }

        case "optional": {
            const innerType = resolveJsonTsType(
                conjureType.optional.itemType,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
                isParameterType,
                isTopLevelBinary,
            );
            return `${innerType} | null`;
        }

        case "reference":
            return resolveJsonTsTypeForReference(
                conjureType.reference,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
                isParameterType,
                isTopLevelBinary,
            );

        case "external":
            return resolveJsonTsType(
                conjureType.external.fallback,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
                isParameterType,
                false,
            );
    }
}

function resolveJsonTsTypeForReference(
    referencedType: ITypeName,
    baseType: ITypeName,
    knownConjureTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
    isParameterType: boolean,
    isTopLevelBinary: boolean,
): string {
    const referencedTypeDefinition = knownConjureTypes.get(createHashableTypeName(referencedType));
    if (referencedTypeDefinition == null) {
        throw new Error(
            `Unknown reference type. package: '${referencedType.package}', name: '${referencedType.name}'`,
        );
    }

    if (ITypeDefinition.isEnum(referencedTypeDefinition)) {
        // Enums are plain strings on the wire — unchanged.
        return referencedType.name;
    }

    if (ITypeDefinition.isAlias(referencedTypeDefinition)) {
        if (!isFlavorizable(referencedTypeDefinition.alias.alias, typeGenerationFlags.flavorizedAliases)) {
            // Non-flavorized alias: inline the aliased JSON type transparently.
            return resolveJsonTsType(
                referencedTypeDefinition.alias.alias,
                baseType,
                knownConjureTypes,
                typeGenerationFlags,
                isParameterType,
                isTopLevelBinary,
            );
        }
        // Flavorized alias: branded string, unchanged on the wire.
        return `I${referencedType.name}`;
    }

    // Object or union: use the JSON variant name.
    return `I${referencedType.name}JSON`;
}
