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

import { IListType, ISetType, IType, ITypeDefinition, ITypeName, ITypeVisitor, PrimitiveType } from "conjure-api";
import { TsReturnTypeVisitor } from "./tsReturnTypeVisitor";
import { ITypeGenerationFlags } from "./typeGenerationFlags";

export class TsArgumentTypeVisitor extends TsReturnTypeVisitor {
    constructor(
        knownTypes: Map<string, ITypeDefinition>,
        currType: ITypeName,
        isTopLevelBinary: boolean,
        typeGenerationFlags: ITypeGenerationFlags,
    ) {
        super(knownTypes, currType, isTopLevelBinary, typeGenerationFlags);
    }

    public primitive = (obj: PrimitiveType): string => {
        switch (obj) {
            case PrimitiveType.STRING:
            case PrimitiveType.DATETIME:
            case PrimitiveType.RID:
            case PrimitiveType.BEARERTOKEN:
                return "string";
            case PrimitiveType.DOUBLE:
                return 'number | "NaN"';
            case PrimitiveType.INTEGER:
            case PrimitiveType.SAFELONG:
                return "number";
            case PrimitiveType.BINARY:
                return this.isTopLevelBinary ? "ReadableStream<Uint8Array> | BufferSource | Blob" : "string";
            case PrimitiveType.ANY:
                return "any";
            case PrimitiveType.BOOLEAN:
                return "boolean";
            case PrimitiveType.UUID:
                return "string";
            default:
                throw new Error("unknown primitive type");
        }
    };

    public list = (obj: IListType): string => {
        const itemType = IType.visit(obj.itemType, this.nestedVisitor());
        return `ReadonlyArray<${itemType}>`;
    };

    public set = (obj: ISetType): string => {
        const itemType = IType.visit(obj.itemType, this.nestedVisitor());
        return `ReadonlyArray<${itemType}>`;
    };

    protected nestedVisitor = (): ITypeVisitor<string> => {
        return new TsArgumentTypeVisitor(this.knownTypes, this.currType, false, this.typeGenerationFlags);
    };
}
