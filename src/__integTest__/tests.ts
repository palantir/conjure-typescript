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

const blacklist: { [endpointName: string]: string[] } = {
    receiveStringAliasExample: ['""'],
    receiveDoubleExample: ['{"value":0.0}', '{"value":123e5}'],
    receiveDoubleAliasExample: ["10.0"],
    receiveIntegerAliasExample: ["0"],
    receiveBooleanAliasExample: ["false"],
    receiveSafeLongAliasExample: ["0"],
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
        bodyTestCases.positive.forEach((value, i) => {
            it(`${endpointName}_${i}_pass`, automaticTest(endpointName, i, value, true));
        });
        bodyTestCases.negative.forEach((value, i) => {
            const index = i + bodyTestCases.positive.length;
            it(`${endpointName}_${index}_fail`, automaticTest(endpointName, index, value, false));
        });
    });

    function automaticTest(endpointName: string, index: number, value: string, shouldPass: boolean) {
        return async () => {
            if (!shouldPass || (endpointName in blacklist && blacklist[endpointName].indexOf(value) >= 0)) {
                return;
            }
            if (shouldPass) {
                return confirmService.confirm(endpointName, index, await (testService as any)[endpointName](index));
            }
            assert.throws(async () => (testService as any)[endpointName](index), Error, "Should fail");
        };
    }
});

describe("SingleHeaderService", () => {
    const headerService = new SingleHeaderService(bridge);
    Object.keys(testCases.singleHeaderService).forEach(endpointName =>
        testCases.singleHeaderService[endpointName].map((value, i) =>
            it(`${endpointName}(${value}) [${i}]`, async () =>
                (headerService as any)[endpointName](i, JSON.parse(value))),
        ),
    );
});

describe("SinglePathParamService", () => {
    const pathService = new SinglePathParamService(bridge);
    Object.keys(testCases.singlePathParamService).forEach(endpointName =>
        testCases.singlePathParamService[endpointName].map((value, i) =>
            it(`${endpointName}(${value}) [${i}]`, async () =>
                (pathService as any)[endpointName](i, JSON.parse(value))),
        ),
    );
});

describe("SingleQueryParamService", () => {
    const queryService = new SingleQueryParamService(bridge);
    Object.keys(testCases.singleQueryParamService).forEach(endpointName =>
        testCases.singleQueryParamService[endpointName].map((value, i) =>
            it(`${endpointName}(${value}) [${i}]`, async () =>
                (queryService as any)[endpointName](i, JSON.parse(value))),
        ),
    );
});
