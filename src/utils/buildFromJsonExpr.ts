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
import { resolveJsonTsType } from "./resolveJsonTsType";
import { resolveTsTypeForPrimitiveType } from "./resolveTsType";

/**
 * Result of building a field-level from-JSON expression.
 *
 * - `expr` — the right-hand side expression for one field in a `fromFooJson` body.
 * - `refs` — type names whose `from{Name}Json` function is referenced in `expr` and must be imported.
 */
export interface FromJsonFieldExprResult {
    expr: string;
    refs: ITypeName[];
}

/**
 * Builds the right-hand side expression for a single field in a `fromFooJson` function body.
 *
 * @param fieldType - The Conjure type of the field.
 * @param sourceExpr - The source expression to transform (e.g. `"json.fieldName"` or `"item"`).
 * @param knownTypes - Known type definitions map.
 * @param flags - Type generation flags.
 */
export function buildFromJsonFieldExpr(
    fieldType: IType,
    sourceExpr: string,
    knownTypes: Map<string, ITypeDefinition>,
    flags: ITypeGenerationFlags,
): FromJsonFieldExprResult {
    switch (fieldType.type) {
        case "primitive":
            return { expr: sourceExpr, refs: [] };

        case "list":
        case "set": {
            const itemType = fieldType.type === "list" ? fieldType.list.itemType : fieldType.set.itemType;
            const { expr: itemExpr, refs } = buildFromJsonFieldExpr(itemType, "item", knownTypes, flags);
            if (itemExpr === "item") {
                return { expr: `${sourceExpr} ?? []`, refs: [] };
            }
            return { expr: `(${sourceExpr} ?? []).map((item) => ${itemExpr})`, refs };
        }

        case "map":
            // Null-coerce the map; deep value transformation is not applied.
            return { expr: `${sourceExpr} ?? {}`, refs: [] };

        case "optional": {
            const { expr: innerExpr, refs } = buildFromJsonFieldExpr(
                fieldType.optional.itemType,
                sourceExpr,
                knownTypes,
                flags,
            );
            if (innerExpr === sourceExpr) {
                // Inner type needs no transformation — the optional pass-through is sufficient.
                return { expr: sourceExpr, refs: [] };
            }
            // Null-guard before applying the inner transformation.
            return { expr: `${sourceExpr} != null ? ${innerExpr} : ${sourceExpr}`, refs };
        }

        case "reference":
            return buildFromJsonFieldExprForReference(fieldType.reference, sourceExpr, knownTypes, flags);

        case "external":
            return buildFromJsonFieldExpr(fieldType.external.fallback, sourceExpr, knownTypes, flags);
    }
}

function buildFromJsonFieldExprForReference(
    referencedType: ITypeName,
    sourceExpr: string,
    knownTypes: Map<string, ITypeDefinition>,
    flags: ITypeGenerationFlags,
): FromJsonFieldExprResult {
    const definition = knownTypes.get(createHashableTypeName(referencedType));
    if (definition == null) {
        throw new Error(
            `Unknown reference type. package: '${referencedType.package}', name: '${referencedType.name}'`,
        );
    }

    if (ITypeDefinition.isEnum(definition)) {
        return { expr: sourceExpr, refs: [] };
    }

    if (ITypeDefinition.isAlias(definition)) {
        if (!isFlavorizable(definition.alias.alias, flags.flavorizedAliases)) {
            return buildFromJsonFieldExpr(definition.alias.alias, sourceExpr, knownTypes, flags);
        }
        return { expr: sourceExpr, refs: [] };
    }

    // Object or union: delegate to the per-type fromJson function.
    const funcName = `from${referencedType.name}Json`;
    return { expr: `${funcName}(${sourceExpr})`, refs: [referencedType] };
}

/**
 * Result of computing the from-JSON service mapping for an endpoint return type.
 *
 * - `bridgeType` — the TypeScript type to pass as the generic to `bridge.call<T>`.
 * - `mappingFnExpr` — for throwing services: the expression passed to `.then()`.
 *   `null` means no `.then()` is needed.
 * - `resultApplyExpr` — for non-throwing services: the expression used as the `result` field
 *   in the success branch (applied to `__result`). `null` means no mapping is needed.
 * - `refs` — type names whose `from{Name}Json` function must be imported into the service file.
 */
export interface FromJsonServiceExprResult {
    bridgeType: string;
    mappingFnExpr: string | null;
    resultApplyExpr: string | null;
    refs: ITypeName[];
}

/** A dummy base type used when building bridge type strings; module path is irrelevant here. */
const DUMMY_BASE: ITypeName = { name: "__service__", package: "com.palantir.__internal__" };

