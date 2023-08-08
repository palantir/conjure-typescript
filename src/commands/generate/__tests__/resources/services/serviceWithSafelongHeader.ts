import { IHttpApiBridge } from "conjure-client";

/** Constant references that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export function ServiceWithSafelongHeader_foo(bridge: IHttpApiBridge['call'], investigation: number): Promise<void> {
    return bridge(...[
        "ServiceWithSafelongHeader",
        "foo",
        "GET",
        "/foo",
        ,
        {
            "X-Investigation": investigation.toString(),
        },
    ] as Parameters<typeof bridge>);
}

export interface IServiceWithSafelongHeader {
    foo(investigation: number): Promise<void>;
}

export class ServiceWithSafelongHeader {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(investigation: number): Promise<void> {
        return this.bridge.call<void>(
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
        );
    }
}
