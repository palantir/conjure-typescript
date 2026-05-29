/**
 * @license
 * Copyright 2025 Palantir Technologies, Inc.
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

import { doubleQuote, singleQuote } from "../utils/quotesUtils";

describe("doubleQuote", () => {
    it("wraps simple string", () => {
        expect(doubleQuote("hello")).toBe('"hello"');
    });

    it("escapes embedded double quotes", () => {
        expect(doubleQuote('hello"world')).toBe('"hello\\"world"');
    });

    it("escapes backslashes before quotes", () => {
        expect(doubleQuote('hello\\"world')).toBe('"hello\\\\\\"world"');
    });
});

describe("singleQuote", () => {
    it("wraps simple string", () => {
        expect(singleQuote("hello")).toBe("'hello'");
    });

    it("escapes embedded single quotes", () => {
        expect(singleQuote("hello'world")).toBe("'hello\\'world'");
    });

    it("escapes backslashes before quotes", () => {
        expect(singleQuote("hello\\'world")).toBe("'hello\\\\\\'world'");
    });
});
