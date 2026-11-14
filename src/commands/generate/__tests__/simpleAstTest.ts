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

import { ErrorCode, HttpMethod, IType, ITypeDefinition, PrimitiveType } from "conjure-api";
import * as fs from "fs";
import * as path from "path";
import { directory } from "tempy";
import { Project } from "ts-morph";
import { createHashableTypeName } from "../../../utils/hashingUtils";
import { DEFAULT_TYPE_GENERATION_FLAGS } from "../../../__tests__/utils/constants";
import { generateError } from "../generators/generateError";
import { generateNonThrowingService } from "../generators/generateNonThrowingService";
import { generateThrowingService } from "../generators/generateThrowingService";
import { generateEnum, generateType } from "../generators/generateType";
import { SimpleAst } from "../simpleAst";

describe("simpleAst", () => {
    let outDir: string;
    let simpleAst: SimpleAst;

    beforeEach(() => {
        outDir = directory();
        simpleAst = new SimpleAst(outDir);
    });

    it.each([false, true])("supports a type named Index with multiple packages: %s", async multiplePackages => {
        const indexName = { name: "Index", package: "com.palantir.package1" };
        const indexDefinition = ITypeDefinition.object({ typeName: indexName, fields: [] });
        const knownTypes = new Map([[createHashableTypeName(indexName), indexDefinition]]);
        await generateType(indexDefinition, knownTypes, simpleAst, DEFAULT_TYPE_GENERATION_FLAGS);
        await generateType(
            ITypeDefinition.object({
                typeName: { name: "Container", package: "com.palantir.package1" },
                fields: [{ fieldName: "index", type: IType.reference(indexName) }],
            }),
            knownTypes,
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );
        if (multiplePackages) {
            await generateType(
                ITypeDefinition.object({ typeName: { name: "Other", package: "com.palantir.package2" }, fields: [] }),
                knownTypes,
                simpleAst,
                DEFAULT_TYPE_GENERATION_FLAGS,
            );
        }

        await simpleAst.generateIndexFiles();

        const moduleIndex = fs.readFileSync(path.join(outDir, "package1/index.ts"), "utf8");
        expect(moduleIndex).toContain("export interface IIndex");
        expect(moduleIndex).toContain('export * from "./container";');
        expect(moduleIndex).not.toContain('export * from "./index";');
        const project = new Project({ compilerOptions: { strict: true, types: [] } });
        project.addSourceFilesAtPaths(path.join(outDir, "**/*.ts"));
        expect(project.getPreEmitDiagnostics()).toEqual([]);
    });

    it("generate index file with multiple packages.", async () => {
        await generateError(
            {
                code: ErrorCode.INVALID_ARGUMENT,
                errorName: { name: "MyError", package: "com.palantir.package1" },
                namespace: "Metadata",
                safeArgs: [],
                unsafeArgs: [],
            },
            new Map(),
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );

        await generateThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                        returns: {
                            primitive: PrimitiveType.INTEGER,
                            type: "primitive",
                        },
                        tags: [],
                        errors: [
                            {
                                error: {
                                    name: "MyError",
                                    package: "com.palantir.package1",
                                    namespace: "Metadata",
                                },
                            },
                        ],
                    },
                ],
                serviceName: {
                    name: "MyService",
                    package: "com.palantir.package2",
                },
            },
            new Map([
                [
                    createHashableTypeName({ name: "MyError", package: "com.palantir.package1" }),
                    {
                        type: "object",
                        object: { typeName: { name: "MyError", package: "com.palantir.package1" }, fields: [] },
                    },
                ],
            ]),
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );

        await generateNonThrowingService(
            {
                endpoints: [
                    {
                        args: [],
                        endpointName: "foo",
                        httpMethod: HttpMethod.GET,
                        httpPath: "/foo",
                        markers: [],
                        returns: {
                            primitive: PrimitiveType.INTEGER,
                            type: "primitive",
                        },
                        tags: [],
                        errors: [
                            {
                                error: {
                                    name: "MyError",
                                    package: "com.palantir.package1",
                                    namespace: "Metadata",
                                },
                            },
                        ],
                    },
                ],
                serviceName: {
                    name: "MyService",
                    package: "com.palantir.package2",
                },
            },
            new Map([
                [
                    createHashableTypeName({ name: "MyError", package: "com.palantir.package1" }),
                    {
                        type: "object",
                        object: { typeName: { name: "MyError", package: "com.palantir.package1" }, fields: [] },
                    },
                ],
            ]),
            simpleAst,
            DEFAULT_TYPE_GENERATION_FLAGS,
        );

        await generateEnum(
            {
                typeName: {
                    name: "MyEnum",
                    package: "com.palantir.package2",
                },
                values: [{ value: "FOO" }, { value: "BAR" }],
            },
            simpleAst,
        );

        await simpleAst.generateIndexFiles();

        const package1Index = path.join(outDir, "package1/index.ts");
        const package1Contents = fs.readFileSync(package1Index, "utf8");
        expect(package1Contents).toEqual(`export * from "./myError";
`);

        const package2Index = path.join(outDir, "package2/index.ts");
        const package2Contents = fs.readFileSync(package2Index, "utf8");
        expect(package2Contents).toEqual(`export * from "./myEnum";
export * from "./myService";
export * from "./myServiceWithErrors";
`);
    });
});
