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

// Direct port of conjure-core Java validators:
// - CamelCasePattern, KebabCasePattern, SnakeCasePattern (conjure-generator-common)
// - CaseConverter (conjure-generator-common)
// - FieldNameValidator (conjure-core)
// - UniqueFieldNamesValidator (conjure-core)

function isLower(ch: string): boolean {
    return ch >= "a" && ch <= "z";
}

function isUpper(ch: string): boolean {
    return ch >= "A" && ch <= "Z";
}

function isNumeric(ch: string): boolean {
    return ch >= "0" && ch <= "9";
}

// Port of CamelCasePattern.matches()
// Regex equivalent: ^[a-z]([A-Z]{1,2}[a-z0-9]|[a-z0-9])*[A-Z]?$
export function matchesCamelCase(value: string): boolean {
    if (value.length === 0 || !isLower(value[0])) {
        return false;
    }
    let uppercaseChars = 0;
    for (let i = 1; i < value.length; i++) {
        const ch = value[i];
        if (isLower(ch) || isNumeric(ch)) {
            uppercaseChars = 0;
        } else if (isUpper(ch)) {
            if (uppercaseChars >= 2) {
                return false;
            }
            uppercaseChars++;
        } else {
            return false;
        }
    }
    return uppercaseChars <= 1;
}

// Port of KebabCasePattern.matches()
// Regex equivalent: ^[a-z]((-[a-z]){1,2}[a-z0-9]|[a-z0-9])*(-[a-z])?$
export function matchesKebabCase(value: string): boolean {
    if (value.length === 0 || !isLower(value[0])) {
        return false;
    }
    let dashChars = 0;
    for (let i = 1; i < value.length; i++) {
        const ch = value[i];
        if (ch === "-") {
            i++;
            if (i >= value.length || dashChars >= 2 || !isLower(value[i])) {
                return false;
            }
            dashChars++;
        } else {
            dashChars = 0;
            if (!isLower(ch) && !isNumeric(ch)) {
                return false;
            }
        }
    }
    return dashChars <= 1;
}

// Port of SnakeCasePattern.matches()
// Regex equivalent: ^[a-z]((_[a-z]){1,2}[a-z0-9]|[a-z0-9])*(_[a-z])?$
export function matchesSnakeCase(value: string): boolean {
    if (value.length === 0 || !isLower(value[0])) {
        return false;
    }
    let underscoreChars = 0;
    for (let i = 1; i < value.length; i++) {
        const ch = value[i];
        if (ch === "_") {
            i++;
            if (i >= value.length || underscoreChars >= 2 || !isLower(value[i])) {
                return false;
            }
            underscoreChars++;
        } else {
            underscoreChars = 0;
            if (!isLower(ch) && !isNumeric(ch)) {
                return false;
            }
        }
    }
    return underscoreChars <= 1;
}

export function matchesAnyFieldNameCase(value: string): boolean {
    return matchesCamelCase(value) || matchesKebabCase(value) || matchesSnakeCase(value);
}

type FieldNameCase = "camelCase" | "kebabCase" | "snakeCase";

function detectCase(value: string): FieldNameCase | undefined {
    if (matchesCamelCase(value)) {
        return "camelCase";
    }
    if (matchesKebabCase(value)) {
        return "kebabCase";
    }
    if (matchesSnakeCase(value)) {
        return "snakeCase";
    }
    return undefined;
}

// Port of CaseConverter: convert between camelCase, kebab-case, and snake_case

function splitKebabCase(value: string): string[] {
    return value.split("-");
}

function splitSnakeCase(value: string): string[] {
    return value.split("_");
}

function toCamelCase(parts: string[]): string {
    return (
        parts[0] +
        parts
            .slice(1)
            .map(p => p.charAt(0).toUpperCase() + p.slice(1))
            .join("")
    );
}

export function convertToCamelCase(value: string): string {
    const nameCase = detectCase(value);
    if (nameCase === undefined) {
        throw new Error(`Cannot convert field name to camelCase, unrecognized case: ${value}`);
    }
    switch (nameCase) {
        case "camelCase":
            return value;
        case "kebabCase":
            return toCamelCase(splitKebabCase(value));
        case "snakeCase":
            return toCamelCase(splitSnakeCase(value));
    }
}

// Port of FieldNameValidator.validate()
export function validateFieldName(fieldName: string, context: string): void {
    if (!matchesAnyFieldNameCase(fieldName)) {
        throw new Error(
            `FieldName "${fieldName}" in ${context} must follow one of the following patterns: ` +
                `camelCase, kebab-case, or snake_case.`,
        );
    }
}

// Port of UniqueFieldNamesValidator
export function validateUniqueFieldNames(fieldNames: string[], context: string): void {
    const seenNormalized = new Map<string, string>();
    for (const fieldName of fieldNames) {
        const normalized = convertToCamelCase(fieldName);
        const existing = seenNormalized.get(normalized);
        if (existing !== undefined) {
            throw new Error(
                `${context} must not contain duplicate field names (modulo case normalization): ` +
                    `${fieldName} vs ${existing}`,
            );
        }
        seenNormalized.set(normalized, fieldName);
    }
}
