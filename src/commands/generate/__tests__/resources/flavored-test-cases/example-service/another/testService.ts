import { IBackingFileSystem } from "../product-datasets/backingFileSystem";
import { IDataset } from "../product-datasets/dataset";
import { IAliasedString } from "../product/aliasedString";
import { ICreateDatasetRequest } from "../product/createDatasetRequest";
import { IHttpApiBridge } from "conjure-client";

/** Constant references that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

/**
 * Returns a mapping from file system id to backing file system configuration.
 *
 */
export function TestService_getFileSystems(bridge: IHttpApiBridge['call']): Promise<{ [key: string]: IBackingFileSystem }> {
    return bridge(...[
        "TestService",
        "getFileSystems",
        "GET",
        "/catalog/fileSystems",
    ] as Parameters<typeof bridge>);
}

export function TestService_createDataset(bridge: IHttpApiBridge['call'], request: ICreateDatasetRequest, testHeaderArg: string): Promise<IDataset> {
    return bridge(...[
        "TestService",
        "createDataset",
        "POST",
        "/catalog/datasets",
        request,
        {
            "Test-Header": testHeaderArg,
        },
    ] as Parameters<typeof bridge>);
}

export function TestService_getDataset(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<IDataset | null> {
    return bridge(...[
        "TestService",
        "getDataset",
        "GET",
        "/catalog/datasets/{datasetRid}",
        ,
        ,
        ,
        [
            datasetRid,
        ],
    ] as Parameters<typeof bridge>);
}

export function TestService_getRawData(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<ReadableStream<Uint8Array>> {
    return bridge(...[
        "TestService",
        "getRawData",
        "GET",
        "/catalog/datasets/{datasetRid}/raw",
        ,
        ,
        ,
        [
            datasetRid,
        ],
        ,
        "application/octet-stream"
    ] as Parameters<typeof bridge>);
}

export function TestService_getAliasedRawData(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<ReadableStream<Uint8Array>> {
    return bridge(...[
        "TestService",
        "getAliasedRawData",
        "GET",
        "/catalog/datasets/{datasetRid}/raw-aliased",
        ,
        ,
        ,
        [
            datasetRid,
        ],
        ,
        "application/octet-stream"
    ] as Parameters<typeof bridge>);
}

export function TestService_maybeGetRawData(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<ReadableStream<Uint8Array> | null> {
    return bridge(...[
        "TestService",
        "maybeGetRawData",
        "GET",
        "/catalog/datasets/{datasetRid}/raw-maybe",
        ,
        ,
        ,
        [
            datasetRid,
        ],
        ,
        "application/octet-stream"
    ] as Parameters<typeof bridge>);
}

export function TestService_getAliasedString(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<IAliasedString> {
    return bridge(...[
        "TestService",
        "getAliasedString",
        "GET",
        "/catalog/datasets/{datasetRid}/string-aliased",
        ,
        ,
        ,
        [
            datasetRid,
        ],
    ] as Parameters<typeof bridge>);
}

export function TestService_uploadRawData(bridge: IHttpApiBridge['call'], input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void> {
    return bridge(...[
        "TestService",
        "uploadRawData",
        "POST",
        "/catalog/datasets/upload-raw",
        input,
        ,
        ,
        ,
        "application/octet-stream",
    ] as Parameters<typeof bridge>);
}

export function TestService_uploadAliasedRawData(bridge: IHttpApiBridge['call'], input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void> {
    return bridge(...[
        "TestService",
        "uploadAliasedRawData",
        "POST",
        "/catalog/datasets/upload-raw-aliased",
        input,
        ,
        ,
        ,
        "application/octet-stream",
    ] as Parameters<typeof bridge>);
}

export function TestService_getBranches(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<Array<string>> {
    return bridge(...[
        "TestService",
        "getBranches",
        "GET",
        "/catalog/datasets/{datasetRid}/branches",
        ,
        ,
        ,
        [
            datasetRid,
        ],
    ] as Parameters<typeof bridge>);
}

/**
 * Gets all branches of this dataset.
 *
 * @deprecated use getBranches instead
 */
export function TestService_getBranchesDeprecated(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<Array<string>> {
    return bridge(...[
        "TestService",
        "getBranchesDeprecated",
        "GET",
        "/catalog/datasets/{datasetRid}/branchesDeprecated",
        ,
        ,
        ,
        [
            datasetRid,
        ],
    ] as Parameters<typeof bridge>);
}

export function TestService_resolveBranch(bridge: IHttpApiBridge['call'], datasetRid: string, branch: string): Promise<string | null> {
    return bridge(...[
        "TestService",
        "resolveBranch",
        "GET",
        "/catalog/datasets/{datasetRid}/branches/{branch:.+}/resolve",
        ,
        ,
        ,
        [
            datasetRid,

            branch,
        ],
    ] as Parameters<typeof bridge>);
}

export function TestService_testParam(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<string | null> {
    return bridge(...[
        "TestService",
        "testParam",
        "GET",
        "/catalog/datasets/{datasetRid}/testParam",
        ,
        ,
        ,
        [
            datasetRid,
        ],
    ] as Parameters<typeof bridge>);
}

export function TestService_testQueryParams(bridge: IHttpApiBridge['call'], query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<number> {
    return bridge(...[
        "TestService",
        "testQueryParams",
        "POST",
        "/catalog/test-query-params",
        query,
        ,
        {
            "different": something,

            "implicit": implicit,

            "setEnd": setEnd,

            "optionalMiddle": optionalMiddle,

            "optionalEnd": optionalEnd,
        },
    ] as Parameters<typeof bridge>);
}

export function TestService_testNoResponseQueryParams(bridge: IHttpApiBridge['call'], query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<void> {
    return bridge(...[
        "TestService",
        "testNoResponseQueryParams",
        "POST",
        "/catalog/test-no-response-query-params",
        query,
        ,
        {
            "different": something,

            "implicit": implicit,

            "setEnd": setEnd,

            "optionalMiddle": optionalMiddle,

            "optionalEnd": optionalEnd,
        },
    ] as Parameters<typeof bridge>);
}

export function TestService_testBoolean(bridge: IHttpApiBridge['call']): Promise<boolean> {
    return bridge(...[
        "TestService",
        "testBoolean",
        "GET",
        "/catalog/boolean",
    ] as Parameters<typeof bridge>);
}

export function TestService_testDouble(bridge: IHttpApiBridge['call']): Promise<number | "NaN"> {
    return bridge(...[
        "TestService",
        "testDouble",
        "GET",
        "/catalog/double",
    ] as Parameters<typeof bridge>);
}

export function TestService_testInteger(bridge: IHttpApiBridge['call']): Promise<number> {
    return bridge(...[
        "TestService",
        "testInteger",
        "GET",
        "/catalog/integer",
    ] as Parameters<typeof bridge>);
}

export function TestService_testPostOptional(bridge: IHttpApiBridge['call'], maybeString?: string | null): Promise<string | null> {
    return bridge(...[
        "TestService",
        "testPostOptional",
        "POST",
        "/catalog/optional",
        maybeString,
    ] as Parameters<typeof bridge>);
}

export function TestService_testOptionalIntegerAndDouble(bridge: IHttpApiBridge['call'], maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<void> {
    return bridge(...[
        "TestService",
        "testOptionalIntegerAndDouble",
        "GET",
        "/catalog/optional-integer-double",
        ,
        ,
        {
            "maybeInteger": maybeInteger,

            "maybeDouble": maybeDouble,
        },
    ] as Parameters<typeof bridge>);
}

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
    getRawData(datasetRid: string): Promise<ReadableStream<Uint8Array>>;
    getAliasedRawData(datasetRid: string): Promise<ReadableStream<Uint8Array>>;
    maybeGetRawData(datasetRid: string): Promise<ReadableStream<Uint8Array> | null>;
    getAliasedString(datasetRid: string): Promise<IAliasedString>;
    uploadRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void>;
    uploadAliasedRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void>;
    getBranches(datasetRid: string): Promise<Array<string>>;
    /**
     * Gets all branches of this dataset.
     *
     * @deprecated use getBranches instead
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

    /**
     * Returns a mapping from file system id to backing file system configuration.
     *
     */
    public getFileSystems(): Promise<{ [key: string]: IBackingFileSystem }> {
        return this.bridge.call<{ [key: string]: IBackingFileSystem }>(
            "TestService",
            "getFileSystems",
            "GET",
            "/catalog/fileSystems",
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined
        );
    }

    public createDataset(request: ICreateDatasetRequest, testHeaderArg: string): Promise<IDataset> {
        return this.bridge.call<IDataset>(
            "TestService",
            "createDataset",
            "POST",
            "/catalog/datasets",
            request,
            {
                "Test-Header": testHeaderArg,
            },
            __undefined,
            __undefined,
            __undefined,
            __undefined
        );
    }

    public getDataset(datasetRid: string): Promise<IDataset | null> {
        return this.bridge.call<IDataset | null>(
            "TestService",
            "getDataset",
            "GET",
            "/catalog/datasets/{datasetRid}",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            __undefined
        );
    }

    public getRawData(datasetRid: string): Promise<ReadableStream<Uint8Array>> {
        return this.bridge.call<ReadableStream<Uint8Array>>(
            "TestService",
            "getRawData",
            "GET",
            "/catalog/datasets/{datasetRid}/raw",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            "application/octet-stream"
        );
    }

    public getAliasedRawData(datasetRid: string): Promise<ReadableStream<Uint8Array>> {
        return this.bridge.call<ReadableStream<Uint8Array>>(
            "TestService",
            "getAliasedRawData",
            "GET",
            "/catalog/datasets/{datasetRid}/raw-aliased",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            "application/octet-stream"
        );
    }

    public maybeGetRawData(datasetRid: string): Promise<ReadableStream<Uint8Array> | null> {
        return this.bridge.call<ReadableStream<Uint8Array> | null>(
            "TestService",
            "maybeGetRawData",
            "GET",
            "/catalog/datasets/{datasetRid}/raw-maybe",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            "application/octet-stream"
        );
    }

    public getAliasedString(datasetRid: string): Promise<IAliasedString> {
        return this.bridge.call<IAliasedString>(
            "TestService",
            "getAliasedString",
            "GET",
            "/catalog/datasets/{datasetRid}/string-aliased",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            __undefined
        );
    }

    public uploadRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void> {
        return this.bridge.call<void>(
            "TestService",
            "uploadRawData",
            "POST",
            "/catalog/datasets/upload-raw",
            input,
            __undefined,
            __undefined,
            __undefined,
            "application/octet-stream",
            __undefined
        );
    }

    public uploadAliasedRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void> {
        return this.bridge.call<void>(
            "TestService",
            "uploadAliasedRawData",
            "POST",
            "/catalog/datasets/upload-raw-aliased",
            input,
            __undefined,
            __undefined,
            __undefined,
            "application/octet-stream",
            __undefined
        );
    }

    public getBranches(datasetRid: string): Promise<Array<string>> {
        return this.bridge.call<Array<string>>(
            "TestService",
            "getBranches",
            "GET",
            "/catalog/datasets/{datasetRid}/branches",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            __undefined
        );
    }

    /**
     * Gets all branches of this dataset.
     *
     * @deprecated use getBranches instead
     */
    public getBranchesDeprecated(datasetRid: string): Promise<Array<string>> {
        return this.bridge.call<Array<string>>(
            "TestService",
            "getBranchesDeprecated",
            "GET",
            "/catalog/datasets/{datasetRid}/branchesDeprecated",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            __undefined
        );
    }

    public resolveBranch(datasetRid: string, branch: string): Promise<string | null> {
        return this.bridge.call<string | null>(
            "TestService",
            "resolveBranch",
            "GET",
            "/catalog/datasets/{datasetRid}/branches/{branch:.+}/resolve",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,

                branch,
            ],
            __undefined,
            __undefined
        );
    }

    public testParam(datasetRid: string): Promise<string | null> {
        return this.bridge.call<string | null>(
            "TestService",
            "testParam",
            "GET",
            "/catalog/datasets/{datasetRid}/testParam",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
            __undefined,
            __undefined
        );
    }

    public testQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<number> {
        return this.bridge.call<number>(
            "TestService",
            "testQueryParams",
            "POST",
            "/catalog/test-query-params",
            query,
            __undefined,
            {
                "different": something,

                "implicit": implicit,

                "setEnd": setEnd,

                "optionalMiddle": optionalMiddle,

                "optionalEnd": optionalEnd,
            },
            __undefined,
            __undefined,
            __undefined
        );
    }

    public testNoResponseQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<void> {
        return this.bridge.call<void>(
            "TestService",
            "testNoResponseQueryParams",
            "POST",
            "/catalog/test-no-response-query-params",
            query,
            __undefined,
            {
                "different": something,

                "implicit": implicit,

                "setEnd": setEnd,

                "optionalMiddle": optionalMiddle,

                "optionalEnd": optionalEnd,
            },
            __undefined,
            __undefined,
            __undefined
        );
    }

    public testBoolean(): Promise<boolean> {
        return this.bridge.call<boolean>(
            "TestService",
            "testBoolean",
            "GET",
            "/catalog/boolean",
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined
        );
    }

    public testDouble(): Promise<number | "NaN"> {
        return this.bridge.call<number | "NaN">(
            "TestService",
            "testDouble",
            "GET",
            "/catalog/double",
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined
        );
    }

    public testInteger(): Promise<number> {
        return this.bridge.call<number>(
            "TestService",
            "testInteger",
            "GET",
            "/catalog/integer",
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined
        );
    }

    public testPostOptional(maybeString?: string | null): Promise<string | null> {
        return this.bridge.call<string | null>(
            "TestService",
            "testPostOptional",
            "POST",
            "/catalog/optional",
            maybeString,
            __undefined,
            __undefined,
            __undefined,
            __undefined,
            __undefined
        );
    }

    public testOptionalIntegerAndDouble(maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<void> {
        return this.bridge.call<void>(
            "TestService",
            "testOptionalIntegerAndDouble",
            "GET",
            "/catalog/optional-integer-double",
            __undefined,
            __undefined,
            {
                "maybeInteger": maybeInteger,

                "maybeDouble": maybeDouble,
            },
            __undefined,
            __undefined,
            __undefined
        );
    }
}
