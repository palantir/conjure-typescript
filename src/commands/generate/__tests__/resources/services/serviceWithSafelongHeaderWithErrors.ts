import type { IConjureFailure, IConjureResult, IConjureSuccess, IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export interface IServiceWithSafelongHeaderWithErrors {
    foo(investigation: number): Promise<IConjureResult<void, never>>;
}

export class ServiceWithSafelongHeaderWithErrors implements IServiceWithSafelongHeaderWithErrors {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(investigation: number): Promise<IConjureResult<void, never>> {
        return this.bridge
            .call<void>(
                "ServiceWithSafelongHeader",
                "foo",
                "GET",
                "/foo",
                __undefined,
                {
                    "X-Investigation": investigation.toString(),
                },
                __undefined,
                __undefined,
                __undefined,
                __undefined
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<void>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }
}
