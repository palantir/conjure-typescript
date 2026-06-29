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

// Direct port of conjure-core ConjureDefinitionValidator.validateAll()
// Orchestrates all validators in the same order as the Java implementation.
//
// Note: Neither this implementation nor the Java original validates `docs` fields.
// JSDoc breakout payloads (e.g., docs: "*/ malicious code /*") are neutralized
// by sanitizeDocs() in docsUtils.ts, which is applied at every point where IR
// strings enter generated JSDoc comments.

import { IConjureDefinition, ITypeDefinition } from "conjure-api";
import { createHashableTypeName } from "./hashingUtils";
import { validateEnumDefinition } from "./validators/enumValidator";
import { validateErrorDefinition } from "./validators/errorValidator";
import { validateFieldName, validateUniqueFieldNames } from "./validators/fieldNameValidator";
import { validatePackageName } from "./validators/packageValidator";
import { validateServiceDefinition } from "./validators/serviceValidator";
import { validateTypeName } from "./validators/typeNameValidator";
import {
    getTypeName,
    validateNoIllegalMapKeys,
    validateNoNestedOptionals,
    validateNoRecursiveTypes,
} from "./validators/typeValidator";
import { validateUnionDefinition } from "./validators/unionValidator";

// Port of ConjureDefinitionValidator.UniqueServiceNamesValidator
function validateUniqueServiceNames(definition: IConjureDefinition): void {
    const seen = new Set<string>();
    for (const service of definition.services) {
        const name = service.serviceName.name;
        if (seen.has(name)) {
            throw new Error(`Duplicate service name: ${name}`);
        }
        seen.add(name);
    }
}

// Port of ConjureDefinitionValidator.UniqueNamesValidator
function validateUniqueNames(definition: IConjureDefinition): void {
    const seen = new Set<string>();

    for (const typeDef of definition.types) {
        const key = createHashableTypeName(getTypeName(typeDef));
        if (seen.has(key)) {
            throw new Error(`Duplicate type/error/service name: ${key}`);
        }
        seen.add(key);
    }

    for (const errorDef of definition.errors) {
        const key = createHashableTypeName(errorDef.errorName);
        if (seen.has(key)) {
            throw new Error(`Duplicate type/error/service name: ${key}`);
        }
        seen.add(key);
    }

    for (const serviceDef of definition.services) {
        const key = createHashableTypeName(serviceDef.serviceName);
        if (seen.has(key)) {
            throw new Error(`Duplicate type/error/service name: ${key}`);
        }
        seen.add(key);
    }
}

// Port of ConjureDefinitionValidator.UniqueErrorNameValidator
function validateUniqueErrorNames(definition: IConjureDefinition): void {
    const seen = new Set<string>();
    for (const errorDef of definition.errors) {
        const key = `${errorDef.namespace}:${errorDef.errorName.name}`;
        if (seen.has(key)) {
            throw new Error(`Duplicate error name: ${key}`);
        }
        seen.add(key);
    }
}

// Compute knownTypes map (same as computeKnownTypes in generator.ts but without error types)
function computeKnownTypes(definition: IConjureDefinition): Map<string, ITypeDefinition> {
    const knownTypes = new Map<string, ITypeDefinition>();

    for (const typeDef of definition.types) {
        const typeName = getTypeName(typeDef);
        knownTypes.set(createHashableTypeName(typeName), typeDef);
    }

    return knownTypes;
}

/**
 * Validates a Conjure IR definition against all conjure-core validation rules.
 * This is a direct port of ConjureDefinitionValidator.validateAll() from the Java implementation.
 *
 * Throws an Error with a descriptive message on the first validation failure.
 */
export function validateConjureDefinition(definition: IConjureDefinition): void {
    // --- Top-level orchestrator validators ---

    // 1. Unique service names
    validateUniqueServiceNames(definition);

    // 2. (Skipping IllegalVersion — IR version checking is out of scope)
    // (Skipping LogSafetyConjureDefinitionValidator — requires SafetyDeclarationRequirements
    //  config which is a compile-time policy flag. We receive pre-compiled IR where the Conjure
    //  compiler already enforced this.)

    // 3. No recursive types
    validateNoRecursiveTypes(definition);

    // 4. Unique names across types, errors, services
    validateUniqueNames(definition);

    // Compute known types for dealiasing-dependent validators
    const knownTypes = computeKnownTypes(definition);

    // 5. No nested optionals
    validateNoNestedOptionals(definition, knownTypes);

    // 6. No illegal map keys
    validateNoIllegalMapKeys(definition, knownTypes);

    // 7. Unique error names
    validateUniqueErrorNames(definition);

    // --- Per-type validators ---

    for (const typeDef of definition.types) {
        const typeName = getTypeName(typeDef);
        const context = `type ${typeName.name}`;
        validateTypeName(typeName.name, context);
        validatePackageName(typeName.package, context);

        if (ITypeDefinition.isEnum(typeDef)) {
            validateEnumDefinition(typeDef.enum);
        } else if (ITypeDefinition.isObject(typeDef)) {
            // Validate field names
            const fieldNames = typeDef.object.fields.map(f => f.fieldName);
            for (const fieldName of fieldNames) {
                validateFieldName(fieldName, `object ${typeName.name}`);
            }
            validateUniqueFieldNames(fieldNames, `ObjectDefinition ${typeName.name}`);
        } else if (ITypeDefinition.isUnion(typeDef)) {
            // Validate union member field names (Java does this in parseField())
            for (const member of typeDef.union.union) {
                validateFieldName(member.fieldName, `union ${typeName.name}`);
            }
            validateUnionDefinition(typeDef.union);
        }
    }

    // --- Per-service validators (includes per-endpoint validation) ---

    for (const serviceDef of definition.services) {
        validateServiceDefinition(serviceDef, knownTypes);
    }

    // --- Per-error validators ---

    for (const errorDef of definition.errors) {
        const context = `error ${errorDef.errorName.name}`;
        validateTypeName(errorDef.errorName.name, context);
        validatePackageName(errorDef.errorName.package, context);
        validateErrorDefinition(errorDef);
    }
}
