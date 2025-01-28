import { IBackingFileSystem } from "../product-datasets/backingFileSystem";
import { IDataset } from "../product-datasets/dataset";
import { IAliasedString } from "../product/aliasedString";
import { ICreateDatasetRequest } from "../product/createDatasetRequest";
import { IHttpApiBridge } from "conjure-client";

/** Constant references that we expect to get minified and therefore reduce total code size */
const __emptyString: string = "";

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
