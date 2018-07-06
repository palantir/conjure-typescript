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
import * as fs from "fs-extra";
import * as path from "path";
import { AutoDeserializeService, ITestCasesYml } from "./__generated__";

describe("Array", () => {
    let testService: AutoDeserializeService;
    beforeAll(() => {
        testService = new AutoDeserializeService(
            new DefaultHttpApiBridge({
                baseUrl: "localhost:8080",
                userAgent: {
                    productName: "conjure-typescript",
                    productVersion: "0.0.0",
                },
            }),
        );
    });

    const testCasesFile: ITestCasesYml = fs.readJsonSync(path.join(__dirname, "../../resources/test-cases.json"), {
        encoding: "utf8",
    });
    Object.keys(testCasesFile.autoDeserialize).map(endpointName => {
        const testCases = testCasesFile.autoDeserialize[endpointName];
        testCases.positive.map((_, i) => {
            it(`${endpointName}_${i}`, automaticTest(testService, endpointName, i, true));
        });
        testCases.negative.map((_, i) => {
            it(`${endpointName}_${i}`, automaticTest(testService, endpointName, i + testCases.positive.length, false));
        });
    });
});

function automaticTest(testService: AutoDeserializeService, endpointName: string, index: number, shouldPass: boolean) {
    return async () => {
        let response: any;
        try {
            response = (testService as any)[endpointName](index);
        } catch (e) {
            if (shouldPass) {
                assert.fail();
            }
            response = "Error";
        }
        // tslint:disable:no-console
        console.log(response);
    };
}
