/**
 * @license
 * Copyright 2018 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "fs-extra";
import { IProductDependency } from "./slslDependencies";

export interface IPackageJson {
    author?: string;
    dependencies: { [name: string]: string };
    description?: string;
    devDependencies: { [name: string]: string };
    license?: string;
    main?: string;
    name: string;
    peerDependencies?: { [name: string]: string };
    private?: boolean;
    scripts: { [name: string]: string };
    sls?: {
        dependencies?: {
            [key: string]: IProductDependency;
        };
    };
    sideEffects?: boolean;
    types?: string;
    typings?: string;
    version: string;
}

export async function writeJson(location: string, blob: object) {
    return fs.writeJson(location, blob, { spaces: 2, replacer: null });
}
