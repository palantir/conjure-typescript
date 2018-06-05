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

import { HttpMethod, IParameterType, IType, PrimitiveType } from "conjure-api";
import * as fs from "fs";
import * as path from "path";
import { directory } from "tempy";
import { generateService } from "../generate/serviceGenerator";
import { SimpleAst } from "../generate/simpleAst";
import { createHashableTypeName } from "../generate/utils";
import {
    assertOutputAndExpectedAreEqual,
    foreignObject,
    servicesLocalObject as localObject,
} from "./testTypesGeneratorTest";

const stringType: IType = IType.primitive(PrimitiveType.STRING);

describe("serviceGenerator", () => {
    const expectedDir = path.join(__dirname, "./resources");
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it("emits service interface and class with primitive return type", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                        returns: { primitive: PrimitiveType.INTEGER, type: "primitive" },
                    },
                ],
                serviceName: { name: "PrimitiveService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "services/primitiveService.ts");
    });

    it("emits service interface and class with safelong header type", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [
                            {
                                argName: "investigation",
                                markers: [],
                                paramType: IParameterType.header({ paramId: "X-Investigation" }),
                                type: IType.primitive(PrimitiveType.SAFELONG),
                            },
                        ],
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                    },
                ],
                serviceName: { name: "ServiceWithSafelongHeader", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "services/serviceWithSafelongHeader.ts");
    });

    it("handles endpoint with void return type", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "returnsVoid",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/bar",
                        markers: [],
                    },
                ],
                serviceName: { name: "MyService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        const outFile = path.join(outDir, "services/myService.ts");
        const contents = fs.readFileSync(outFile, "utf8");
        expect(contents).toContain("returnsVoid(): Promise<void>;");
        expect(contents).toContain("returnsVoid(): Promise<void> {");
        expect(contents).toContain("return this.bridge.callEndpoint<void>({");
    });

    it("handles binary body and return types", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [
                            {
                                argName: "body",
                                markers: [],
                                paramType: IParameterType.body({}),
                                type: { primitive: PrimitiveType.BINARY, type: "primitive" },
                            },
                        ],
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/bar",
                        markers: [],
                        returns: { primitive: PrimitiveType.BINARY, type: "primitive" },
                    },
                ],
                serviceName: { name: "MyService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        const outFile = path.join(outDir, "services/myService.ts");
        const contents = fs.readFileSync(outFile, "utf8");
        expect(contents).toContain("foo(body: any): Promise<any>;");
        expect(contents).toContain(`requestMediaType: MediaType.APPLICATION_OCTET_STREAM`);
        expect(contents).toContain(`responseMediaType: MediaType.APPLICATION_OCTET_STREAM`);
    });

    it("emits imports and correct signature for service with references", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [
                            {
                                argName: "obj",
                                markers: [],
                                paramType: IParameterType.body({}),
                                type: localObject.reference,
                            },
                        ],
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                        returns: foreignObject.reference,
                    },
                ],
                serviceName: {
                    name: "MyService",
                    package: "com.palantir.services",
                },
            },
            new Map([
                [createHashableTypeName(localObject.typeName), localObject.definition],
                [createHashableTypeName(foreignObject.typeName), foreignObject.definition],
            ]),
            simpleAst,
        );
        const outFile = path.join(outDir, "services/myService.ts");
        const contents = fs.readFileSync(outFile, "utf8");
        expect(contents).toContain(`import { IOtherObject } from "../other/otherObject";`);
        expect(contents).toContain(`import { ISomeObject } from "./someObject";`);
        expect(contents).toContain(`foo(obj: ISomeObject): Promise<IOtherObject>;`);
    });

    it("emits different param types", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [
                            {
                                argName: "body",
                                markers: [],
                                paramType: IParameterType.body({}),
                                type: stringType,
                            },
                            {
                                argName: "header",
                                markers: [],
                                paramType: {
                                    header: { paramId: "Header" },
                                    type: "header",
                                },
                                type: stringType,
                            },
                            {
                                argName: "path",
                                markers: [],
                                paramType: {
                                    path: {},
                                    type: "path",
                                },
                                type: stringType,
                            },
                            {
                                argName: "query",
                                markers: [],
                                paramType: {
                                    query: { paramId: "Query" },
                                    type: "query",
                                },
                                type: stringType,
                            },
                        ],
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo/{path}",
                        markers: [],
                    },
                ],
                serviceName: { name: "ParamTypeService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "services/paramTypeService.ts");
    });

    it("handles header auth-type", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [
                            {
                                argName: "header",
                                markers: [],
                                paramType: IParameterType.header({ paramId: "Header" }),
                                type: stringType,
                            },
                        ],
                        auth: {
                            header: {},
                            type: "header",
                        },
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                    },
                ],
                serviceName: { name: "MyService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        const outFile = path.join(outDir, "services/myService.ts");
        const contents = fs.readFileSync(outFile, "utf8");
        expect(contents).toContain("foo(header: string): Promise<void>;");
        expect(contents).toContain("foo(header: string): Promise<void> {");
        expect(contents).toMatch(/headers: {\s*"Header": header,\s*}/);
    });

    it("throws on multiple body args", async () => {
        expect.assertions(1);
        try {
            await generateService(
                {
                    endpoints: [
                        {
                            args: [
                                {
                                    argName: "body",
                                    markers: [],
                                    paramType: IParameterType.body({}),
                                    type: stringType,
                                },
                                {
                                    argName: "body2",
                                    markers: [],
                                    paramType: {
                                        body: {},
                                        type: "body",
                                    },
                                    type: stringType,
                                },
                            ],
                            endpointName: "foo",
                            httpMethod: HttpMethod.GET,
                            httpPath: "/foo",
                            markers: [],
                        },
                    ],
                    serviceName: { name: "MyService", package: "com.palantir.services" },
                },
                new Map(),
                simpleAst,
            );
        } catch (e) {
            expect(e).toEqual(new Error("endpoint cannot have more than one body arg, found: 2"));
        }
    });

    it("throws on header arg with no param-id", async () => {
        expect.assertions(1);
        try {
            await generateService(
                {
                    endpoints: [
                        {
                            args: [
                                {
                                    argName: "foo",
                                    markers: [],
                                    paramType: IParameterType.header({} as any),
                                    type: stringType,
                                },
                            ],
                            endpointName: "foo",
                            httpMethod: HttpMethod.GET,
                            httpPath: "/foo",
                            markers: [],
                        },
                    ],
                    serviceName: { name: "MyService", package: "com.palantir.services" },
                },
                new Map(),
                simpleAst,
            );
        } catch (e) {
            expect(e).toEqual(new Error("header arguments must define a 'param-id': foo"));
        }
    });

    it("throws on query arg with no param-id", async () => {
        expect.assertions(1);
        try {
            await generateService(
                {
                    endpoints: [
                        {
                            args: [
                                {
                                    argName: "foo",
                                    markers: [],
                                    paramType: IParameterType.query({} as any),
                                    type: stringType,
                                },
                            ],
                            endpointName: "foo",
                            httpMethod: HttpMethod.GET,
                            httpPath: "/foo",
                            markers: [],
                        },
                    ],
                    serviceName: { name: "MyService", package: "com.palantir.services" },
                },
                new Map(),
                simpleAst,
            );
        } catch (e) {
            expect(e).toEqual(new Error("query arguments must define a 'param-id': foo"));
        }
    });

    it("emits service interfaces with docs", async () => {
        await generateService(
            {
                docs: "service level docs",
                endpoints: [
                    {
                        args: [],
                        docs: "endpoint level docs",
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                    },
                ],
                serviceName: { name: "MyService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        const outFile = path.join(outDir, "services/myService.ts");
        const contents = fs.readFileSync(outFile, "utf8");
        expect(contents).toContain(
            `/**
 * service level docs
 */
export interface IMyService {
    /**
     * endpoint level docs
     */
    foo(): Promise<void>;
}
`,
        );

        expect(contents).not.toContain(
            `
            /** 
             * endpoint level docs
             */
            foo(): Promise<void> {`,
        );
    });

    it("emits service with optional params", async () => {
        await generateService(
            {
                endpoints: [
                    {
                        args: [
                            {
                                argName: "name",
                                markers: [],
                                paramType: IParameterType.query({ paramId: "Query" }),
                                type: IType.optional({ itemType: IType.primitive(PrimitiveType.STRING) }),
                            },
                            {
                                argName: "header",
                                markers: [],
                                paramType: IParameterType.header({ paramId: "Header" }),
                                type: stringType,
                            },
                        ],
                        auth: {
                            header: {},
                            type: "header",
                        },
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                    },
                ],
                serviceName: { name: "OptionalService", package: "com.palantir.services" },
            },
            new Map(),
            simpleAst,
        );
        assertOutputAndExpectedAreEqual(outDir, expectedDir, "services/optionalService.ts");
    });
});
