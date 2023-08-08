import { IBackingFileSystem } from "../product-datasets/backingFileSystem";
import { IDataset } from "../product-datasets/dataset";
import { IAliasedString } from "../product/aliasedString";
import { ICreateDatasetRequest } from "../product/createDatasetRequest";
import { IHttpApiBridge } from "conjure-client";

/** Constant references that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined, __emptyString: string = "";

/**
 * Returns a mapping from file system id to backing file system configuration.
 *
 */
export function TestService_getFileSystems(bridge: IHttpApiBridge['call']): Promise<{ [key: string]: IBackingFileSystem }> {
    return bridge(...[__emptyString, __emptyString,
        "GET",
        "/catalog/fileSystems",
    ] as Parameters<typeof bridge>);
}

export function TestService_createDataset(bridge: IHttpApiBridge['call'], request: ICreateDatasetRequest, testHeaderArg: string): Promise<IDataset> {
    return bridge(...[__emptyString, __emptyString,
        "POST",
        "/catalog/datasets",
        request,
        {
            "Test-Header": testHeaderArg,
        },
    ] as Parameters<typeof bridge>);
}

export function TestService_getDataset(bridge: IHttpApiBridge['call'], datasetRid: string): Promise<IDataset | null> {
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
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
    return bridge(...[__emptyString, __emptyString,
        "GET",
        "/catalog/boolean",
    ] as Parameters<typeof bridge>);
}

export function TestService_testDouble(bridge: IHttpApiBridge['call']): Promise<number | "NaN"> {
    return bridge(...[__emptyString, __emptyString,
        "GET",
        "/catalog/double",
    ] as Parameters<typeof bridge>);
}

export function TestService_testInteger(bridge: IHttpApiBridge['call']): Promise<number> {
    return bridge(...[__emptyString, __emptyString,
        "GET",
        "/catalog/integer",
    ] as Parameters<typeof bridge>);
}

export function TestService_testPostOptional(bridge: IHttpApiBridge['call'], maybeString?: string | null): Promise<string | null> {
    return bridge(...[__emptyString, __emptyString,
        "POST",
        "/catalog/optional",
        maybeString,
    ] as Parameters<typeof bridge>);
}

export function TestService_testOptionalIntegerAndDouble(bridge: IHttpApiBridge['call'], maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<void> {
    return bridge(...[__emptyString, __emptyString,
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
        return this.bridge.call<{ [key: string]: IBackingFileSystem }>(__emptyString, __emptyString,
            "GET",
            "/catalog/fileSystems",
        );
    }

    public createDataset(request: ICreateDatasetRequest, testHeaderArg: string): Promise<IDataset> {
        return this.bridge.call<IDataset>(__emptyString, __emptyString,
            "POST",
            "/catalog/datasets",
            request,
            {
                "Test-Header": testHeaderArg,
            },
        );
    }

    public getDataset(datasetRid: string): Promise<IDataset | null> {
        return this.bridge.call<IDataset | null>(__emptyString, __emptyString,
            "GET",
            "/catalog/datasets/{datasetRid}",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
        );
    }

    public getRawData(datasetRid: string): Promise<ReadableStream<Uint8Array>> {
        return this.bridge.call<ReadableStream<Uint8Array>>(__emptyString, __emptyString,
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
        return this.bridge.call<ReadableStream<Uint8Array>>(__emptyString, __emptyString,
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
        return this.bridge.call<ReadableStream<Uint8Array> | null>(__emptyString, __emptyString,
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
        return this.bridge.call<IAliasedString>(__emptyString, __emptyString,
            "GET",
            "/catalog/datasets/{datasetRid}/string-aliased",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
        );
    }

    public uploadRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void> {
        return this.bridge.call<void>(__emptyString, __emptyString,
            "POST",
            "/catalog/datasets/upload-raw",
            input,
            __undefined,
            __undefined,
            __undefined,
            "application/octet-stream",
        );
    }

    public uploadAliasedRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<void> {
        return this.bridge.call<void>(__emptyString, __emptyString,
            "POST",
            "/catalog/datasets/upload-raw-aliased",
            input,
            __undefined,
            __undefined,
            __undefined,
            "application/octet-stream",
        );
    }

    public getBranches(datasetRid: string): Promise<Array<string>> {
        return this.bridge.call<Array<string>>(__emptyString, __emptyString,
            "GET",
            "/catalog/datasets/{datasetRid}/branches",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
        );
    }

    /**
     * Gets all branches of this dataset.
     *
     * @deprecated use getBranches instead
     */
    public getBranchesDeprecated(datasetRid: string): Promise<Array<string>> {
        return this.bridge.call<Array<string>>(__emptyString, __emptyString,
            "GET",
            "/catalog/datasets/{datasetRid}/branchesDeprecated",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
        );
    }

    public resolveBranch(datasetRid: string, branch: string): Promise<string | null> {
        return this.bridge.call<string | null>(__emptyString, __emptyString,
            "GET",
            "/catalog/datasets/{datasetRid}/branches/{branch:.+}/resolve",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,

                branch,
            ],
        );
    }

    public testParam(datasetRid: string): Promise<string | null> {
        return this.bridge.call<string | null>(__emptyString, __emptyString,
            "GET",
            "/catalog/datasets/{datasetRid}/testParam",
            __undefined,
            __undefined,
            __undefined,
            [
                datasetRid,
            ],
        );
    }

    public testQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<number> {
        return this.bridge.call<number>(__emptyString, __emptyString,
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
        );
    }

    public testNoResponseQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<void> {
        return this.bridge.call<void>(__emptyString, __emptyString,
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
        );
    }

    public testBoolean(): Promise<boolean> {
        return this.bridge.call<boolean>(__emptyString, __emptyString,
            "GET",
            "/catalog/boolean",
        );
    }

    public testDouble(): Promise<number | "NaN"> {
        return this.bridge.call<number | "NaN">(__emptyString, __emptyString,
            "GET",
            "/catalog/double",
        );
    }

    public testInteger(): Promise<number> {
        return this.bridge.call<number>(__emptyString, __emptyString,
            "GET",
            "/catalog/integer",
        );
    }

    public testPostOptional(maybeString?: string | null): Promise<string | null> {
        return this.bridge.call<string | null>(__emptyString, __emptyString,
            "POST",
            "/catalog/optional",
            maybeString,
        );
    }

    public testOptionalIntegerAndDouble(maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<void> {
        return this.bridge.call<void>(__emptyString, __emptyString,
            "GET",
            "/catalog/optional-integer-double",
            __undefined,
            __undefined,
            {
                "maybeInteger": maybeInteger,

                "maybeDouble": maybeDouble,
            },
        );
    }
}
