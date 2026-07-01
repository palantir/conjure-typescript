/**
 * @license
 * Copyright 2021 Palantir Technologies, Inc.
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

/**
 * Simple and convenient interface allowing for passing flags through the "generation" code.
 */
export interface ITypeGenerationFlags {
    /**
     * When set to true, compatible alias types will be converted to flavored strings.
     */
    readonly flavorizedAliases: boolean;

    /**
     * When set to true, generated interfaces will have read-only properties and use ReadonlyArray instead of Array.
     */
    readonly readonlyInterfaces: boolean;

    /**
     * When set to true, each generated object and union type exports a companion `IFooJSON` interface that
     * accurately represents the JSON wire format. Specifically, `list`, `set`, and `map` fields are typed
     * as `T | null | undefined` (since the wire can send null/absent for collection fields), and references
     * to other object/union types use the `IBarJSON` variant instead of `IBar`.
     *
     * This is a pure type-level change with zero runtime cost. Enables callers to type-check raw JSON
     * responses before deserialization.
     *
     * Implicitly enabled by `generateFromJson` and `applyFromJson`.
     */
    readonly generateJsonTypes: boolean;

    /**
     * When set to true, each generated object and union type exports a `fromFooJson(json: IFooJSON): IFoo`
     * function that applies Conjure §5.6 deserialization rules: null/absent list|set|map → empty collection;
     * null/absent map → `{}`; nested object/union fields recursively deserialized.
     *
     * Callers may invoke these functions explicitly at the point they control (e.g., after receiving a raw
     * fetch response), rather than having deserialization applied automatically to all service calls.
     * A future `toFooJson` serializer can be added symmetrically.
     *
     * Implicitly enables `generateJsonTypes`. Implicitly enabled by `applyFromJson`.
     */
    readonly generateFromJson: boolean;

    /**
     * When set to true, generated service methods automatically apply the appropriate `fromFooJson`
     * deserialization to each response. The bridge call generic is updated to the JSON variant type
     * (e.g., `bridge.call<IFooJSON>(...).then(fromFooJson)`), so the declared return type remains `IFoo`
     * while the raw bridge result is deserialized transparently.
     *
     * Binary (octet-stream) endpoints are exempt — they are not JSON-encoded.
     *
     * Implicitly enables `generateFromJson` and `generateJsonTypes`.
     * Addresses: palantir/conjure-typescript#48, #78, #156.
     */
    readonly applyFromJson: boolean;
}
