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

// Direct port of conjure-core HttpPathValidator.java

const SEGMENT_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
const PARAM_PATTERN = /^[a-z][a-z0-9]*([A-Z0-9][a-z0-9]+)*$/;

// Extract path parameter names from a path template
export function pathArgs(httpPath: string): Set<string> {
    const args = new Set<string>();
    const segments = httpPath.split("/");
    for (const segment of segments) {
        if (segment.startsWith("{") && segment.endsWith("}")) {
            const inner = segment.slice(1, -1);
            // Strip optional regex suffix (e.g., {param:.+})
            const paramName = inner.split(":")[0];
            args.add(paramName);
        }
    }
    return args;
}

export function validateHttpPath(httpPath: string, context: string): void {
    // Must be absolute
    if (!httpPath.startsWith("/")) {
        throw new Error(`Conjure paths must be absolute, i.e., start with '/': "${httpPath}" in ${context}`);
    }

    // Must not end with / (unless it's just "/")
    if (httpPath.length > 1 && httpPath.endsWith("/")) {
        throw new Error(`Conjure paths must not end with a '/': "${httpPath}" in ${context}`);
    }

    const segments = httpPath.split("/").slice(1); // skip empty string before leading /

    for (const segment of segments) {
        if (segment.length === 0) {
            throw new Error(
                `Conjure paths must not contain empty segments (consecutive '/'): "${httpPath}" in ${context}`,
            );
        }

        if (segment.startsWith("{") && segment.endsWith("}")) {
            // Parameter segment — validate the parameter name
            const inner = segment.slice(1, -1);
            const colonIdx = inner.indexOf(":");
            const paramName = colonIdx >= 0 ? inner.substring(0, colonIdx) : inner;
            const regexPart = colonIdx >= 0 ? inner.substring(colonIdx + 1) : null;

            if (!PARAM_PATTERN.test(paramName)) {
                throw new Error(
                    `Segment ${segment} of path ${httpPath} has invalid parameter name "${paramName}". ` +
                        `Parameter names must match ${PARAM_PATTERN} in ${context}`,
                );
            }

            // Validate regex if present: only .+ or .* allowed
            if (regexPart !== null && regexPart !== ".+" && regexPart !== ".*") {
                throw new Error(
                    `Path parameter ${paramName} in path ${httpPath} specifies unsupported ` +
                        `regular expression "${regexPart}". Only ".+" and ".*" are supported in ${context}`,
                );
            }
        } else if (!SEGMENT_PATTERN.test(segment)) {
            throw new Error(
                `Segment "${segment}" of path ${httpPath} did not match required segment pattern ` +
                    `${SEGMENT_PATTERN} in ${context}`,
            );
        }
    }

    // Validate template variables are unique
    const templateVars = new Set<string>();
    for (const segment of segments) {
        if (segment.startsWith("{") && segment.endsWith("}")) {
            const inner = segment.slice(1, -1);
            const paramName = inner.split(":")[0];
            if (templateVars.has(paramName)) {
                throw new Error(
                    `Path parameter "${paramName}" appears more than once in path ${httpPath} in ${context}`,
                );
            }
            templateVars.add(paramName);
        }
    }

    // Validate .* regex only in last segment
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment.startsWith("{") && segment.endsWith("}")) {
            const inner = segment.slice(1, -1);
            const colonIdx = inner.indexOf(":");
            if (colonIdx >= 0) {
                const regexPart = inner.substring(colonIdx + 1);
                if (regexPart === ".*" && i !== segments.length - 1) {
                    const paramName = inner.substring(0, colonIdx);
                    throw new Error(
                        `Path parameter "${paramName}" in path ${httpPath} specifies regular expression ".*", ` +
                            `but this is only permitted in the last segment in ${context}`,
                    );
                }
            }
        }
    }
}
