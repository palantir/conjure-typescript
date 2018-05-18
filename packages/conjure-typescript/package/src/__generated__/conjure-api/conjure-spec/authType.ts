import { ICookieAuthType } from "./cookieAuthType";
import { IHeaderAuthType } from "./headerAuthType";

export interface IAuthType_Header {
    'header': IHeaderAuthType;
    'type': "header";
}

export interface IAuthType_Cookie {
    'cookie': ICookieAuthType;
    'type': "cookie";
}

function isHeader(obj: IAuthType): obj is IAuthType_Header {
    return (obj.type === "header");
}

function header(obj: IHeaderAuthType): IAuthType_Header {
    return {
        header: obj,
        type: "header",
    };
}

function isCookie(obj: IAuthType): obj is IAuthType_Cookie {
    return (obj.type === "cookie");
}

function cookie(obj: ICookieAuthType): IAuthType_Cookie {
    return {
        cookie: obj,
        type: "cookie",
    };
}

export type IAuthType = IAuthType_Header | IAuthType_Cookie;

export interface IAuthTypeVisitor<T> {
    'header': (obj: IHeaderAuthType) => T;
    'cookie': (obj: ICookieAuthType) => T;
    'unknown': (obj: IAuthType) => T;
}

function visit<T>(obj: IAuthType, visitor: IAuthTypeVisitor<T>): T {
    if (isHeader(obj)) {
        return visitor.header(obj.header);
    }
    if (isCookie(obj)) {
        return visitor.cookie(obj.cookie);
    }
    return visitor.unknown(obj);
}

export const IAuthType = {
    isHeader: isHeader,
    header: header,
    isCookie: isCookie,
    cookie: cookie,
    visit: visit
};
