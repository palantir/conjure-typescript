import { IHttpApiBridge, MediaType } from "conjure-client";

/**
 * Constant reference to `undefined` that we expect to get minified and therefore reduce total code size
 */
const __undefined = undefined;

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
