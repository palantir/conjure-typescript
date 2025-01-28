import { IHttpApiBridge } from "conjure-client";

/** Constant references that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export function PrimitiveService_getPrimitive(bridge: IHttpApiBridge['call']): Promise<number> {
    return bridge(...[
        "PrimitiveService",
        "getPrimitive",
        "GET",
        "/getPrimitive",
    ] as Parameters<typeof bridge>);
}

export interface IPrimitiveService {
    getPrimitive(): Promise<number>;
}

export class PrimitiveService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public getPrimitive(): Promise<number> {
        return this.bridge.call<number>(
            "PrimitiveService",
            "getPrimitive",
            "GET",
            "/getPrimitive",
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined
        );
    }
}
