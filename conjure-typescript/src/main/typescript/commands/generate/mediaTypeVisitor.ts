/**
 * @license
 * Copyright 2019 Palantir Technologies, Inc.
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
import {
    IExternalReference,
    IListType,
    IMapType,
    IOptionalType,
    ISetType,
    IType,
    ITypeDefinition,
    ITypeName,
    ITypeVisitor,
    PrimitiveType,
} from "conjure-api";
import { MediaType } from "conjure-client";
import { createHashableTypeName } from "./utils";

export class MediaTypeVisitor implements ITypeVisitor<MediaType> {
    constructor(private knownTypes: Map<string, ITypeDefinition>) {}

    public external = (_: IExternalReference): MediaType => {
        return MediaType.APPLICATION_JSON;
    };
    public list = (_: IListType): MediaType => {
        return MediaType.APPLICATION_JSON;
    };
    public map = (_: IMapType): MediaType => {
        return MediaType.APPLICATION_JSON;
    };
    public optional = (obj: IOptionalType): MediaType => {
        return IType.visit(obj.itemType, this);
    };
    public primitive = (obj: PrimitiveType): MediaType => {
        switch (obj) {
            case PrimitiveType.STRING:
            case PrimitiveType.DATETIME:
            case PrimitiveType.RID:
            case PrimitiveType.BEARERTOKEN:
            case PrimitiveType.DOUBLE:
            case PrimitiveType.INTEGER:
            case PrimitiveType.SAFELONG:
            case PrimitiveType.ANY:
            case PrimitiveType.BOOLEAN:
            case PrimitiveType.UUID:
                return MediaType.APPLICATION_JSON;
            case PrimitiveType.BINARY:
                return MediaType.APPLICATION_OCTET_STREAM;
            default:
                throw new Error("unknown primitive type");
        }
    };
    public reference = (obj: ITypeName): MediaType => {
        const typeDefinition = this.knownTypes.get(createHashableTypeName(obj));
        if (typeDefinition == null) {
            throw new Error(`unknown reference type. package: '${obj.package}', name: '${obj.name}'`);
        } else if (ITypeDefinition.isAlias(typeDefinition)) {
            return IType.visit(typeDefinition.alias.alias, this);
        }
        return MediaType.APPLICATION_JSON;
    };
    public set = (_: ISetType): MediaType => {
        return MediaType.APPLICATION_JSON;
    };
    public unknown = (_: IType): MediaType => {
        return MediaType.APPLICATION_JSON;
    };
}
