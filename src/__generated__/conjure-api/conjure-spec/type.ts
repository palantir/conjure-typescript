import { IExternalReference } from "./externalReference";
import { IListType } from "./listType";
import { IMapType } from "./mapType";
import { IOptionalType } from "./optionalType";
import { PrimitiveType } from "./primitiveType";
import { ISetType } from "./setType";
import { ITypeName } from "./typeName";

export interface IType_Primitive {
    'primitive': PrimitiveType;
    'type': "primitive";
}

export interface IType_Optional {
    'optional': IOptionalType;
    'type': "optional";
}

export interface IType_List {
    'list': IListType;
    'type': "list";
}

export interface IType_Set {
    'set': ISetType;
    'type': "set";
}

export interface IType_Map {
    'map': IMapType;
    'type': "map";
}

/**
 * The name and package of a custom Conjure type. The custom type must be defined in the "types" section.
 */
export interface IType_Reference {
    'reference': ITypeName;
    'type': "reference";
}

export interface IType_External {
    'external': IExternalReference;
    'type': "external";
}

function isPrimitive(obj: IType): obj is IType_Primitive {
    return (obj.type === "primitive");
}

function primitive(obj: PrimitiveType): IType_Primitive {
    return {
        primitive: obj,
        type: "primitive",
    };
}

function isOptional(obj: IType): obj is IType_Optional {
    return (obj.type === "optional");
}

function optional(obj: IOptionalType): IType_Optional {
    return {
        optional: obj,
        type: "optional",
    };
}

function isList(obj: IType): obj is IType_List {
    return (obj.type === "list");
}

function list(obj: IListType): IType_List {
    return {
        list: obj,
        type: "list",
    };
}

function isSet(obj: IType): obj is IType_Set {
    return (obj.type === "set");
}

function set(obj: ISetType): IType_Set {
    return {
        set: obj,
        type: "set",
    };
}

function isMap(obj: IType): obj is IType_Map {
    return (obj.type === "map");
}

function map(obj: IMapType): IType_Map {
    return {
        map: obj,
        type: "map",
    };
}

function isReference(obj: IType): obj is IType_Reference {
    return (obj.type === "reference");
}

function reference(obj: ITypeName): IType_Reference {
    return {
        reference: obj,
        type: "reference",
    };
}

function isExternal(obj: IType): obj is IType_External {
    return (obj.type === "external");
}

function external(obj: IExternalReference): IType_External {
    return {
        external: obj,
        type: "external",
    };
}

export type IType = IType_Primitive | IType_Optional | IType_List | IType_Set | IType_Map | IType_Reference | IType_External;

export interface ITypeVisitor<T> {
    'primitive': (obj: PrimitiveType) => T;
    'optional': (obj: IOptionalType) => T;
    'list': (obj: IListType) => T;
    'set': (obj: ISetType) => T;
    'map': (obj: IMapType) => T;
    'reference': (obj: ITypeName) => T;
    'external': (obj: IExternalReference) => T;
    'unknown': (obj: IType) => T;
}

function visit<T>(obj: IType, visitor: ITypeVisitor<T>): T {
    if (isPrimitive(obj)) {
        return visitor.primitive(obj.primitive);
    }
    if (isOptional(obj)) {
        return visitor.optional(obj.optional);
    }
    if (isList(obj)) {
        return visitor.list(obj.list);
    }
    if (isSet(obj)) {
        return visitor.set(obj.set);
    }
    if (isMap(obj)) {
        return visitor.map(obj.map);
    }
    if (isReference(obj)) {
        return visitor.reference(obj.reference);
    }
    if (isExternal(obj)) {
        return visitor.external(obj.external);
    }
    return visitor.unknown(obj);
}

export const IType = {
    isPrimitive: isPrimitive,
    primitive: primitive,
    isOptional: isOptional,
    optional: optional,
    isList: isList,
    list: list,
    isSet: isSet,
    set: set,
    isMap: isMap,
    map: map,
    isReference: isReference,
    reference: reference,
    isExternal: isExternal,
    external: external,
    visit: visit
};
