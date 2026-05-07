export interface ICreateDatasetRequest {
    readonly 'fileSystemId': string;
    readonly 'path': string;
    readonly 'tags': ReadonlyArray<string>;
}
