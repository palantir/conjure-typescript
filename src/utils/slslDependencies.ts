/**
 * @license Copyright 2018 Palantir Technologies, Inc. All rights reserved.
 */

export interface ISlsManifestDependency {
    "product-group": string;
    "product-name": string;
    "minimum-version": string;
    "maximum-version": string;
    "recommended-version"?: string;
}

export interface IProductDependency {
    minVersion: string;
    maxVersion: string;
    recommendedVersion?: string;
}
