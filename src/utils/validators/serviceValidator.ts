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

// Direct port of conjure-core ServiceDefinitionValidator.java
// Two sub-validators: UniquePathMethods, IllegalSuffixes

import { IServiceDefinition, ITypeDefinition } from "conjure-api";
import { validateEndpointDefinition } from "./endpointValidator";
import { validateHttpPath } from "./httpPathValidator";
import { validatePackageName } from "./packageValidator";
import { validateTypeName } from "./typeNameValidator";

const PATHVAR_PATTERN = /\{.+?\}/g;
const RETROFIT_SUFFIX = "Retrofit";

// Port of ServiceDefinitionValidator.UniquePathMethodsValidator
function validateUniquePathMethods(definition: IServiceDefinition): void {
    const pathToEndpoints = new Map<string, string[]>();

    for (const endpoint of definition.endpoints) {
        let methodPath = `${endpoint.httpMethod} ${endpoint.httpPath}`;
        // Normalize all path parameter variables to {arg}
        methodPath = methodPath.replace(PATHVAR_PATTERN, "{arg}");

        const existing = pathToEndpoints.get(methodPath);
        if (existing !== undefined) {
            existing.push(endpoint.endpointName);
        } else {
            pathToEndpoints.set(methodPath, [endpoint.endpointName]);
        }
    }

    pathToEndpoints.forEach((endpoints, key) => {
        if (endpoints.length > 1) {
            throw new Error(`Endpoint "${key}" is defined by multiple endpoints: [${endpoints.join(", ")}]`);
        }
    });
}

// Port of ServiceDefinitionValidator.IllegalSuffixesValidator
function validateIllegalSuffixes(definition: IServiceDefinition): void {
    if (definition.serviceName.name.endsWith(RETROFIT_SUFFIX)) {
        throw new Error(`Service name must not end in ${RETROFIT_SUFFIX}: ${definition.serviceName.name}`);
    }
}

// Port of ServiceDefinitionValidator.validateAll() + per-endpoint validation
export function validateServiceDefinition(
    definition: IServiceDefinition,
    knownTypes: Map<string, ITypeDefinition>,
): void {
    const context = `service ${definition.serviceName.name}`;

    validateTypeName(definition.serviceName.name, context);
    validatePackageName(definition.serviceName.package, context);
    validateUniquePathMethods(definition);
    validateIllegalSuffixes(definition);

    for (const endpoint of definition.endpoints) {
        validateHttpPath(endpoint.httpPath, `${context} endpoint ${endpoint.endpointName}`);
        validateEndpointDefinition(endpoint, knownTypes);
    }
}
