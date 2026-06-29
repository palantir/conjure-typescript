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

// Direct port of conjure-core ErrorDefinitionValidator.java + ErrorNamespaceValidator.java
// Note: Error namespace and error code validation are handled at the parser/compiler level in Java,
// not in ConjureDefinitionValidator.validateAll(). We include them here as defense-in-depth since
// we receive pre-compiled IR and cannot assume upstream validation has run.

import { IErrorDefinition } from "conjure-api";
import { convertToCamelCase, validateFieldName } from "./fieldNameValidator";

// Port of ErrorNamespaceValidator
// Pattern: (([A-Z][a-z0-9]+)+) — same structure as TypeName (PascalCase)
const ERROR_NAMESPACE_PATTERN = /^([A-Z][a-z0-9]+)+$/;

export function validateErrorNamespace(namespace: string, context: string): void {
    if (!ERROR_NAMESPACE_PATTERN.test(namespace)) {
        throw new Error(
            `Namespace for errors must match pattern ${ERROR_NAMESPACE_PATTERN}: "${namespace}" in ${context}`,
        );
    }
}

// Valid error codes (fixed enum from conjure spec)
const VALID_ERROR_CODES = new Set([
    "PERMISSION_DENIED",
    "INVALID_ARGUMENT",
    "NOT_FOUND",
    "CONFLICT",
    "REQUEST_ENTITY_TOO_LARGE",
    "FAILED_PRECONDITION",
    "INTERNAL",
    "TIMEOUT",
    "CUSTOM_CLIENT",
    "CUSTOM_SERVER",
]);

export function validateErrorCode(code: string, context: string): void {
    if (!VALID_ERROR_CODES.has(code)) {
        throw new Error(
            `Invalid error code "${code}" in ${context}. ` +
                `Must be one of: ${Array.from(VALID_ERROR_CODES).join(", ")}`,
        );
    }
}

// Port of ErrorDefinitionValidator — unique field names across safe+unsafe args
export function validateErrorDefinition(definition: IErrorDefinition): void {
    const context = `error ${definition.errorName.name}`;

    // Validate namespace
    if (definition.namespace != null) {
        validateErrorNamespace(definition.namespace, context);
    }

    // Validate error code
    validateErrorCode(definition.code, context);

    // Validate and collect field names for uniqueness check
    const allArgs = (definition.safeArgs || []).concat(definition.unsafeArgs || []);
    const seenNormalized = new Map<string, string>();

    for (const arg of allArgs) {
        validateFieldName(arg.fieldName, context);

        const normalized = convertToCamelCase(arg.fieldName);
        const existing = seenNormalized.get(normalized);
        if (existing !== undefined) {
            throw new Error(
                `${context} must not contain duplicate field names (modulo case normalization): ` +
                    `${arg.fieldName} vs ${existing}`,
            );
        }
        seenNormalized.set(normalized, arg.fieldName);
    }

    // Safety is implicit from safeArgs/unsafeArgs placement — explicit declarations are not allowed
    const fieldsDeclaringSafety = allArgs.filter(arg => arg.safety != null).map(arg => arg.fieldName);
    if (fieldsDeclaringSafety.length > 0) {
        throw new Error(
            `ErrorDefinition field safety is defined by the key 'safeArgs' or 'unsafeArgs', ` +
                `safety cannot be declared: ${fieldsDeclaringSafety.join(", ")} in ${context}`,
        );
    }
}
