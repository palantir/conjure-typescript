import { IBackingFileSystem } from "../product-datasets/backingFileSystem";
import { IDataset } from "../product-datasets/dataset";
import { ICreateDatasetRequest } from "../product/createDatasetRequest";
import { IHttpApiBridge, MediaType } from "conjure-client";

/**
 * A Markdown description of the service.
 * 
 */
export interface ITestService {
    /**
     * Returns a mapping from file system id to backing file system configuration.
     * 
     */
    getFileSystems(): Promise<{ [key: string]: IBackingFileSystem }>;
    createDataset(request: ICreateDatasetRequest, testHeaderArg: string): Promise<IDataset>;
    getDataset(datasetRid: string): Promise<IDataset | null>;
    getRawData(datasetRid: string): Promise<any>;
    getAliasedRawData(datasetRid: string): Promise<any>;
    maybeGetRawData(datasetRid: string): Promise<any | null>;
    getAliasedString(datasetRid: string): Promise<string>;
    uploadRawData(input: any): Promise<void>;
    uploadAliasedRawData(input: any): Promise<void>;
    getBranches(datasetRid: string): Promise<Array<string>>;
    /**
     * Gets all branches of this dataset.
     * 
     */
    getBranchesDeprecated(datasetRid: string): Promise<Array<string>>;
    resolveBranch(datasetRid: string, branch: string): Promise<string | null>;
    testParam(datasetRid: string): Promise<string | null>;
    testQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<number>;
    testNoResponseQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<void>;
    testBoolean(): Promise<boolean>;
    testDouble(): Promise<number | "NaN">;
    testInteger(): Promise<number>;
    testPostOptional(maybeString?: string | null): Promise<string | null>;
    testOptionalIntegerAndDouble(maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<void>;
}

export class TestService {
    constructor(private bridge: IHttpApiBridge) {
    }

