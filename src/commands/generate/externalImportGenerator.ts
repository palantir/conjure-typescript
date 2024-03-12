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

import { IExternalReference, IType, PrimitiveType } from "conjure-api";
import { SimpleAst } from "./simpleAst";
import { ITypeGenerationFlags } from "./typeGenerationFlags";

const FLAVOR_TYPE_FIELD = "__conjure_external_import_type";
const FLAVOR_PACKAGE_FIELD = "__conjure_external_import_package";

export async function generateExternalReference(
    definition: IExternalReference,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
) {
    if (!typeGenerationFlags.flavorizedExternalImports) {
        return;
    }

    if (!IType.isPrimitive(definition.fallback)) {
        throw new Error("fallback is always a primitive.");
    }

    const fieldType = primitiveBaseType(definition.fallback.primitive);
    const sourceFile = simpleAst.createExternalImportSourceFile(definition);
    sourceFile.addTypeAlias({
        isExported: true,
        name: definition.externalReference.package.replace(/\./g, "_") + "_" + definition.externalReference.name,
        type: [
            `${fieldType} & {`,
            `\t${FLAVOR_TYPE_FIELD}?: "${definition.externalReference.name}",`,
            `\t${FLAVOR_PACKAGE_FIELD}?: "${definition.externalReference.package}",`,
            "}",
        ].join("\n"),
    });
    sourceFile.formatText();
    return sourceFile.save();
}

function primitiveBaseType(obj: PrimitiveType) {
    switch (obj) {
        case PrimitiveType.STRING:
        case PrimitiveType.DATETIME:
        case PrimitiveType.RID:
        case PrimitiveType.BEARERTOKEN:
        case PrimitiveType.UUID:
        case PrimitiveType.BINARY:
            return "string";
        case PrimitiveType.DOUBLE:
            return '(number | "NaN")';
        case PrimitiveType.INTEGER:
        case PrimitiveType.SAFELONG:
            return "number";
        case PrimitiveType.ANY:
            return "any";
        case PrimitiveType.BOOLEAN:
            return "boolean";
        default:
            throw new Error("unknown primitive type");
    }
}
