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
    ITypeDefinition,
    ITypeName,
    ITypeVisitor,
    PrimitiveType,
} from "conjure-api";
import { ITypeGenerationFlags } from "./typeGenerationFlags";
import { createHashableTypeName, isFlavorizable } from "./utils";

export class TsReturnTypeVisitor implements ITypeVisitor<string> {
    constructor(
        protected knownTypes: Map<string, ITypeDefinition>,
        protected currType: ITypeName,
        protected isTopLevelBinary: boolean,
        protected typeGenerationFlags: ITypeGenerationFlags,
    ) {}

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
                return this.isTopLevelBinary ? "ReadableStream<Uint8Array>" : "string";
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
    public map = (obj: IMapType): string => {
        const valueTsType = IType.visit(obj.valueType, this.nestedVisitor());
        const maybeReadonly = this.typeGenerationFlags.readonlyInterfaces ? "readonly " : "";
        if (IType.isReference(obj.keyType)) {
            const keyTypeDefinition = this.knownTypes.get(createHashableTypeName(obj.keyType.reference));
            if (keyTypeDefinition != null) {
                if (ITypeDefinition.isEnum(keyTypeDefinition)) {
                    return `{ ${maybeReadonly}[key in ${obj.keyType.reference.name}]?: ${valueTsType} }`;
                } else if (
                    ITypeDefinition.isAlias(keyTypeDefinition) &&
                    isFlavorizable(keyTypeDefinition.alias.alias, this.typeGenerationFlags.flavorizedAliases)
                ) {
                    return `{ ${maybeReadonly}[key: I${obj.keyType.reference.name}]: ${valueTsType} }`;
                }
            }
        }
        return `{ ${maybeReadonly}[key: string]: ${valueTsType} }`;
    };
    public list = (obj: IListType): string => {
        const itemType = IType.visit(obj.itemType, this.nestedVisitor());
        return this.getArrayType(itemType);
    };
    public set = (obj: ISetType): string => {
        const itemType = IType.visit(obj.itemType, this.nestedVisitor());
        return this.getArrayType(itemType);
    };
    public optional = (obj: IOptionalType): string => {
        return IType.visit(obj.itemType, this) + " | null";
    };
    public reference = (obj: ITypeName): string => {
        const typeDefinition = this.knownTypes.get(createHashableTypeName(obj));
        const withIPrefix = "I" + obj.name;
        if (typeDefinition == null) {
            throw new Error(`unknown reference type. package: '${obj.package}', name: '${obj.name}'`);
        } else if (
            ITypeDefinition.isAlias(typeDefinition) &&
            !isFlavorizable(typeDefinition.alias.alias, this.typeGenerationFlags.flavorizedAliases)
        ) {
            return IType.visit(typeDefinition.alias.alias, this);
        } else if (ITypeDefinition.isEnum(typeDefinition)) {
            return obj.name;
        } else if (ITypeDefinition.isUnion(typeDefinition)) {
            // If the type reference is recursive, use a direct reference rather than a namespaced one
            if (obj.name === this.currType.name && obj.package === this.currType.package) {
                return withIPrefix;
            }
            return `${withIPrefix}.${withIPrefix}`;
        }
        return withIPrefix;
    };
    public external = (obj: IExternalReference): string => {
        return IType.visit(obj.fallback, this.nestedVisitor());
    };
    public unknown = (_: IType): string => {
        throw new Error("unknown");
    };

    protected nestedVisitor = (): ITypeVisitor<string> => {
        return new TsReturnTypeVisitor(this.knownTypes, this.currType, false, this.typeGenerationFlags);
    };
    protected getArrayType(itemType: string) {
        return this.typeGenerationFlags.readonlyInterfaces ? `ReadonlyArray<${itemType}>` : `Array<${itemType}>`;
    }
}
