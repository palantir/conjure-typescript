import type { IConjureResult, IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export interface IPrimitiveServiceWithErrors {
    getPrimitive(): Promise<IConjureResult<number, never>>;
}

export class PrimitiveServiceWithErrors implements IPrimitiveServiceWithErrors {
    private bridge: IHttpApiBridge;

    constructor(bridge: IHttpApiBridge) {
        this.bridge = bridge;
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
            .then(result => ({ status: "success" as const, result }))
            .catch((error: any) => ({ status: "failure", error }));
    }
}
