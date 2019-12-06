import { IHttpApiBridge, MediaType } from "conjure-client";

export interface IOptionalService {
    foo(header: string, name?: string | null): Promise<void>;
}

export class OptionalService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(header: string, name?: string | null): Promise<void> {
        return this.bridge.callEndpoint<void>({
            binaryAsStream: true,
            data: undefined,
            endpointName: "foo",
            endpointPath: "/foo",
            headers: {
                "Header": header,
            },
            method: "GET",
            pathArguments: [
            ],
            queryArguments: {
                "Query": name,
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }
}
