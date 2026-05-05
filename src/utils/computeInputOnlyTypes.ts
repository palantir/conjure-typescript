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

import { IConjureDefinition, IType, ITypeDefinition } from "conjure-api";
import { createHashableTypeName } from "./hashingUtils";

/**
 * Returns the set of hashable type names that are reachable only from endpoint input positions
 * (endpoint args, transitively through fields/members/aliases). These types are emitted with
 * `isParameterType=true` so list/set fields become `ReadonlyArray<T>`.
 *
 * Output positions include endpoint return values and any errors (declared or referenced by
 * endpoints). A type used in both input and output positions is excluded.
 */
export function computeInputOnlyTypes(definition: IConjureDefinition): Set<string> {
    const knownTypes = new Map<string, ITypeDefinition>();
    for (const t of definition.types) {
        knownTypes.set(createHashableTypeName(typeNameOf(t)), t);
    }

    const inputUsed = new Set<string>();
    const outputUsed = new Set<string>();

    const visit = (type: IType, set: Set<string>): void => {
        switch (type.type) {
            case "primitive":
                return;
            case "list":
                visit(type.list.itemType, set);
                return;
            case "set":
                visit(type.set.itemType, set);
                return;
            case "map":
                visit(type.map.keyType, set);
                visit(type.map.valueType, set);
                return;
            case "optional":
                visit(type.optional.itemType, set);
                return;
            case "external":
                visit(type.external.fallback, set);
                return;
            case "reference": {
                const k = createHashableTypeName(type.reference);
                if (set.has(k)) return;
                set.add(k);
                const def = knownTypes.get(k);
                if (def == null) return;
                switch (def.type) {
                    case "object":
                        def.object.fields.forEach(f => visit(f.type, set));
                        return;
                    case "union":
                        def.union.union.forEach(f => visit(f.type, set));
                        return;
                    case "alias":
                        visit(def.alias.alias, set);
                        return;
                    case "enum":
                        return;
                }
            }
        }
    };

    for (const svc of definition.services) {
        for (const ep of svc.endpoints) {
            ep.args.forEach(arg => visit(arg.type, inputUsed));
            if (ep.returns != null) visit(ep.returns, outputUsed);
        }
    }

    // All errors live in output positions: their fields are read by the caller when an error is thrown.
    for (const errDef of definition.errors) {
        errDef.safeArgs.forEach(arg => visit(arg.type, outputUsed));
        errDef.unsafeArgs.forEach(arg => visit(arg.type, outputUsed));
    }

    const result = new Set<string>();
    inputUsed.forEach(k => {
        if (!outputUsed.has(k)) result.add(k);
    });
    return result;
}

function typeNameOf(t: ITypeDefinition) {
    switch (t.type) {
        case "alias":
            return t.alias.typeName;
        case "enum":
            return t.enum.typeName;
        case "object":
            return t.object.typeName;
        case "union":
            return t.union.typeName;
    }
}
