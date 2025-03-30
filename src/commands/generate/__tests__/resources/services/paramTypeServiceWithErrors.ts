import type { ConjureFailure, ConjureResult, ConjureSuccess, IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export interface IParamTypeServiceWithErrors {
    foo(body: string, header: string, path: string, query: string): Promise<ConjureResult<void, never>>;
}

export class ParamTypeServiceWithErrors implements IParamTypeServiceWithErrors {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(body: string, header: string, path: string, query: string): Promise<ConjureResult<void, never>> {
        return this.bridge.call<void>(
            "ParamTypeService",
            "foo",
            "GET",
            "/foo/{path}",
            body,
            {
                "Header": header,
            },
            {
                "Query": query,
            },
            [
                path,
            ],
            __undefined,
            __undefined
        )
            .then(result => ({ status: "success", result }) as ConjureSuccess<void>)
            .catch(error => ({ status: "failure", error }) as ConjureFailure<never>);
    }
}
