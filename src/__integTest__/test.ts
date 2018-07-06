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
import { DefaultHttpApiBridge } from "conjure-client";
import { AutoDeserializeService, ITestCasesYml } from "./__generated__";
// HACKHACK to load test-cases
// tslint:disable:no-var-requires
const testCasesFile: ITestCasesYml = require("../../resources/test-cases.json");

describe("Array", () => {
    const testService = new AutoDeserializeService(
        new DefaultHttpApiBridge({
            baseUrl: "http://localhost:8000",
            userAgent: {
                productName: "conjure-typescript",
                productVersion: "0.0.0",
            },
        }),
    );

    Object.keys(testCasesFile.autoDeserialize).map(endpointName => {
        const testCases = testCasesFile.autoDeserialize[endpointName];
        testCases.positive.map((_, i) => {
            it(`${endpointName}_${i}_pass`, automaticTest(testService, endpointName, i, true));
        });
        testCases.negative.map((_, i) => {
            const index = i + testCases.positive.length;
            it(`${endpointName}_${index}_fail`, automaticTest(testService, endpointName, index, false));
        });
    });
});

function automaticTest(testService: AutoDeserializeService, endpointName: string, index: number, shouldPass: boolean) {
    return async () => {
        let response: any = null;
        try {
            response = await (testService as any)[endpointName](index);
        } finally {
            assert.equal((!shouldPass && response == null) || (shouldPass && response != null), true);
            if (shouldPass) {
                await testService.confirm(endpointName, index, response);
            }
        }
    };
}
