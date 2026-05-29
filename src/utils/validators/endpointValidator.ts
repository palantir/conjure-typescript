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

// Direct port of conjure-core EndpointDefinitionValidator.java (13 sub-validators)

import { IEndpointDefinition, IParameterType, IType, ITypeDefinition } from "conjure-api";
import { matchesAnyFieldNameCase, matchesCamelCase } from "./fieldNameValidator";
import { pathArgs } from "./httpPathValidator";
import { dealias, isAny, isBearerToken, isBinary, isEnum, isPrimitive } from "./typeValidator";

const HEADER_PATTERN = /^[A-Z][a-zA-Z0-9]*(-[A-Z][a-zA-Z0-9]*)*$/;
const PROTOCOL_HEADERS = new Set(["Host", "Accept", "Content-Type"]);

function describe(endpoint: IEndpointDefinition): string {
    return `${endpoint.endpointName}{http: ${endpoint.httpMethod} ${endpoint.httpPath}}`;
}

// Validator 1: NonBodyArgumentTypeValidator
// Non-body parameters cannot contain 'binary' or 'any' types
function validateNonBodyArgumentTypes(endpoint: IEndpointDefinition, knownTypes: Map<string, ITypeDefinition>): void {
    for (const arg of endpoint.args) {
        if (IParameterType.isBody(arg.paramType)) {
            continue;
        }
        if (!validateTypeNotBinaryOrAny(arg.type, knownTypes)) {
            throw new Error(
                `Non body parameters cannot contain the 'binary' or 'any' type. ` +
                    `Parameter '${arg.argName}' in endpoint '${describe(endpoint)}'`,
            );
        }
    }
}

function validateTypeNotBinaryOrAny(type: IType, knownTypes: Map<string, ITypeDefinition>): boolean {
    const resolved = dealias(type, knownTypes);
    if (resolved === undefined) {
        return true; // resolved to a type definition (not a primitive)
    }
    if (IType.isOptional(resolved)) {
        return validateTypeNotBinaryOrAny(resolved.optional.itemType, knownTypes);
    }
    if (IType.isList(resolved)) {
        return validateTypeNotBinaryOrAny(resolved.list.itemType, knownTypes);
    }
    if (IType.isSet(resolved)) {
        return validateTypeNotBinaryOrAny(resolved.set.itemType, knownTypes);
    }
    return !isBinary(resolved) && !isAny(resolved);
}

// Validator 2: SingleBodyParamValidator
function validateSingleBodyParam(endpoint: IEndpointDefinition): void {
    const bodyParams = endpoint.args.filter(arg => IParameterType.isBody(arg.paramType));
    if (bodyParams.length > 1) {
        throw new Error(
            `Endpoint '${describe(endpoint)}' cannot have multiple body parameters: ` +
                `[${bodyParams.map(p => p.argName).join(", ")}]`,
        );
    }
}

// Validator 3: PathParamValidator
function validatePathParams(endpoint: IEndpointDefinition): void {
    const pathParamIds = new Set<string>();
    for (const arg of endpoint.args) {
        if (IParameterType.isPath(arg.paramType)) {
            if (pathParamIds.has(arg.argName)) {
                throw new Error(
                    `Path parameter with identifier "${arg.argName}" is defined multiple times ` +
                        `for endpoint '${describe(endpoint)}'`,
                );
            }
            pathParamIds.add(arg.argName);
        }
    }

    const templateArgs = pathArgs(endpoint.httpPath);

    // Check for extra params not in path
    pathParamIds.forEach(paramId => {
        if (!templateArgs.has(paramId)) {
            throw new Error(
                `Path parameter "${paramId}" defined in endpoint but not present in path template ` +
                    `for endpoint '${describe(endpoint)}'`,
            );
        }
    });

    // Check for path template vars not in params
    templateArgs.forEach(templateArg => {
        if (!pathParamIds.has(templateArg)) {
            throw new Error(
                `Path parameter "${templateArg}" defined in path template but not present in endpoint ` +
                    `for endpoint '${describe(endpoint)}'`,
            );
        }
    });
}

// Validator 4: NoBearerTokenPathOrQueryParams
function validateNoBearerTokenPathOrQuery(
    endpoint: IEndpointDefinition,
    knownTypes: Map<string, ITypeDefinition>,
): void {
    for (const arg of endpoint.args) {
        if (!IParameterType.isPath(arg.paramType) && !IParameterType.isQuery(arg.paramType)) {
            continue;
        }
        if (!validateTypeNotBearerToken(arg.type, knownTypes)) {
            throw new Error(
                `Path or query parameters of type 'bearertoken' are not allowed. ` +
                    `Parameter '${arg.argName}' in endpoint '${describe(endpoint)}'`,
            );
        }
    }
}

