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

import {
    IExternalReference,
    IListType,
    IMapType,
    IOptionalType,
    ISetType,
    IType,
    ITypeName,
    ITypeVisitor,
    PrimitiveType,
} from "conjure-api";

export class StringConversionTypeVisitor implements ITypeVisitor<string> {
    private static NO_CONVERSION = "";

    public primitive = (obj: PrimitiveType) => {
        switch (obj) {
            case PrimitiveType.SAFELONG:
                return ".toString()";
            default:
                return StringConversionTypeVisitor.NO_CONVERSION;
        }
    };
    public map = (_: IMapType): string => {
        return StringConversionTypeVisitor.NO_CONVERSION;
    };
    public list = (_: IListType): string => {
        return StringConversionTypeVisitor.NO_CONVERSION;
    };
    public set = (_: ISetType): string => {
        return StringConversionTypeVisitor.NO_CONVERSION;
    };
    public optional = (_: IOptionalType): string => {
        return StringConversionTypeVisitor.NO_CONVERSION;
    };
    public reference = (_: ITypeName): string => {
        return StringConversionTypeVisitor.NO_CONVERSION;
    };
    public external = (_: IExternalReference): string => {
        return StringConversionTypeVisitor.NO_CONVERSION;
    };
    public unknown = (_: IType): string => {
        return StringConversionTypeVisitor.NO_CONVERSION;
    };
}
