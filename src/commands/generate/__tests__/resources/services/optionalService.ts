import { IHttpApiBridge } from "conjure-client";

/** Constant references that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export function OptionalService_foo(bridge: IHttpApiBridge['call'], header: string, name?: string | null): Promise<void> {
    return bridge(...[
        "OptionalService",
        "foo",
        "GET",
        "/foo",
        ,
        {
            "Header": header,
        },
        {
            "Query": name,
        },
    ] as Parameters<typeof bridge>);
}

export interface IOptionalService {
    foo(header: string, name?: string | null): Promise<void>;
}

export class OptionalService {
    constructor(private bridge: IHttpApiBridge) {
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