function validateTypeNotBearerToken(type: IType, knownTypes: Map<string, ITypeDefinition>): boolean {
    const resolved = dealias(type, knownTypes);
    if (resolved === undefined) {
        return true;
    }
    if (IType.isOptional(resolved)) {
        return validateTypeNotBearerToken(resolved.optional.itemType, knownTypes);
    }
    if (IType.isList(resolved)) {
        return validateTypeNotBearerToken(resolved.list.itemType, knownTypes);
    }
    if (IType.isSet(resolved)) {
        return validateTypeNotBearerToken(resolved.set.itemType, knownTypes);
    }
    return !isBearerToken(resolved);
}

// Validator 5: NoComplexPathParamValidator
function validateNoComplexPathParams(endpoint: IEndpointDefinition, knownTypes: Map<string, ITypeDefinition>): void {
    for (const arg of endpoint.args) {
        if (!IParameterType.isPath(arg.paramType)) {
            continue;
        }
        if (!isPrimitive(arg.type, knownTypes) && !isEnum(arg.type, knownTypes)) {
            throw new Error(
                `Path parameters must be primitives or aliases to primitives or enums. ` +
                    `Parameter '${arg.argName}' in endpoint '${describe(endpoint)}'`,
            );
        }
    }
}

// Validator 6: NoComplexHeaderParamValidator
function validateNoComplexHeaderParams(endpoint: IEndpointDefinition, knownTypes: Map<string, ITypeDefinition>): void {
    for (const arg of endpoint.args) {
        if (!IParameterType.isHeader(arg.paramType)) {
            continue;
        }
        if (!validateHeaderType(arg.type, knownTypes)) {
            throw new Error(
                `Header parameters must be enums, primitives, aliases or optional primitive. ` +
                    `Parameter '${arg.argName}' in endpoint '${describe(endpoint)}'`,
            );
        }
    }
}

function validateHeaderType(type: IType, knownTypes: Map<string, ITypeDefinition>): boolean {
    // Dealias first (matching Java's visitor.dealias(type).fold(...))
    if (isEnum(type, knownTypes)) {
        return true;
    }
    const resolved = dealias(type, knownTypes);
    if (resolved === undefined) {
        return false; // resolved to a non-enum type definition
    }
    if (IType.isPrimitive(resolved)) {
        return true;
    }
    if (IType.isOptional(resolved)) {
        return validateHeaderType(resolved.optional.itemType, knownTypes);
    }
    return false;
}

// Validator 7: NoComplexQueryParamValidator
function validateNoComplexQueryParams(endpoint: IEndpointDefinition, knownTypes: Map<string, ITypeDefinition>): void {
    for (const arg of endpoint.args) {
        if (!IParameterType.isQuery(arg.paramType)) {
            continue;
        }
        if (!validateQueryType(arg.type, knownTypes, false)) {
            throw new Error(
                `Query parameters must be enums or primitives when de-aliased. ` +
                    `Parameter '${arg.argName}' in endpoint '${describe(endpoint)}'`,
            );
        }
    }
}

function validateQueryType(type: IType, knownTypes: Map<string, ITypeDefinition>, isNested: boolean): boolean {
    // Dealias first (matching Java's visitor.dealias(type).fold(...))
    if (isEnum(type, knownTypes)) {
        return true;
    }
    const resolved = dealias(type, knownTypes);
    if (resolved === undefined) {
        return false; // resolved to a non-enum type definition
    }
    if (IType.isPrimitive(resolved)) {
        return !isAny(resolved);
    }
    if (IType.isOptional(resolved) && !isNested) {
        return validateQueryType(resolved.optional.itemType, knownTypes, true);
    }
    if (IType.isList(resolved) && !isNested) {
        return validateQueryType(resolved.list.itemType, knownTypes, true);
    }
    if (IType.isSet(resolved) && !isNested) {
        return validateQueryType(resolved.set.itemType, knownTypes, true);
    }
    return false;
}

// Validator 8: NoGetBodyParamValidator
function validateNoGetBody(endpoint: IEndpointDefinition): void {
    if (endpoint.httpMethod.toString() === "GET") {
        const hasBody = endpoint.args.some(arg => IParameterType.isBody(arg.paramType));
        if (hasBody) {
            throw new Error(`Endpoint '${describe(endpoint)}' cannot be a GET and contain a body`);
        }
    }
}

