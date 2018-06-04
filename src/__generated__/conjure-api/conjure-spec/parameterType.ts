import { IBodyParameterType } from "./bodyParameterType";
import { IHeaderParameterType } from "./headerParameterType";
import { IPathParameterType } from "./pathParameterType";
import { IQueryParameterType } from "./queryParameterType";

export interface IParameterType_Body {
    'body': IBodyParameterType;
    'type': "body";
}

export interface IParameterType_Header {
    'header': IHeaderParameterType;
    'type': "header";
}

export interface IParameterType_Path {
    'path': IPathParameterType;
    'type': "path";
}

export interface IParameterType_Query {
    'query': IQueryParameterType;
    'type': "query";
}

function isBody(obj: IParameterType): obj is IParameterType_Body {
    return (obj.type === "body");
}

function body(obj: IBodyParameterType): IParameterType_Body {
    return {
        body: obj,
        type: "body",
    };
}

function isHeader(obj: IParameterType): obj is IParameterType_Header {
    return (obj.type === "header");
}

function header(obj: IHeaderParameterType): IParameterType_Header {
    return {
        header: obj,
        type: "header",
    };
}

function isPath(obj: IParameterType): obj is IParameterType_Path {
    return (obj.type === "path");
}

function path(obj: IPathParameterType): IParameterType_Path {
    return {
        path: obj,
        type: "path",
    };
}

function isQuery(obj: IParameterType): obj is IParameterType_Query {
    return (obj.type === "query");
}

function query(obj: IQueryParameterType): IParameterType_Query {
    return {
        query: obj,
        type: "query",
    };
}

export type IParameterType = IParameterType_Body | IParameterType_Header | IParameterType_Path | IParameterType_Query;

export interface IParameterTypeVisitor<T> {
    'body': (obj: IBodyParameterType) => T;
    'header': (obj: IHeaderParameterType) => T;
    'path': (obj: IPathParameterType) => T;
    'query': (obj: IQueryParameterType) => T;
    'unknown': (obj: IParameterType) => T;
}

function visit<T>(obj: IParameterType, visitor: IParameterTypeVisitor<T>): T {
    if (isBody(obj)) {
        return visitor.body(obj.body);
    }
    if (isHeader(obj)) {
        return visitor.header(obj.header);
    }
    if (isPath(obj)) {
        return visitor.path(obj.path);
    }
    if (isQuery(obj)) {
        return visitor.query(obj.query);
    }
    return visitor.unknown(obj);
}

export const IParameterType = {
    isBody: isBody,
    body: body,
    isHeader: isHeader,
    header: header,
    isPath: isPath,
    path: path,
    isQuery: isQuery,
    query: query,
    visit: visit
};
