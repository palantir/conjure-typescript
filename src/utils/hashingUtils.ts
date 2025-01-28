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

const FIELD_SEPARATOR = "|-|";

export const createHashableTypeName = (typeName: ITypeName): string => {
    return `${typeName.package}${FIELD_SEPARATOR}${typeName.name}`;
};

export const disassembleHashableTypeName = (hash: string): ITypeName => {
    const [packageName, name] = hash.split(FIELD_SEPARATOR);
    return { package: packageName, name };
};

// /**
//  * @license
//  * Copyright 2025 Palantir Technologies, Inc.
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */

// import {
//     IListType,
//     IMapType,
//     IOptionalType,
//     ISetType,
//     IType,
//     ITypeDefinition,
//     ITypeName,
//     PrimitiveType,
// } from "conjure-api";
// import { ITypeGenerationFlags } from "../types/typeGenerationFlags";
// import { createHashableTypeName, isFlavorizable } from "../commands/generate/utils";

// export const resolveConjureType = (
//     conjureType: IType,
//     baseTypeName: ITypeName,
//     knownConjureTypes: Map<string, ITypeDefinition>,
//     typeGenerationFlags: ITypeGenerationFlags,
//     isParameterType: boolean,
//     isTopLevelBinary: boolean,
// ): string => {
//     switch (conjureType.type) {
//         case "primitive":
//             return resolvePrimitiveType(conjureType.primitive, isParameterType, isTopLevelBinary);
//         case "list":
//             return resolveListOrSetType(
//                 conjureType.list,
//                 baseTypeName,
//                 knownConjureTypes,
//                 typeGenerationFlags,
//                 isParameterType,
//             );
//         case "set":
//             return resolveListOrSetType(
//                 conjureType.set,
//                 baseTypeName,
//                 knownConjureTypes,
//                 typeGenerationFlags,
//                 isParameterType,
//             );
//         case "map":
//             return resolveMapType(
//                 conjureType.map,
//                 baseTypeName,
//                 knownConjureTypes,
//                 typeGenerationFlags,
//                 isParameterType,
//             );
//         case "optional":
//             return resolveOptionalType(
//                 conjureType.optional,
//                 baseTypeName,
//                 knownConjureTypes,
//                 typeGenerationFlags,
//                 isParameterType,
//                 isTopLevelBinary,
//             );
//         case "reference":
//             return resolveReferenceType(
//                 conjureType.reference,
//                 baseTypeName,
//                 knownConjureTypes,
//                 typeGenerationFlags,
//                 isParameterType,
//                 isTopLevelBinary,
//             );
//         case "external":
//             return resolveConjureType(
//                 conjureType.external.fallback,
//                 baseTypeName,
//                 knownConjureTypes,
//                 typeGenerationFlags,
//                 isParameterType,
//                 false,
//             );
//     }
// };

// export const resolvePrimitiveType = (
//     primitiveType: PrimitiveType,
//     isParameterType: boolean,
//     isTopLevelBinary: boolean,
// ): string => {
//     switch (primitiveType) {
//         case PrimitiveType.STRING:
//             return "string";
//         case PrimitiveType.DATETIME:
//             return "string";
//         case PrimitiveType.RID:
//             return "string";
//         case PrimitiveType.BEARERTOKEN:
//             return "string";
//         case PrimitiveType.DOUBLE:
//             return 'number | "NaN"';
//         case PrimitiveType.INTEGER:
//             return "number";
//         case PrimitiveType.SAFELONG:
//             return "number";
//         case PrimitiveType.BINARY:
//             if (isParameterType) {
//                 return isTopLevelBinary ? "ReadableStream<Uint8Array> | BufferSource | Blob | string" : "string";
//             }
//             return isTopLevelBinary ? "ReadableStream<Uint8Array>" : "string";
//         case PrimitiveType.ANY:
//             return "any";
//         case PrimitiveType.BOOLEAN:
//             return "boolean";
//         case PrimitiveType.UUID:
//             return "string";
//         default:
//             throw new Error("Unknown primitive type");
//     }
// };

