import { IHttpApiBridge, MediaType } from "conjure-client";

export interface IEteBinaryService {
    postBinary(body: any): Promise<any>;
    getOptionalBinaryPresent(): Promise<any | null>;
    getOptionalBinaryEmpty(): Promise<any | null>;
    /**
     * Throws an exception after partially writing a binary response.
     */
    getBinaryFailure(numBytes: number): Promise<any>;
}

export class EteBinaryService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public postBinary(body: any): Promise<any> {
        return this.bridge.callEndpoint<any>({
            data: body,
            endpointName: "postBinary",
            endpointPath: "/binary",
            headers: {
            },
            method: "POST",
            pathArguments: [
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_OCTET_STREAM,
            responseMediaType: MediaType.APPLICATION_OCTET_STREAM,
        });
    }

    public getOptionalBinaryPresent(): Promise<any | null> {
        return this.bridge.callEndpoint<any | null>({
            data: undefined,
            endpointName: "getOptionalBinaryPresent",
            endpointPath: "/binary/optional/present",
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

    public getOptionalBinaryEmpty(): Promise<any | null> {
        return this.bridge.callEndpoint<any | null>({
            data: undefined,
            endpointName: "getOptionalBinaryEmpty",
            endpointPath: "/binary/optional/empty",
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

    public getBinaryFailure(numBytes: number): Promise<any> {
        return this.bridge.callEndpoint<any>({
            data: undefined,
            endpointName: "getBinaryFailure",
            endpointPath: "/binary/failure",
            headers: {
            },
            method: "GET",
            pathArguments: [
            ],
            queryArguments: {
                "numBytes": numBytes,
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_OCTET_STREAM,
        });
    }
}
