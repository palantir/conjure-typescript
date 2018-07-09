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
import { AutoDeserializeConfirmService, AutoDeserializeService, ITestCases } from "./__generated__";
// HACKHACK to load test-cases
// tslint:disable:no-var-requires
const testCasesFile: ITestCases = require("../../resources/test-cases.json");

describe("Auto deserialize", () => {
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