// export const resolveListOrSetType = (
//     listType: IListType | ISetType,
//     baseTypeName: ITypeName,
//     knownConjureTypes: Map<string, ITypeDefinition>,
//     typeGenerationFlags: ITypeGenerationFlags,
//     isParameterType: boolean,
// ): string => {
//     const itemType = resolveConjureType(
//         listType.itemType,
//         baseTypeName,
//         knownConjureTypes,
//         typeGenerationFlags,
//         isParameterType,
//         false,
//     );
//     return typeGenerationFlags.readonlyInterfaces ? `ReadonlyArray<${itemType}>` : `Array<${itemType}>`;
// };

// export const resolveOptionalType = (
//     optionalType: IOptionalType,
//     baseTypeName: ITypeName,
//     knownConjureTypes: Map<string, ITypeDefinition>,
//     typeGenerationFlags: ITypeGenerationFlags,
//     isParameterType: boolean,
//     isTopLevelBinary: boolean,
// ): string => {
//     return (
//         resolveConjureType(
//             optionalType.itemType,
//             baseTypeName,
//             knownConjureTypes,
//             typeGenerationFlags,
//             isParameterType,
//             isTopLevelBinary,
//         ) + " | null"
//     );
// };

// export const resolveMapType = (
//     mapType: IMapType,
//     baseType: ITypeName,
//     knownConjureTypes: Map<string, ITypeDefinition>,
//     typeGenerationFlags: ITypeGenerationFlags,
//     isParameterType: boolean,
// ): string => {
//     const resolvedValueType = resolveConjureType(
//         mapType.valueType,
//         baseType,
//         knownConjureTypes,
//         typeGenerationFlags,
//         isParameterType,
//         false,
//     );
//     const maybeReadonly = typeGenerationFlags.readonlyInterfaces ? "readonly " : "";

//     if (IType.isReference(mapType.keyType)) {
//         const keyTypeDefinition = knownConjureTypes.get(createHashableTypeName(mapType.keyType.reference));

//         if (keyTypeDefinition == null) {
//             throw new Error(
//                 `unknown reference type. package: '${mapType.keyType.reference.package}', name: '${mapType.keyType.reference.name}'`,
//             );
//         }

//         const resolvedKeyType = resolveReferenceType(
//             mapType.keyType.reference,
//             baseType,
//             knownConjureTypes,
//             typeGenerationFlags,
//             isParameterType,
//             false,
//         );
//         const maybeOptional = ITypeDefinition.isEnum(keyTypeDefinition) ? "?" : "";
//         return `{ ${maybeReadonly}[key: ${resolvedKeyType}]${maybeOptional}: ${resolvedValueType} }`;
//     }

//     return `{ ${maybeReadonly}[key: string]: ${resolvedValueType} }`;
// };

// export const resolveReferenceType = (
//     referencedType: ITypeName,
//     baseType: ITypeName,
//     knownConjureTypes: Map<string, ITypeDefinition>,
//     typeGenerationFlags: ITypeGenerationFlags,
//     isParameterType: boolean,
//     isTopLevelBinary: boolean,
// ): string => {
//     const referencedTypeDefinition = knownConjureTypes.get(createHashableTypeName(referencedType));

//     if (referencedTypeDefinition == null) {
//         throw new Error(`Unknown reference type. package: '${referencedType.package}', name: '${referencedType.name}'`);
//     }

//     const typeName = ITypeDefinition.isEnum(referencedTypeDefinition) ? referencedType.name : `I${referencedType.name}`;

//     if (
//         ITypeDefinition.isAlias(referencedTypeDefinition) &&
//         !isFlavorizable(referencedTypeDefinition.alias.alias, typeGenerationFlags.flavorizedAliases)
//     ) {
//         return resolveConjureType(
//             referencedTypeDefinition.alias.alias,
//             baseType,
//             knownConjureTypes,
//             typeGenerationFlags,
//             isParameterType,
//             isTopLevelBinary,
//         );
//     } else if (ITypeDefinition.isUnion(referencedTypeDefinition)) {
//         // If the type reference is recursive, use a direct reference rather than a namespaced one
//         if (referencedType.name === baseType.name && referencedType.package === baseType.package) {
//             return typeName;
//         }
//         return `${typeName}.${typeName}`;
//     }

//     return typeName;
// };
