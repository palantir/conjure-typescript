/**
 * @license
 * Copyright 2018 Palantir Technologies, Inc.
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
import { IEndpointDefinition, IEnumValueDefinition, IFieldDefinition, ITypeName } from "conjure-api";

export const CONJURE_CLIENT = "conjure-client";

export function doubleQuote(value: string): string {
    return `"${value}"`;
}

export function singleQuote(value: string): string {
    return `'${value}'`;
}

const fieldSeparator = "|-|";
export function createHashableTypeName(typeName: ITypeName) {
    return `${typeName.package}${fieldSeparator}${typeName.name}`;
}

export function dissasembleHashableTypeName(hashTypeName: string) {
    const [packageName, name] = hashTypeName.split(fieldSeparator);
    return { package: packageName, name };
}

export function isValidFunctionName(value: string) {
    return strictModeReservedKeywords.has(value) || reservedKeywords.has(value);
}

// Keywords taken from https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
const reservedKeywords = new Set([
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
]);
const strictModeReservedKeywords = new Set([
    "implements",
    "interface",
    "let",
    "package",
    "private",
    "protected",
    "public",
    "static",
    "yield",
]);

type DeprecatableDefinitions = IFieldDefinition | IEnumValueDefinition | IEndpointDefinition;
export function addDeprecatedToDocs<T extends DeprecatableDefinitions>(typeDefintion: T): string[] | undefined {
    if (typeDefintion.deprecated !== undefined && typeDefintion.deprecated !== null) {
        if (typeDefintion.docs !== undefined && typeDefintion.docs !== null) {
            // Do not add deprecated JSDoc if already exists
            if (typeDefintion.docs.indexOf("@deprecated") === -1) {
                return [typeDefintion.docs + `\n@deprecated ${typeDefintion.deprecated}`];
            }
        } else {
            return [`@deprecated ${typeDefintion.deprecated}`];
        }
    }
    return typeDefintion.docs != null ? [typeDefintion.docs] : undefined;
}
