import { IHttpApiBridge, MediaType } from "conjure-client";

export interface IPrimitiveService {
    foo(): Promise<number>;
}

export class PrimitiveService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(): Promise<number> {
        return this.bridge.callEndpoint<number>({
            data: undefined,
            endpointName: "foo",
            endpointPath: "/foo",
            headers: {
            },
            method: "GET",
            pathArguments: [
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }
}