// Validator 9: NoOptionalBinaryBodyParamValidator
function validateNoOptionalBinaryBody(endpoint: IEndpointDefinition, knownTypes: Map<string, ITypeDefinition>): void {
    for (const arg of endpoint.args) {
        if (!IParameterType.isBody(arg.paramType)) {
            continue;
        }
        const resolved = dealias(arg.type, knownTypes);
        if (resolved !== undefined && IType.isOptional(resolved)) {
            const inner = dealias(resolved.optional.itemType, knownTypes);
            if (inner !== undefined && isBinary(inner)) {
                throw new Error(
                    `Endpoint BODY argument must not be optional<binary> or alias thereof. ` +
                        `Parameter '${arg.argName}' in endpoint '${describe(endpoint)}'`,
                );
            }
        }
    }
}

// Validator 10: ParameterNameValidator
function validateParameterNames(endpoint: IEndpointDefinition): void {
    for (const arg of endpoint.args) {
        if (!matchesCamelCase(arg.argName)) {
            throw new Error(
                `Parameter names in endpoint paths and service definitions must be camelCase: ` +
                    `"${arg.argName}" on endpoint '${describe(endpoint)}'`,
            );
        }
    }
}

// Validator 11: ParamIdValidator
function validateParamIds(endpoint: IEndpointDefinition): void {
    for (const arg of endpoint.args) {
        if (IParameterType.isBody(arg.paramType) || IParameterType.isPath(arg.paramType)) {
            continue;
        }

        if (IParameterType.isHeader(arg.paramType)) {
            const paramId = arg.paramType.header.paramId;
            if (paramId != null) {
                if (!HEADER_PATTERN.test(paramId)) {
                    throw new Error(
                        `Header parameter id "${paramId}" on endpoint '${describe(endpoint)}' ` +
                            `must match pattern ${HEADER_PATTERN}`,
                    );
                }
                if (PROTOCOL_HEADERS.has(paramId)) {
                    throw new Error(
                        `Header parameter id "${paramId}" on endpoint '${describe(endpoint)}' ` +
                            `should not be one of the protocol headers: ${Array.from(PROTOCOL_HEADERS).join(", ")}`,
                    );
                }
            }
        } else if (IParameterType.isQuery(arg.paramType)) {
            const paramId = arg.paramType.query.paramId;
            if (paramId != null && !matchesAnyFieldNameCase(paramId)) {
                throw new Error(
                    `Query param id "${paramId}" on endpoint '${describe(endpoint)}' ` +
                        `must match one of: camelCase, kebab-case, or snake_case`,
                );
            }
        }
    }
}

// Validator 12: NoUnsupportedHttpMethodValidator
function validateHttpMethod(endpoint: IEndpointDefinition): void {
    const method = endpoint.httpMethod.toString();
    if (method === "UNKNOWN") {
        throw new Error(`HTTP method must not be UNKNOWN in endpoint '${describe(endpoint)}'`);
    }
}

// Validator 13: NoDuplicateEndpointErrorsValidator
function validateNoDuplicateEndpointErrors(endpoint: IEndpointDefinition): void {
    if (endpoint.errors == null) {
        return;
    }
    const seen = new Set<string>();
    for (const endpointError of endpoint.errors) {
        const errorTypeName = endpointError.error;
        const uniqueId = `${errorTypeName.name}:${errorTypeName.namespace}`;
        if (seen.has(uniqueId)) {
            throw new Error(
                `Error '${errorTypeName.name}' with namespace '${errorTypeName.namespace}' ` +
                    `is declared multiple times in endpoint '${describe(endpoint)}'`,
            );
        }
        seen.add(uniqueId);
    }
}

// Defense-in-depth: validate endpointName is a safe identifier.
// Java validates this at the parser level (EndpointName.of()), not in EndpointDefinitionValidator.
// Since we receive pre-compiled IR, we validate here to prevent code injection via method names.
function validateEndpointName(endpoint: IEndpointDefinition): void {
    if (!matchesCamelCase(endpoint.endpointName)) {
        throw new Error(
            `Endpoint names must be camelCase: "${endpoint.endpointName}" in endpoint '${describe(endpoint)}'`,
        );
    }
}

// Port of EndpointDefinitionValidator.validateAll()
export function validateEndpointDefinition(
    endpoint: IEndpointDefinition,
    knownTypes: Map<string, ITypeDefinition>,
): void {
    validateEndpointName(endpoint);
    validateNonBodyArgumentTypes(endpoint, knownTypes);
    validateSingleBodyParam(endpoint);
    validatePathParams(endpoint);
    validateNoBearerTokenPathOrQuery(endpoint, knownTypes);
    validateNoComplexPathParams(endpoint, knownTypes);
    validateNoComplexHeaderParams(endpoint, knownTypes);
    validateNoComplexQueryParams(endpoint, knownTypes);
    validateNoGetBody(endpoint);
    validateNoOptionalBinaryBody(endpoint, knownTypes);
    validateParameterNames(endpoint);
    validateParamIds(endpoint);
    validateHttpMethod(endpoint);
    validateNoDuplicateEndpointErrors(endpoint);
}
