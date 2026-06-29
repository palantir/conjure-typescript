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

// Direct port of conjure-core TypeNameValidator.java
// Pattern: ^[A-Z][a-z0-9]+([A-Z][a-z0-9]+)*$

const TYPE_NAME_PATTERN = /^[A-Z][a-z0-9]+([A-Z][a-z0-9]+)*$/;

const PRIMITIVE_TYPES = new Set([
    "STRING",
    "DATETIME",
    "INTEGER",
    "DOUBLE",
    "SAFELONG",
    "BINARY",
    "ANY",
    "BOOLEAN",
    "UUID",
    "RID",
    "BEARERTOKEN",
]);

export function validateTypeName(name: string, context: string): void {
    if (!TYPE_NAME_PATTERN.test(name) && !PRIMITIVE_TYPES.has(name)) {
        throw new Error(
            `TypeNames must be a primitive type or match pattern ${TYPE_NAME_PATTERN}: ` + `"${name}" in ${context}`,
        );
    }
}
