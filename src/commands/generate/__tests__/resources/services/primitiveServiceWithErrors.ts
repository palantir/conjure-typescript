import type { ConjureFailure, ConjureResult, ConjureSuccess, IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export interface IPrimitiveServiceWithErrors {
    getPrimitive(): Promise<ConjureResult<number, never>>;
}

export class PrimitiveServiceWithErrors implements IPrimitiveServiceWithErrors {
    constructor(private bridge: IHttpApiBridge) {
    }

    public getPrimitive(): Promise<ConjureResult<number, never>> {
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
        )
            .then(result => ({ status: "success", result }) as ConjureSuccess<number>)
            .catch(error => ({ status: "failure", error }) as ConjureFailure<never>);
    }
}
