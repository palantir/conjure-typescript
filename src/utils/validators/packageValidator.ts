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

// Direct port of conjure-core PackageValidator.java + PackagePattern.java
// Pattern: ^([a-z][a-z0-9]+(\.[a-z][a-z0-9]*)*)?$

const PACKAGE_PATTERN = /^([a-z][a-z0-9]+(\.[a-z][a-z0-9]*)*)?$/;

export function validatePackageName(name: string, context: string): void {
    if (!PACKAGE_PATTERN.test(name)) {
        throw new Error(`Conjure package names must match pattern ${PACKAGE_PATTERN}: "${name}" in ${context}`);
    }
}
