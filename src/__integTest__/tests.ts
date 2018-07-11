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

import {assert} from "chai";
import {DefaultHttpApiBridge, isConjureError} from "conjure-client";
import {
    AutoDeserializeConfirmService,
    AutoDeserializeService,
    ITestCases,
    SingleHeaderService,
    SinglePathParamService,
    SingleQueryParamService,
} from "./__generated__";
// HACKHACK to load test-cases
// tslint:disable:no-var-requires
const testCasesFile: ITestCases = require("../../build/resources/test-cases.json");

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

describe("Auto deserialize", () => {
    const testService = new AutoDeserializeService(bridge);
    const confirmService = new AutoDeserializeConfirmService(bridge);

    Object.keys(testCasesFile.client.autoDeserialize).map(endpointName => {
        const testCases = testCasesFile.client.autoDeserialize[endpointName];
        testCases.positive.map((_, i) => {
            it(`${endpointName}_${i}_pass`, automaticTest(endpointName, i, true));
        });
        testCases.negative.map((_, i) => {
            const index = i + testCases.positive.length;
            it(`${endpointName}_${index}_fail`, automaticTest(endpointName, index, false));
        });
    });

    function automaticTest(endpointName: string, index: number, shouldPass: boolean) {
        return async () => {
            if (endpointName in blacklist && blacklist[endpointName].indexOf(index) >= 0) {
                return;
            }
            let response: any = null;
            try {
                response = await (testService as any)[endpointName](index);
            } catch (e) {
                if (!isConjureError(e) || shouldPass) {
                    assert.fail();
                }
                assert.fail("error");
            }
            if (!shouldPass) {
                // TODO(forozco): perform any type of validation on client side
                // assert.fail(response, value);
                return;
            }
            await confirmService.confirm(endpointName, index, response);
        };
    }
});

describe("single params", () => {
    const servicesAndTests: Array<{ service: any; tests: { [endpoint: string]: string[] } }> = [
        { service: new SinglePathParamService(bridge) as any, tests: testCasesFile.client.singlePathParamService },
        { service: new SingleQueryParamService(bridge) as any, tests: testCasesFile.client.singleQueryParamService },
        { service: new SingleHeaderService(bridge) as any, tests: testCasesFile.client.singleHeaderService },
    ];

    servicesAndTests.forEach(({ service, tests }) => {
        Object.keys(tests).map(endpointName => {
            const testCases = tests[endpointName];
            testCases.map((value, i) => {
                it(`${endpointName}_${i}_pass`, test(service, endpointName, i, JSON.parse(value)));
            });
        });
    });

    function test(service: any, endpointName: string, index: number, value: any) {
        return async () => {
            try {
                await service[endpointName](index, value);
            } catch (e) {
                assert.fail("error", e);
            }
        };
    }
});
