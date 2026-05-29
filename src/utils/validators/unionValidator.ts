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

// Direct port of conjure-core UnionDefinitionValidator.java
// Three sub-validators: KeySyntax, NoTrailingUnderscore, NoClobberType

import { IUnionDefinition } from "conjure-api";

// Port of Character.isJavaIdentifierStart / isJavaIdentifierPart
// Java identifiers allow: letters, digits, _, $
// Start must be: letter, _, $
function isJavaIdentifierStart(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_" || ch === "$";
}

function isJavaIdentifierPart(ch: string): boolean {
    return isJavaIdentifierStart(ch) || (ch >= "0" && ch <= "9");
}

function isValidJavaIdentifier(key: string): boolean {
    if (key.length === 0 || !isJavaIdentifierStart(key[0])) {
        return false;
    }
    for (let i = 1; i < key.length; i++) {
        if (!isJavaIdentifierPart(key[i])) {
            return false;
        }
    }
    return true;
}

// Port of UnionDefinitionValidator.KeySyntaxValidator
function validateKeySyntax(fieldName: string, context: string): void {
    if (fieldName.length === 0) {
        throw new Error(`Union member key must not be empty in ${context}`);
    }
    if (!isValidJavaIdentifier(fieldName)) {
        throw new Error(`Union member key must be a valid Java identifier: "${fieldName}" in ${context}`);
    }
}

// Port of UnionDefinitionValidator.NoTrailingUnderscoreValidator
function validateNoTrailingUnderscore(fieldName: string, context: string): void {
    if (fieldName.endsWith("_")) {
        throw new Error(`Union member key must not end with an underscore: "${fieldName}" in ${context}`);
    }
}

// Port of UnionDefinitionValidator.NoClobberTypeValidator
function validateNoClobberType(fieldName: string, context: string): void {
    if (fieldName === "type") {
        throw new Error(`Union member key must not be 'type' in ${context}`);
    }
}

// Port of UnionDefinitionValidator.validateAll()
export function validateUnionDefinition(definition: IUnionDefinition): void {
    const context = `union ${definition.typeName.name}`;
    for (const fieldDef of definition.union) {
        validateKeySyntax(fieldDef.fieldName, context);
        validateNoTrailingUnderscore(fieldDef.fieldName, context);
        validateNoClobberType(fieldDef.fieldName, context);
    }
}
