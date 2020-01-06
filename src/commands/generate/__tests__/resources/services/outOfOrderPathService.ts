import { IHttpApiBridge, MediaType } from "conjure-client";

export interface IOutOfOrderPathService {
    foo(param1: string, param2: string): Promise<void>;
}

export class OutOfOrderPathService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(param1: string, param2: string): Promise<void> {
        return this.bridge.callEndpoint<void>({
            binaryAsStream: true,
            data: undefined,
            endpointName: "foo",
            endpointPath: "/{param2}/{param1}",
            headers: {
            },
            method: "GET",
            pathArguments: [
                param2,

                param1,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }
}
