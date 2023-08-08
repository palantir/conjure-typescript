import { IHttpApiBridge } from "conjure-client";

/** Constant references that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export function OutOfOrderPathService_foo(bridge: IHttpApiBridge['call'], param1: string, param2: string): Promise<void> {
    return bridge(...[
        "OutOfOrderPathService",
        "foo",
        "GET",
        "/{param2}/{param1}",
        ,
        ,
        ,
        [
            param2,

            param1,
        ],
    ] as Parameters<typeof bridge>);
}

export interface IOutOfOrderPathService {
    foo(param1: string, param2: string): Promise<void>;
}

export class OutOfOrderPathService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(param1: string, param2: string): Promise<void> {
        return this.bridge.call<void>(
            "OutOfOrderPathService",
            "foo",
            "GET",
            "/{param2}/{param1}",
            __undefined,
            __undefined,
            __undefined,
            [
                param2,

                param1,
            ],
            __undefined,
            __undefined
        );
    }
}