    public getFileSystems(): Promise<{ [key: string]: IBackingFileSystem }> {
        return this.bridge.callEndpoint<{ [key: string]: IBackingFileSystem }>({
            data: undefined,
            endpointName: "getFileSystems",
            endpointPath: "/catalog/fileSystems",
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

    public createDataset(request: ICreateDatasetRequest, testHeaderArg: string): Promise<IDataset> {
        return this.bridge.callEndpoint<IDataset>({
            data: request,
            endpointName: "createDataset",
            endpointPath: "/catalog/datasets",
            headers: {
                "Test-Header": testHeaderArg,
            },
            method: "POST",
            pathArguments: [
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public getDataset(datasetRid: string): Promise<IDataset | null> {
        return this.bridge.callEndpoint<IDataset | null>({
            data: undefined,
            endpointName: "getDataset",
            endpointPath: "/catalog/datasets/{datasetRid}",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public getRawData(datasetRid: string): Promise<any> {
        return this.bridge.callEndpoint<any>({
            data: undefined,
            endpointName: "getRawData",
            endpointPath: "/catalog/datasets/{datasetRid}/raw",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_OCTET_STREAM,
        });
    }

    public getAliasedRawData(datasetRid: string): Promise<any> {
        return this.bridge.callEndpoint<any>({
            data: undefined,
            endpointName: "getAliasedRawData",
            endpointPath: "/catalog/datasets/{datasetRid}/raw-aliased",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public maybeGetRawData(datasetRid: string): Promise<any | null> {
        return this.bridge.callEndpoint<any | null>({
            data: undefined,
            endpointName: "maybeGetRawData",
            endpointPath: "/catalog/datasets/{datasetRid}/raw-maybe",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public getAliasedString(datasetRid: string): Promise<string> {
        return this.bridge.callEndpoint<string>({
            data: undefined,
            endpointName: "getAliasedString",
            endpointPath: "/catalog/datasets/{datasetRid}/string-aliased",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public uploadRawData(input: any): Promise<void> {
        return this.bridge.callEndpoint<void>({
            data: input,
            endpointName: "uploadRawData",
            endpointPath: "/catalog/datasets/upload-raw",
            headers: {
            },
            method: "POST",
            pathArguments: [
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_OCTET_STREAM,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public uploadAliasedRawData(input: any): Promise<void> {
        return this.bridge.callEndpoint<void>({
            data: input,
            endpointName: "uploadAliasedRawData",
            endpointPath: "/catalog/datasets/upload-raw-aliased",
            headers: {
            },
            method: "POST",
            pathArguments: [
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public getBranches(datasetRid: string): Promise<Array<string>> {
        return this.bridge.callEndpoint<Array<string>>({
            data: undefined,
            endpointName: "getBranches",
            endpointPath: "/catalog/datasets/{datasetRid}/branches",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public getBranchesDeprecated(datasetRid: string): Promise<Array<string>> {
        return this.bridge.callEndpoint<Array<string>>({
            data: undefined,
            endpointName: "getBranchesDeprecated",
            endpointPath: "/catalog/datasets/{datasetRid}/branchesDeprecated",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public resolveBranch(datasetRid: string, branch: string): Promise<string | null> {
        return this.bridge.callEndpoint<string | null>({
            data: undefined,
            endpointName: "resolveBranch",
            endpointPath: "/catalog/datasets/{datasetRid}/branches/{branch:.+}/resolve",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,

                branch,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public testParam(datasetRid: string): Promise<string | null> {
        return this.bridge.callEndpoint<string | null>({
            data: undefined,
            endpointName: "testParam",
            endpointPath: "/catalog/datasets/{datasetRid}/testParam",
            headers: {
            },
            method: "GET",
            pathArguments: [
                datasetRid,
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public testQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<number> {
        return this.bridge.callEndpoint<number>({
            data: query,
            endpointName: "testQueryParams",
            endpointPath: "/catalog/test-query-params",
            headers: {
            },
            method: "POST",
            pathArguments: [
            ],
            queryArguments: {
                "different": something,

                "implicit": implicit,

                "setEnd": setEnd,

                "optionalMiddle": optionalMiddle,

                "optionalEnd": optionalEnd,
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public testNoResponseQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<void> {
        return this.bridge.callEndpoint<void>({
            data: query,
            endpointName: "testNoResponseQueryParams",
            endpointPath: "/catalog/test-no-response-query-params",
            headers: {
            },
            method: "POST",
            pathArguments: [
            ],
            queryArguments: {
                "different": something,

                "implicit": implicit,

                "setEnd": setEnd,

                "optionalMiddle": optionalMiddle,

                "optionalEnd": optionalEnd,
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public testBoolean(): Promise<boolean> {
        return this.bridge.callEndpoint<boolean>({
            data: undefined,
            endpointName: "testBoolean",
            endpointPath: "/catalog/boolean",
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

    public testDouble(): Promise<number | "NaN"> {
        return this.bridge.callEndpoint<number | "NaN">({
            data: undefined,
            endpointName: "testDouble",
            endpointPath: "/catalog/double",
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

    public testInteger(): Promise<number> {
        return this.bridge.callEndpoint<number>({
            data: undefined,
            endpointName: "testInteger",
            endpointPath: "/catalog/integer",
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

    public testPostOptional(maybeString?: string | null): Promise<string | null> {
        return this.bridge.callEndpoint<string | null>({
            data: maybeString,
            endpointName: "testPostOptional",
            endpointPath: "/catalog/optional",
            headers: {
            },
            method: "POST",
            pathArguments: [
            ],
            queryArguments: {
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }

    public testOptionalIntegerAndDouble(maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<void> {
        return this.bridge.callEndpoint<void>({
            data: undefined,
            endpointName: "testOptionalIntegerAndDouble",
            endpointPath: "/catalog/optional-integer-double",
            headers: {
            },
            method: "GET",
            pathArguments: [
            ],
            queryArguments: {
                "maybeInteger": maybeInteger,

                "maybeDouble": maybeDouble,
            },
            requestMediaType: MediaType.APPLICATION_JSON,
            responseMediaType: MediaType.APPLICATION_JSON,
        });
    }
}
