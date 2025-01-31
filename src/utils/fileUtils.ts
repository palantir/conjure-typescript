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

import { ITypeName } from "conjure-api";
import * as path from "path";

export const directoryNameForType = (typeName: ITypeName): string => {
    const components = typeName.package.split(".");

    if (components.length < 3) {
        throw new Error("Package should have at least 3 segments");
    }

    return components.slice(2).join("-");
};

export const relativePath = (fromType: ITypeName, toType: ITypeName): string => {
    return path.relative(directoryNameForType(fromType), directoryNameForType(toType));
};

/* Pascal cases the subpackage name */
export const moduleNameForType = (typeName: ITypeName) => {
    const directoryName = directoryNameForType(typeName);
    const camelCaseModule = directoryName.replace(/-(\w)/g, x => x[1].toUpperCase());
    return camelCaseModule.charAt(0).toUpperCase() + camelCaseModule.slice(1);
};
