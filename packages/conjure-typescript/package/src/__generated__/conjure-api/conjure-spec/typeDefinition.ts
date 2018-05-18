import { IAliasDefinition } from "./aliasDefinition";
import { IEnumDefinition } from "./enumDefinition";
import { IObjectDefinition } from "./objectDefinition";
import { IUnionDefinition } from "./unionDefinition";

export interface ITypeDefinition_Alias {
    'alias': IAliasDefinition;
    'type': "alias";
}

export interface ITypeDefinition_Enum {
    'enum': IEnumDefinition;
    'type': "enum";
}

export interface ITypeDefinition_Object {
    'object': IObjectDefinition;
    'type': "object";
}

export interface ITypeDefinition_Union {
    'union': IUnionDefinition;
    'type': "union";
}

function isAlias(obj: ITypeDefinition): obj is ITypeDefinition_Alias {
    return (obj.type === "alias");
}

function alias(obj: IAliasDefinition): ITypeDefinition_Alias {
    return {
        alias: obj,
        type: "alias",
    };
}

function isEnum(obj: ITypeDefinition): obj is ITypeDefinition_Enum {
    return (obj.type === "enum");
}

function enum_(obj: IEnumDefinition): ITypeDefinition_Enum {
    return {
        enum: obj,
        type: "enum",
    };
}

function isObject(obj: ITypeDefinition): obj is ITypeDefinition_Object {
    return (obj.type === "object");
}

function object(obj: IObjectDefinition): ITypeDefinition_Object {
    return {
        object: obj,
        type: "object",
    };
}

function isUnion(obj: ITypeDefinition): obj is ITypeDefinition_Union {
    return (obj.type === "union");
}

function union(obj: IUnionDefinition): ITypeDefinition_Union {
    return {
        union: obj,
        type: "union",
    };
}

export type ITypeDefinition = ITypeDefinition_Alias | ITypeDefinition_Enum | ITypeDefinition_Object | ITypeDefinition_Union;

export interface ITypeDefinitionVisitor<T> {
    'alias': (obj: IAliasDefinition) => T;
    'enum': (obj: IEnumDefinition) => T;
    'object': (obj: IObjectDefinition) => T;
    'union': (obj: IUnionDefinition) => T;
    'unknown': (obj: ITypeDefinition) => T;
}

function visit<T>(obj: ITypeDefinition, visitor: ITypeDefinitionVisitor<T>): T {
    if (isAlias(obj)) {
        return visitor.alias(obj.alias);
    }
    if (isEnum(obj)) {
        return visitor.enum(obj.enum);
    }
    if (isObject(obj)) {
        return visitor.object(obj.object);
    }
    if (isUnion(obj)) {
        return visitor.union(obj.union);
    }
    return visitor.unknown(obj);
}

export const ITypeDefinition = {
    isAlias: isAlias,
    alias: alias,
    isEnum: isEnum,
    enum_: enum_,
    isObject: isObject,
    object: object,
    isUnion: isUnion,
    union: union,
    visit: visit
};
