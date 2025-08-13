import type { IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

export interface IOutOfOrderPathService {
    foo(param1: string, param2: string): Promise<void>;
}

export class OutOfOrderPathService implements IOutOfOrderPathService {
    private bridge: IHttpApiBridge;

    constructor(bridge: IHttpApiBridge) {
        this.bridge = bridge;
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
