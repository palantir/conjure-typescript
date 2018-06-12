import { IHttpApiBridge, MediaType } from "conjure-client";

export interface IParamTypeService {
    foo(body: string, header: string, path: string, query: string): Promise<void>;
}

export class ParamTypeService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public foo(body: string, header: string, path: string, query: string): Promise<void> {
        return this.bridge.callEndpoint<void>({
            data: body,
            endpointName: "foo",
            endpointPath: "/foo/{path}",
            headers: {
                "Header": header,
            },
            method: "GET",
            pathArguments: [
                path,
            ],
            queryArguments: {
                "Query": query,
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }
}