/**
 * Computes the bridge call type and optional mapping expression for a service endpoint return type
 * when `applyFromJson` is active.
 *
 * For pure primitives / enums / flavorized aliases with no collection at the top level, returns
 * `{ mappingFnExpr: null, resultApplyExpr: null }` — no `.then()` is added.
 */
export function buildFromJsonServiceExpr(
    returnType: IType,
    knownTypes: Map<string, ITypeDefinition>,
    flags: ITypeGenerationFlags,
): FromJsonServiceExprResult {
    switch (returnType.type) {
        case "primitive": {
            const bridgeType = resolveTsTypeForPrimitiveType(returnType.primitive, false, true);
            // Primitives are never null on the wire; no transformation needed.
            if (returnType.primitive === PrimitiveType.BINARY) {
                // Binary endpoints are handled separately (octet-stream); skip transformation.
                return { bridgeType, mappingFnExpr: null, resultApplyExpr: null, refs: [] };
            }
            return { bridgeType, mappingFnExpr: null, resultApplyExpr: null, refs: [] };
        }

        case "list":
        case "set": {
            const itemType = returnType.type === "list" ? returnType.list.itemType : returnType.set.itemType;
            const itemBridgeType = resolveJsonTsType(itemType, DUMMY_BASE, knownTypes, flags, false, false);
            const bridgeType = `Array<${itemBridgeType}> | null | undefined`;

            const { expr: itemExpr, refs } = buildFromJsonFieldExpr(itemType, "item", knownTypes, flags);
            if (itemExpr === "item") {
                return {
                    bridgeType,
                    mappingFnExpr: "(__result) => __result ?? []",
                    resultApplyExpr: "__result ?? []",
                    refs: [],
                };
            }
            const mapExpr = `(__result ?? []).map((item) => ${itemExpr})`;
            return {
                bridgeType,
                mappingFnExpr: `(__result) => ${mapExpr}`,
                resultApplyExpr: mapExpr,
                refs,
            };
        }

        case "map": {
            const bridgeType = resolveJsonTsType(returnType, DUMMY_BASE, knownTypes, flags, false, false);
            return {
                bridgeType,
                mappingFnExpr: "(__result) => __result ?? {}",
                resultApplyExpr: "__result ?? {}",
                refs: [],
            };
        }

        case "optional": {
            const inner = buildFromJsonServiceExpr(returnType.optional.itemType, knownTypes, flags);
            const bridgeType = `${inner.bridgeType} | null`;
            if (inner.mappingFnExpr == null) {
                // Inner needs no transformation — optional just adds nullability.
                return { bridgeType, mappingFnExpr: null, resultApplyExpr: null, refs: [] };
            }
            const applyInner = inner.resultApplyExpr!.replace(/__result/g, "__inner");
            return {
                bridgeType,
                mappingFnExpr: `(__result) => __result != null ? ${applyInner.replace(/__inner/g, "__result")} : __result`,
                resultApplyExpr: `__result != null ? ${inner.resultApplyExpr} : __result`,
                refs: inner.refs,
            };
        }

        case "reference":
            return buildFromJsonServiceExprForReference(returnType.reference, knownTypes, flags);

        case "external":
            return buildFromJsonServiceExpr(returnType.external.fallback, knownTypes, flags);
    }
}

function buildFromJsonServiceExprForReference(
    referencedType: ITypeName,
    knownTypes: Map<string, ITypeDefinition>,
    flags: ITypeGenerationFlags,
): FromJsonServiceExprResult {
    const definition = knownTypes.get(createHashableTypeName(referencedType));
    if (definition == null) {
        throw new Error(
            `Unknown reference type. package: '${referencedType.package}', name: '${referencedType.name}'`,
        );
    }

    if (ITypeDefinition.isEnum(definition)) {
        return { bridgeType: referencedType.name, mappingFnExpr: null, resultApplyExpr: null, refs: [] };
    }

    if (ITypeDefinition.isAlias(definition)) {
        if (!isFlavorizable(definition.alias.alias, flags.flavorizedAliases)) {
            return buildFromJsonServiceExpr(definition.alias.alias, knownTypes, flags);
        }
        return {
            bridgeType: `I${referencedType.name}`,
            mappingFnExpr: null,
            resultApplyExpr: null,
            refs: [],
        };
    }

    // Object or union: use the JSON variant as bridge type; apply fromJson in the .then().
    const funcName = `from${referencedType.name}Json`;
    return {
        bridgeType: `I${referencedType.name}JSON`,
        mappingFnExpr: funcName,
        resultApplyExpr: `${funcName}(__result)`,
        refs: [referencedType],
    };
}
