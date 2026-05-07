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

import { ITypeDefinition, ITypeName } from "conjure-api";

const FIELD_SEPARATOR = "|-|";

export const createHashableTypeName = (typeName: ITypeName): string => {
    return `${typeName.package}${FIELD_SEPARATOR}${typeName.name}`;
};

export const disassembleHashableTypeName = (hash: string): ITypeName => {
    const [packageName, name] = hash.split(FIELD_SEPARATOR);
    return { package: packageName, name };
};

export const typeNameOf = (definition: ITypeDefinition): ITypeName => {
    switch (definition.type) {
        case "alias":
            return definition.alias.typeName;
        case "enum":
            return definition.enum.typeName;
        case "object":
            return definition.object.typeName;
        case "union":
            return definition.union.typeName;
    }
};
