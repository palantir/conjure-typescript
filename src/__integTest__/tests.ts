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

import { assert } from "chai";
import { DefaultHttpApiBridge, isConjureError } from "conjure-client";
import {
    AutoDeserializeConfirmService,
    AutoDeserializeService,
    IClientTestCases,
    SingleHeaderService,
    SinglePathParamService,
    SingleQueryParamService,
} from "./__generated__";
// HACKHACK to load test-cases
// tslint:disable:no-var-requires
const testCases: IClientTestCases = require("../../build/resources/test-cases.json").client;

const blacklist: { [endpointName: string]: number[] } = {
    receiveStringAliasExample: [1],
    receiveDoubleExample: [1, 3],
    receiveDoubleAliasExample: [1],
    receiveIntegerAliasExample: [0],
    receiveBooleanAliasExample: [1],
    receiveSafeLongAliasExample: [1],
};

const bridge = new DefaultHttpApiBridge({
    baseUrl: "http://localhost:8000",
    userAgent: {
        productName: "conjure-typescript",
        productVersion: "0.0.0",
    },
    fetch: (url: string | Request, init?: RequestInit) => {
        if (init && init.headers) {
            delete (init.headers as { [x: string]: string })["Fetch-User-Agent"];
        }
        return window.fetch(url, init);
    },
});

describe("Body serde", () => {
    const testService = new AutoDeserializeService(bridge);
    const confirmService = new AutoDeserializeConfirmService(bridge);

    Object.keys(testCases.autoDeserialize).map(endpointName => {
        const bodyTestCases = testCases.autoDeserialize[endpointName];
        bodyTestCases.positive.forEach((_, i) => {
            it(`${endpointName}_${i}_pass`, automaticTest(endpointName, i, true));
        });
        bodyTestCases.negative.forEach((_, i) => {
            const index = i + bodyTestCases.positive.length;
            it(`${endpointName}_${index}_fail`, automaticTest(endpointName, index, false));
        });
    });

    function automaticTest(endpointName: string, index: number, shouldPass: boolean) {
        return async () => {
            if (!shouldPass || (endpointName in blacklist && blacklist[endpointName].indexOf(index) >= 0)) {
                return;
            }
            if (shouldPass) {
                return confirmService.confirm(endpointName, index, await (testService as any)[endpointName](index));
            }
            assert.throws(async () => (testService as any)[endpointName](index), Error, "Should fail");
        };
    }
});

describe("header", () => {
    const headerService = new SingleHeaderService(bridge);
    Object.keys(testCases.singleHeaderService).forEach(endpointName =>
        testCases.singleHeaderService[endpointName].map((value, i) =>
            it(`${endpointName}_${i}_pass`, async () => (headerService as any)[endpointName](i, JSON.parse(value))),
        ),
    );
});

describe("path serde", () => {
    const pathService = new SinglePathParamService(bridge);
    Object.keys(testCases.singlePathParamService).forEach(endpointName =>
        testCases.singlePathParamService[endpointName].map((value, i) =>
            it(`${endpointName}_${i}_pass`, async () => (pathService as any)[endpointName](i, JSON.parse(value))),
        ),
    );
});

describe("header", () => {
    const queryService = new SingleQueryParamService(bridge);
    Object.keys(testCases.singleQueryParamService).forEach(endpointName =>
        testCases.singleQueryParamService[endpointName].map((value, i) =>
            it(`${endpointName}_${i}_pass`, async () => (queryService as any)[endpointName](i, JSON.parse(value))),
        ),
    );
});
