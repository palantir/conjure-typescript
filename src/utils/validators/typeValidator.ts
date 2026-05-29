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

// Direct port of conjure-core type graph validators:
// - NoRecursiveTypesValidator
// - NoNestedOptionalValidator
// - IllegalMapKeyValidator
// - FieldDefinitionValidator
// Also provides dealiasing utilities used by EndpointDefinitionValidator

import { IConjureDefinition, IType, ITypeDefinition, ITypeName, PrimitiveType } from "conjure-api";
import { createHashableTypeName } from "../hashingUtils";

// --- Dealiasing utilities ---

/**
 * Follow alias chains to resolve to the underlying type.
 * Returns undefined if the type resolves to a TypeDefinition (object, enum, union) rather than a primitive/container.
 * Returns the resolved IType if it resolves to a primitive or container type.
 */
export function dealias(type: IType, knownTypes: Map<string, ITypeDefinition>): IType | undefined {
    if (IType.isReference(type)) {
        const refName = createHashableTypeName(type.reference);
        const typeDef = knownTypes.get(refName);
        if (typeDef === undefined) {
            return undefined;
        }
        if (ITypeDefinition.isAlias(typeDef)) {
            return dealias(typeDef.alias.alias, knownTypes);
        }
        // Object, enum, union — return undefined to indicate it resolved to a type definition
        return undefined;
    }
    return type;
}

/**
 * Check if a type resolves to a TypeDefinition (returns the definition), or to a primitive/container (returns undefined).
 */
export function dealiasToDefinition(
    type: IType,
    knownTypes: Map<string, ITypeDefinition>,
): ITypeDefinition | undefined {
    if (IType.isReference(type)) {
        const refName = createHashableTypeName(type.reference);
        const typeDef = knownTypes.get(refName);
        if (typeDef === undefined) {
            return undefined;
        }
        if (ITypeDefinition.isAlias(typeDef)) {
            return dealiasToDefinition(typeDef.alias.alias, knownTypes);
        }
        return typeDef;
    }
    return undefined;
}

export function isPrimitive(type: IType, knownTypes: Map<string, ITypeDefinition>): boolean {
    const resolved = dealias(type, knownTypes);
    return resolved !== undefined && IType.isPrimitive(resolved);
}

export function isEnum(type: IType, knownTypes: Map<string, ITypeDefinition>): boolean {
    const def = dealiasToDefinition(type, knownTypes);
    return def !== undefined && ITypeDefinition.isEnum(def);
}

export function isBinary(type: IType): boolean {
    return IType.isPrimitive(type) && type.primitive === PrimitiveType.BINARY;
}

export function isAny(type: IType): boolean {
    return IType.isPrimitive(type) && type.primitive === PrimitiveType.ANY;
}

export function isBearerToken(type: IType): boolean {
    return IType.isPrimitive(type) && type.primitive === PrimitiveType.BEARERTOKEN;
}

// --- NoRecursiveTypesValidator ---

export function getTypeName(typeDef: ITypeDefinition): ITypeName {
    if (ITypeDefinition.isAlias(typeDef)) {
        return typeDef.alias.typeName;
    }
    if (ITypeDefinition.isEnum(typeDef)) {
        return typeDef.enum.typeName;
    }
    if (ITypeDefinition.isObject(typeDef)) {
        return typeDef.object.typeName;
    }
    if (ITypeDefinition.isUnion(typeDef)) {
        return typeDef.union.typeName;
    }
    throw new Error("Unknown type definition type");
}

function collectTypeReferences(type: IType): ITypeName[] {
    if (IType.isReference(type)) {
        return [type.reference];
    }
    if (IType.isOptional(type)) {
        return collectTypeReferences(type.optional.itemType);
    }
    if (IType.isList(type)) {
        return collectTypeReferences(type.list.itemType);
    }
    if (IType.isSet(type)) {
        return collectTypeReferences(type.set.itemType);
    }
    if (IType.isMap(type)) {
        return [...collectTypeReferences(type.map.keyType), ...collectTypeReferences(type.map.valueType)];
    }
    return [];
}

