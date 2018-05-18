import { IHttpApiBridge, MediaType } from "conjure-client";

export interface IServiceWithSafelongHeader {
    foo(investigation: number): Promise<void>;
}

export class ServiceWithSafelongHeader {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(investigation: number): Promise<void> {
        return this.bridge.callEndpoint<void>({
            data: undefined,
            endpointName: "foo",
            endpointPath: "/foo",
            headers: {
                "X-Investigation": investigation.toString(),
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
