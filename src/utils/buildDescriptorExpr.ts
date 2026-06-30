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

import { IType, ITypeDefinition, ITypeName, PrimitiveType } from "conjure-api";
import { ITypeGenerationFlags } from "../types/typeGenerationFlags";
import { isFlavorizable } from "./flavorizingUtils";
import { createHashableTypeName } from "./hashingUtils";

/**
 * Result of building a ConjureType descriptor expression for a given IType.
 *
 * - `expr` — TypeScript source expression using conjure-client builder functions.
 * - `refs` — named type names referenced as `_TypeName` constants (need to be imported).
 * - `builders` — conjure-client builder function names used in `expr` (need to be imported).
 */
export interface DescriptorExprResult {
    expr: string;
    refs: ITypeName[];
    builders: string[];
}

/**
 * Builds a ConjureType descriptor expression string for `type`, suitable for embedding in generated
 * TypeScript source. Named-type references are rendered as `reference(() => _TypeName)` to handle
 * recursive descriptors safely.
 *
 * Non-flavorized aliases are inlined transparently (they produce no descriptor constant).
 */
export function buildDescriptorExpr(
    type: IType,
    knownTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): DescriptorExprResult {
    const builders = new Set<string>();
    const refs: ITypeName[] = [];
    const expr = buildExpr(type, knownTypes, typeGenerationFlags, builders, refs);
    return { expr, refs, builders: Array.from(builders) };
}

function buildExpr(
    type: IType,
    knownTypes: Map<string, ITypeDefinition>,
    flags: ITypeGenerationFlags,
    builders: Set<string>,
    refs: ITypeName[],
): string {
    switch (type.type) {
        case "primitive": {
            const name = primitiveBuilderName(type.primitive);
            builders.add(name);
            return `${name}()`;
        }

        case "list": {
            builders.add("list");
            const item = buildExpr(type.list.itemType, knownTypes, flags, builders, refs);
            return `list(${item})`;
        }

        case "set": {
            builders.add("set");
            const item = buildExpr(type.set.itemType, knownTypes, flags, builders, refs);
            return `set(${item})`;
        }

        case "map": {
            builders.add("map");
            const value = buildExpr(type.map.valueType, knownTypes, flags, builders, refs);
            return `map(${value})`;
        }

        case "optional": {
            builders.add("optional");
            const item = buildExpr(type.optional.itemType, knownTypes, flags, builders, refs);
            return `optional(${item})`;
        }

        case "reference":
            return buildExprForReference(type.reference, knownTypes, flags, builders, refs);

        case "external":
            return buildExpr(type.external.fallback, knownTypes, flags, builders, refs);
    }
}

function buildExprForReference(
    typeName: ITypeName,
    knownTypes: Map<string, ITypeDefinition>,
    flags: ITypeGenerationFlags,
    builders: Set<string>,
    refs: ITypeName[],
): string {
    const definition = knownTypes.get(createHashableTypeName(typeName));
    if (definition == null) {
        throw new Error(`Unknown reference type. package: '${typeName.package}', name: '${typeName.name}'`);
    }

    // Non-flavorized aliases are transparent — inline the aliased type.
    if (ITypeDefinition.isAlias(definition) && !isFlavorizable(definition.alias.alias, flags.flavorizedAliases)) {
        return buildExpr(definition.alias.alias, knownTypes, flags, builders, refs);
    }

    // Named types with descriptor constants: object, union, enum, flavorized alias.
    builders.add("reference");
    refs.push(typeName);
    return `reference(() => _${typeName.name})`;
}

function primitiveBuilderName(primitive: PrimitiveType): string {
    switch (primitive) {
        case PrimitiveType.STRING:
            return "stringType";
        case PrimitiveType.BOOLEAN:
            return "booleanType";
        case PrimitiveType.INTEGER:
            return "integer";
        case PrimitiveType.SAFELONG:
            return "safelong";
        case PrimitiveType.DOUBLE:
            return "double";
        case PrimitiveType.RID:
            return "rid";
        case PrimitiveType.UUID:
            return "uuid";
        case PrimitiveType.BEARERTOKEN:
            return "bearertoken";
        case PrimitiveType.BINARY:
            return "binary";
        case PrimitiveType.DATETIME:
            return "datetime";
        case PrimitiveType.ANY:
            return "anyType";
        default:
            throw new Error(`Unknown primitive type: ${primitive}`);
    }
}
