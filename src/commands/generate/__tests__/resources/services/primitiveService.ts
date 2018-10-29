import { IHttpApiBridge, MediaType } from "conjure-client";

export interface IPrimitiveService {
    getPrimitive(): Promise<number>;
}

export class PrimitiveService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public getPrimitive(): Promise<number> {
        return this.bridge.callEndpoint<number>({
            data: undefined,
            endpointName: "getPrimitive",
            endpointPath: "/getPrimitive",
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