export function validateNoRecursiveTypes(definition: IConjureDefinition): void {
    // Build adjacency list: type -> types it references
    const edges = new Map<string, Set<string>>();

    for (const typeDef of definition.types) {
        const typeName = getTypeName(typeDef);
        const key = createHashableTypeName(typeName);
        const refs = new Set<string>();

        if (ITypeDefinition.isAlias(typeDef)) {
            for (const ref of collectTypeReferences(typeDef.alias.alias)) {
                refs.add(createHashableTypeName(ref));
            }
        } else if (ITypeDefinition.isObject(typeDef)) {
            for (const field of typeDef.object.fields) {
                for (const ref of collectTypeReferences(field.type)) {
                    refs.add(createHashableTypeName(ref));
                }
            }
        } else if (ITypeDefinition.isUnion(typeDef)) {
            for (const member of typeDef.union.union) {
                for (const ref of collectTypeReferences(member.type)) {
                    refs.add(createHashableTypeName(ref));
                }
            }
        }

        edges.set(key, refs);
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const inStack = new Set<string>();

    function dfs(node: string, path: string[]): void {
        if (inStack.has(node)) {
            const cycleStart = path.indexOf(node);
            const cycle = path.slice(cycleStart).concat(node);
            throw new Error(`Recursive types detected: ${cycle.join(" -> ")}`);
        }
        if (visited.has(node)) {
            return;
        }
        visited.add(node);
        inStack.add(node);
        path.push(node);

        const neighbors = edges.get(node);
        if (neighbors !== undefined) {
            neighbors.forEach(neighbor => {
                if (edges.has(neighbor)) {
                    dfs(neighbor, path);
                }
            });
        }

        path.pop();
        inStack.delete(node);
    }

    edges.forEach((_refs, node) => {
        dfs(node, []);
    });
}

// --- NoNestedOptionalValidator ---

function hasNestedOptional(type: IType, knownTypes: Map<string, ITypeDefinition>, insideOptional: boolean): boolean {
    if (IType.isOptional(type)) {
        if (insideOptional) {
            return true;
        }
        return hasNestedOptional(type.optional.itemType, knownTypes, true);
    }
    if (IType.isReference(type)) {
        const resolved = dealias(type, knownTypes);
        if (resolved !== undefined) {
            return hasNestedOptional(resolved, knownTypes, insideOptional);
        }
        return false;
    }
    if (IType.isList(type)) {
        return hasNestedOptional(type.list.itemType, knownTypes, false);
    }
    if (IType.isSet(type)) {
        return hasNestedOptional(type.set.itemType, knownTypes, false);
    }
    if (IType.isMap(type)) {
        return (
            hasNestedOptional(type.map.keyType, knownTypes, false) ||
            hasNestedOptional(type.map.valueType, knownTypes, false)
        );
    }
    return false;
}

export function validateNoNestedOptionals(
    definition: IConjureDefinition,
    knownTypes: Map<string, ITypeDefinition>,
): void {
    for (const typeDef of definition.types) {
        if (ITypeDefinition.isObject(typeDef)) {
            for (const field of typeDef.object.fields) {
                if (hasNestedOptional(field.type, knownTypes, false)) {
                    throw new Error(
                        `Nested optionals not allowed: field '${field.fieldName}' ` +
                            `in type '${typeDef.object.typeName.name}'`,
                    );
                }
            }
        } else if (ITypeDefinition.isUnion(typeDef)) {
            for (const member of typeDef.union.union) {
                if (hasNestedOptional(member.type, knownTypes, false)) {
                    throw new Error(
                        `Nested optionals not allowed: member '${member.fieldName}' ` +
                            `in union '${typeDef.union.typeName.name}'`,
                    );
                }
            }
        }
    }

    for (const errorDef of definition.errors) {
        const allArgs = (errorDef.safeArgs || []).concat(errorDef.unsafeArgs || []);
        for (const arg of allArgs) {
            if (hasNestedOptional(arg.type, knownTypes, false)) {
                throw new Error(
                    `Nested optionals not allowed: arg '${arg.fieldName}' ` + `in error '${errorDef.errorName.name}'`,
                );
            }
        }
    }

    for (const serviceDef of definition.services) {
        for (const endpoint of serviceDef.endpoints) {
            for (const arg of endpoint.args) {
                if (hasNestedOptional(arg.type, knownTypes, false)) {
                    throw new Error(
                        `Nested optionals not allowed: arg '${arg.argName}' ` +
                            `in endpoint '${endpoint.endpointName}' of service '${serviceDef.serviceName.name}'`,
                    );
                }
            }
            if (endpoint.returns != null && hasNestedOptional(endpoint.returns, knownTypes, false)) {
                throw new Error(
                    `Nested optionals not allowed: return type of endpoint '${endpoint.endpointName}' ` +
                        `in service '${serviceDef.serviceName.name}'`,
                );
            }
        }
    }
}

// --- IllegalMapKeyValidator ---

function hasIllegalMapKey(type: IType, knownTypes: Map<string, ITypeDefinition>): boolean {
    if (IType.isMap(type)) {
        const keyType = type.map.keyType;
        // Map keys must be primitives or references (enums/objects after dealiasing)
        if (!IType.isPrimitive(keyType) && !IType.isReference(keyType)) {
            return true;
        }
        // Also check value recursively
        return hasIllegalMapKey(type.map.valueType, knownTypes);
    }
    if (IType.isOptional(type)) {
        return hasIllegalMapKey(type.optional.itemType, knownTypes);
    }
    if (IType.isList(type)) {
        return hasIllegalMapKey(type.list.itemType, knownTypes);
    }
    if (IType.isSet(type)) {
        return hasIllegalMapKey(type.set.itemType, knownTypes);
    }
    return false;
}

export function validateNoIllegalMapKeys(
    definition: IConjureDefinition,
    knownTypes: Map<string, ITypeDefinition>,
): void {
    for (const typeDef of definition.types) {
        if (ITypeDefinition.isObject(typeDef)) {
            for (const field of typeDef.object.fields) {
                if (hasIllegalMapKey(field.type, knownTypes)) {
                    throw new Error(
                        `Complex type not allowed in map key: field '${field.fieldName}' ` +
                            `in type '${typeDef.object.typeName.name}'`,
                    );
                }
            }
        } else if (ITypeDefinition.isUnion(typeDef)) {
            for (const member of typeDef.union.union) {
                if (hasIllegalMapKey(member.type, knownTypes)) {
                    throw new Error(
                        `Complex type not allowed in map key: member '${member.fieldName}' ` +
                            `in union '${typeDef.union.typeName.name}'`,
                    );
                }
            }
        } else if (ITypeDefinition.isAlias(typeDef)) {
            if (hasIllegalMapKey(typeDef.alias.alias, knownTypes)) {
                throw new Error(`Complex type not allowed in map key: alias '${typeDef.alias.typeName.name}'`);
            }
        }
    }
}
