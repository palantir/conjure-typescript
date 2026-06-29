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

// Direct port of conjure-core EnumDefinitionValidator.java + EnumValueDefinitionValidator.java + EnumPattern.java
// Enum value pattern: [A-Z][A-Z0-9]*(_[A-Z0-9]+)*

import { IEnumDefinition } from "conjure-api";

const ENUM_VALUE_PATTERN = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

// Port of EnumValueDefinitionValidator.FormatValidator
export function validateEnumValue(value: string, context: string): void {
    if (!ENUM_VALUE_PATTERN.test(value)) {
        throw new Error(`Enumeration values must match format ${ENUM_VALUE_PATTERN}: "${value}" in ${context}`);
    }
}

// Port of EnumValueDefinitionValidator.UnknownValueNotUsedValidator
export function validateEnumValueNotUnknown(value: string, context: string): void {
    if (value.toUpperCase() === "UNKNOWN") {
        throw new Error(`UNKNOWN is a reserved enumeration value and cannot be used in ${context}`);
    }
}

// Port of EnumDefinitionValidator.UniqueEnumValuesValidator
function validateUniqueEnumValues(definition: IEnumDefinition, context: string): void {
    const seen = new Set<string>();
    for (const valueDef of definition.values) {
        if (seen.has(valueDef.value)) {
            throw new Error(`Cannot declare an enum with duplicate enum values: "${valueDef.value}" in ${context}`);
        }
        seen.add(valueDef.value);
    }
}

// Port of EnumDefinitionValidator.validateAll()
export function validateEnumDefinition(definition: IEnumDefinition): void {
    const context = `enum ${definition.typeName.name}`;
    validateUniqueEnumValues(definition, context);
    for (const valueDef of definition.values) {
        validateEnumValue(valueDef.value, context);
        validateEnumValueNotUnknown(valueDef.value, context);
    }
}
