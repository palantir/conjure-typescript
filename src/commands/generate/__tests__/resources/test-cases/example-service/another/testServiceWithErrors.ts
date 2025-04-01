import { IBackingFileSystem } from "../product-datasets/backingFileSystem";
import { IDataset } from "../product-datasets/dataset";
import { ICreateDatasetRequest } from "../product/createDatasetRequest";
import type { IConjureFailure, IConjureResult, IConjureSuccess, IHttpApiBridge } from "conjure-client";

/** Constant reference to `undefined` that we expect to get minified and therefore reduce total code size */
const __undefined: undefined = undefined;

/**
 * A Markdown description of the service.
 *
 */
export interface ITestServiceWithErrors {
    /**
     * Returns a mapping from file system id to backing file system configuration.
     *
     */
    getFileSystems(): Promise<IConjureResult<{ [key: string]: IBackingFileSystem }, never>>;
    createDataset(request: ICreateDatasetRequest, testHeaderArg: string): Promise<IConjureResult<IDataset, never>>;
    getDataset(datasetRid: string): Promise<IConjureResult<IDataset | null, never>>;
    getRawData(datasetRid: string): Promise<IConjureResult<ReadableStream<Uint8Array>, never>>;
    getAliasedRawData(datasetRid: string): Promise<IConjureResult<ReadableStream<Uint8Array>, never>>;
    maybeGetRawData(datasetRid: string): Promise<IConjureResult<ReadableStream<Uint8Array> | null, never>>;
    getAliasedString(datasetRid: string): Promise<IConjureResult<string, never>>;
    uploadRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<IConjureResult<void, never>>;
    uploadAliasedRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<IConjureResult<void, never>>;
    getBranches(datasetRid: string): Promise<IConjureResult<Array<string>, never>>;
    /**
     * Gets all branches of this dataset.
     *
     * @deprecated use getBranches instead
     */
    getBranchesDeprecated(datasetRid: string): Promise<IConjureResult<Array<string>, never>>;
    resolveBranch(datasetRid: string, branch: string): Promise<IConjureResult<string | null, never>>;
    testParam(datasetRid: string): Promise<IConjureResult<string | null, never>>;
    testQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<IConjureResult<number, never>>;
    testNoResponseQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<IConjureResult<void, never>>;
    testBoolean(): Promise<IConjureResult<boolean, never>>;
    testDouble(): Promise<IConjureResult<number | "NaN", never>>;
    testInteger(): Promise<IConjureResult<number, never>>;
    testPostOptional(maybeString?: string | null): Promise<IConjureResult<string | null, never>>;
    testOptionalIntegerAndDouble(maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<IConjureResult<void, never>>;
}

export class TestServiceWithErrors implements ITestServiceWithErrors {
    constructor(private bridge: IHttpApiBridge) {
    }

    /**
     * Returns a mapping from file system id to backing file system configuration.
     *
     */
    public getFileSystems(): Promise<IConjureResult<{ [key: string]: IBackingFileSystem }, never>> {
        return this.bridge
            .call<{ [key: string]: IBackingFileSystem }>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<{ [key: string]: IBackingFileSystem }>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public createDataset(request: ICreateDatasetRequest, testHeaderArg: string): Promise<IConjureResult<IDataset, never>> {
        return this.bridge
            .call<IDataset>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<IDataset>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public getDataset(datasetRid: string): Promise<IConjureResult<IDataset | null, never>> {
        return this.bridge
            .call<IDataset | null>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<IDataset | null>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public getRawData(datasetRid: string): Promise<IConjureResult<ReadableStream<Uint8Array>, never>> {
        return this.bridge
            .call<ReadableStream<Uint8Array>>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<ReadableStream<Uint8Array>>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public getAliasedRawData(datasetRid: string): Promise<IConjureResult<ReadableStream<Uint8Array>, never>> {
        return this.bridge
            .call<ReadableStream<Uint8Array>>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<ReadableStream<Uint8Array>>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public maybeGetRawData(datasetRid: string): Promise<IConjureResult<ReadableStream<Uint8Array> | null, never>> {
        return this.bridge
            .call<ReadableStream<Uint8Array> | null>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<ReadableStream<Uint8Array> | null>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public getAliasedString(datasetRid: string): Promise<IConjureResult<string, never>> {
        return this.bridge
            .call<string>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<string>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public uploadRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<IConjureResult<void, never>> {
        return this.bridge
            .call<void>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<void>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public uploadAliasedRawData(input: ReadableStream<Uint8Array> | BufferSource | Blob): Promise<IConjureResult<void, never>> {
        return this.bridge
            .call<void>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<void>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public getBranches(datasetRid: string): Promise<IConjureResult<Array<string>, never>> {
        return this.bridge
            .call<Array<string>>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<Array<string>>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    /**
     * Gets all branches of this dataset.
     *
     * @deprecated use getBranches instead
     */
    public getBranchesDeprecated(datasetRid: string): Promise<IConjureResult<Array<string>, never>> {
        return this.bridge
            .call<Array<string>>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<Array<string>>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public resolveBranch(datasetRid: string, branch: string): Promise<IConjureResult<string | null, never>> {
        return this.bridge
            .call<string | null>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<string | null>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testParam(datasetRid: string): Promise<IConjureResult<string | null, never>> {
        return this.bridge
            .call<string | null>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<string | null>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<IConjureResult<number, never>> {
        return this.bridge
            .call<number>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<number>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testNoResponseQueryParams(query: string, something: string, implicit: string, setEnd: Array<string>, optionalMiddle?: string | null, optionalEnd?: string | null): Promise<IConjureResult<void, never>> {
        return this.bridge
            .call<void>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<void>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testBoolean(): Promise<IConjureResult<boolean, never>> {
        return this.bridge
            .call<boolean>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<boolean>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testDouble(): Promise<IConjureResult<number | "NaN", never>> {
        return this.bridge
            .call<number | "NaN">(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<number | "NaN">)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testInteger(): Promise<IConjureResult<number, never>> {
        return this.bridge
            .call<number>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<number>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testPostOptional(maybeString?: string | null): Promise<IConjureResult<string | null, never>> {
        return this.bridge
            .call<string | null>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<string | null>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }

    public testOptionalIntegerAndDouble(maybeInteger?: number | null, maybeDouble?: number | "NaN" | null): Promise<IConjureResult<void, never>> {
        return this.bridge
            .call<void>(
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
            )
            .then(result => ({ status: "success", result }) as IConjureSuccess<void>)
            .catch(error => ({ status: "failure", error }) as IConjureFailure<never>);
    }
}
