import type { IConjureFailure, IConjureResult, IConjureSuccess, IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export interface IPrimitiveServiceWithErrors {
    getPrimitive(): Promise<IConjureResult<number, never>>;
}

export class PrimitiveServiceWithErrors implements IPrimitiveServiceWithErrors {
    constructor(private bridge: IHttpApiBridge) {
    }

    public getPrimitive(): Promise<IConjureResult<number, never>> {
        return this.bridge
            .call<number>(
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
            .then(result => ({ status: "success", result }) as IConjureSuccess<number>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }
}
