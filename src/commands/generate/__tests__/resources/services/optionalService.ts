import type { IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export interface IOptionalService {
    foo(header: string, name?: string | null): Promise<void>;
}

export class OptionalService implements IOptionalService {
    private bridge: IHttpApiBridge;

    constructor(bridge: IHttpApiBridge) {
        this.bridge = bridge;
    }

    public foo(header: string, name?: string | null): Promise<void> {
        return this.bridge.call<void>(
            "OptionalService",
            "foo",
            "GET",
            "/foo",
            __undefined,
            {
                "Header": header,
            },
            {
                "Query": name,
            },
            __undefined,
            __undefined,
            __undefined
        );
    }
}
