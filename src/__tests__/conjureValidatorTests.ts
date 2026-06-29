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

import { IConjureDefinition } from "conjure-api";
import { validateConjureDefinition } from "../utils/conjureValidator";
import { sanitizeDocs } from "../utils/docsUtils";
import {
    convertToCamelCase,
    matchesCamelCase,
    matchesKebabCase,
    matchesSnakeCase,
} from "../utils/validators/fieldNameValidator";

function makeDef(overrides: Partial<IConjureDefinition> = {}): IConjureDefinition {
    const base = { version: 1, errors: [], services: [], types: [], ...overrides };
    return base as IConjureDefinition;
}

function makeAlias(name: string, pkg: string): any {
    return {
        type: "alias",
        alias: {
            typeName: { name, package: pkg },
            alias: { type: "primitive", primitive: "STRING" },
        },
    };
}

function makeObject(name: string, pkg: string, fields: any[]): any {
    return {
        type: "object",
        object: { typeName: { name, package: pkg }, fields },
    };
}

function makeEnum(name: string, pkg: string, values: string[]): any {
    return {
        type: "enum",
        enum: {
            typeName: { name, package: pkg },
            values: values.map(v => ({ value: v })),
        },
    };
}

function makeUnion(name: string, pkg: string, members: any[]): any {
    return {
        type: "union",
        union: {
            typeName: { name, package: pkg },
            union: members,
        },
    };
}

function makeService(name: string, pkg: string, endpoints: any[]): any {
    return {
        serviceName: { name, package: pkg },
        endpoints,
    };
}

function makeEndpoint(name: string, method: string, path: string, args: any[] = []): any {
    return { endpointName: name, httpMethod: method, httpPath: path, args };
}

function makeError(
    name: string,
    pkg: string,
    namespace: string,
    code: string,
    safeArgs: any[] = [],
    unsafeArgs: any[] = [],
): any {
    return {
        errorName: { name, package: pkg },
        namespace,
        code,
        safeArgs,
        unsafeArgs,
    };
}

function field(name: string, type: any = { type: "primitive", primitive: "STRING" }): any {
    return { fieldName: name, type };
}

// --- Case pattern tests ---

describe("matchesCamelCase", () => {
    it("accepts valid camelCase", () => {
        expect(matchesCamelCase("myVar")).toBe(true);
        expect(matchesCamelCase("myVarName")).toBe(true);
        expect(matchesCamelCase("a")).toBe(true);
        expect(matchesCamelCase("ab")).toBe(true);
        expect(matchesCamelCase("myVarX")).toBe(true); // trailing single uppercase ok
    });

    it("rejects invalid camelCase", () => {
        expect(matchesCamelCase("MyVar")).toBe(false); // starts with uppercase
        expect(matchesCamelCase("myVARName")).toBe(false); // 3+ consecutive uppercase
        expect(matchesCamelCase("my-var")).toBe(false); // contains dash
        expect(matchesCamelCase("my_var")).toBe(false); // contains underscore
        expect(matchesCamelCase("")).toBe(false);
    });
});

describe("matchesKebabCase", () => {
    it("accepts valid kebab-case", () => {
        expect(matchesKebabCase("my-var")).toBe(true);
        expect(matchesKebabCase("my-var-name")).toBe(true);
        expect(matchesKebabCase("a")).toBe(true);
    });

    it("rejects invalid kebab-case", () => {
        expect(matchesKebabCase("my--var")).toBe(false); // double dash
        expect(matchesKebabCase("My-Var")).toBe(false); // uppercase
        expect(matchesKebabCase("-var")).toBe(false); // starts with dash
        expect(matchesKebabCase("")).toBe(false);
    });
});

describe("matchesSnakeCase", () => {
    it("accepts valid snake_case", () => {
        expect(matchesSnakeCase("my_var")).toBe(true);
        expect(matchesSnakeCase("my_var_name")).toBe(true);
        expect(matchesSnakeCase("a")).toBe(true);
    });

    it("rejects invalid snake_case", () => {
        expect(matchesSnakeCase("my__var")).toBe(false); // double underscore
        expect(matchesSnakeCase("My_Var")).toBe(false); // uppercase
        expect(matchesSnakeCase("_var")).toBe(false); // starts with underscore
        expect(matchesSnakeCase("")).toBe(false);
    });
});

describe("convertToCamelCase", () => {
    it("converts kebab to camel", () => {
        expect(convertToCamelCase("my-var")).toBe("myVar");
        expect(convertToCamelCase("field-name-with-dashes")).toBe("fieldNameWithDashes");
    });

    it("converts snake to camel", () => {
        expect(convertToCamelCase("my_var")).toBe("myVar");
    });

    it("returns camelCase unchanged", () => {
        expect(convertToCamelCase("myVar")).toBe("myVar");
    });
});

// --- Top-level orchestrator tests ---

describe("validateConjureDefinition", () => {
    describe("type names (PascalCase)", () => {
        it("accepts valid PascalCase", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("MyAlias", "com.palantir.product")],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects lowercase start", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("myAlias", "com.palantir.product")],
                    }),
                ),
            ).toThrow(/TypeNames must/);
        });

        it("rejects consecutive uppercase", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("HTTPRequest", "com.palantir.product")],
                    }),
                ),
            ).toThrow(/TypeNames must/);
        });

        it("rejects injection payload in name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias('Evil"Name', "com.palantir.product")],
                    }),
                ),
            ).toThrow(/TypeNames must/);
        });
    });

    describe("package names", () => {
        it("accepts valid package", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("MyAlias", "com.palantir.product")],
                    }),
                ),
            ).not.toThrow();
        });

        it("accepts empty package", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("MyAlias", "")],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects uppercase in package", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("MyAlias", "Com.Palantir")],
                    }),
                ),
            ).toThrow(/package names must match/);
        });

        it("rejects injection in package", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("MyAlias", 'com.evil";\nexport const x = 1;\n//x')],
                    }),
                ),
            ).toThrow(/package names must match/);
        });
    });

    describe("enum values", () => {
        it("accepts SCREAMING_SNAKE_CASE", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeEnum("MyEnum", "com.palantir.product", ["MY_VALUE", "ANOTHER"])],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects lowercase enum value", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeEnum("MyEnum", "com.palantir.product", ["lowercase"])],
                    }),
                ),
            ).toThrow(/Enumeration values must match/);
        });

        it("rejects reserved UNKNOWN (case insensitive)", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeEnum("MyEnum", "com.palantir.product", ["UNKNOWN"])],
                    }),
                ),
            ).toThrow(/UNKNOWN is a reserved/);
        });

        it("rejects duplicate enum values", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeEnum("MyEnum", "com.palantir.product", ["VALUE", "VALUE"])],
                    }),
                ),
            ).toThrow(/duplicate enum values/);
        });
    });

    describe("object field names", () => {
        it("accepts camelCase", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeObject("MyObj", "com.palantir.product", [field("myField")])],
                    }),
                ),
            ).not.toThrow();
        });

        it("accepts kebab-case (legacy)", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeObject("MyObj", "com.palantir.product", [field("my-field")])],
                    }),
                ),
            ).not.toThrow();
        });

        it("accepts snake_case (legacy)", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeObject("MyObj", "com.palantir.product", [field("my_field")])],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects injection in field name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeObject("MyObj", "com.palantir.product", [field('x"; malicious()')])],
                    }),
                ),
            ).toThrow(/FieldName/);
        });

        it("rejects duplicate field names after normalization", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeObject("MyObj", "com.palantir.product", [field("myField"), field("my-field")])],
                    }),
                ),
            ).toThrow(/duplicate field names/);
        });
    });

    describe("union members", () => {
        it("accepts valid union member", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeUnion("MyUnion", "com.palantir.product", [field("myMember")])],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects 'type' as union member", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeUnion("MyUnion", "com.palantir.product", [field("type")])],
                    }),
                ),
            ).toThrow(/must not be 'type'/);
        });

        it("rejects trailing underscore", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeUnion("MyUnion", "com.palantir.product", [field("trailingValue_")])],
                    }),
                ),
            ).toThrow(/FieldName/);
        });

        it("rejects invalid union member field name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeUnion("MyUnion", "com.palantir.product", [field('bad"name')])],
                    }),
                ),
            ).toThrow(/FieldName/);
        });

        it("accepts reserved words as union members (valid Java identifiers)", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeUnion("MyUnion", "com.palantir.product", [field("if"), field("new")])],
                    }),
                ),
            ).not.toThrow();
        });
    });

    describe("unique names", () => {
        it("rejects duplicate type names", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            makeAlias("MyAlias", "com.palantir.product"),
                            makeAlias("MyAlias", "com.palantir.product"),
                        ],
                    }),
                ),
            ).toThrow(/Duplicate/i);
        });

        it("rejects duplicate service names", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", []),
                            makeService("MyService", "com.palantir.product", []),
                        ],
                    }),
                ),
            ).toThrow(/Duplicate/i);
        });

        it("rejects type and error with same name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("Collision", "com.palantir.product")],
                        errors: [makeError("Collision", "com.palantir.product", "Conjure", "INTERNAL")],
                    }),
                ),
            ).toThrow(/Duplicate type\/error\/service name/);
        });

        it("rejects type and service with same name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeAlias("Collision", "com.palantir.product")],
                        services: [makeService("Collision", "com.palantir.product", [])],
                    }),
                ),
            ).toThrow(/Duplicate type\/error\/service name/);
        });

        it("rejects duplicate error names within same namespace", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [
                            makeError("MyError", "com.palantir.a", "Conjure", "INTERNAL"),
                            makeError("MyError", "com.palantir.b", "Conjure", "NOT_FOUND"),
                        ],
                    }),
                ),
            ).toThrow(/Duplicate error name/);
        });
    });

    describe("services", () => {
        it("accepts valid service", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items"),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects service name ending in Retrofit", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [makeService("MyServiceRetrofit", "com.palantir.product", [])],
                    }),
                ),
            ).toThrow(/Retrofit/);
        });

        it("rejects duplicate path+method", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items"),
                                makeEndpoint("listItems", "GET", "/items"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/defined by multiple endpoints/);
        });
    });

    describe("endpoints", () => {
        it("rejects non-camelCase endpoint name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("GetItems", "GET", "/items"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/Endpoint names must be camelCase/);
        });

        it("rejects injection in endpoint name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint('foo(){require("child_process")}//', "GET", "/items"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/Endpoint names must be camelCase/);
        });

        it("rejects non-camelCase parameter name", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "BadName",
                                        paramType: { type: "query", query: { paramId: "badName" } },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/camelCase/);
        });

        it("rejects multiple body params", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("create", "POST", "/items", [
                                    {
                                        argName: "body1",
                                        paramType: { type: "body" },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                    {
                                        argName: "body2",
                                        paramType: { type: "body" },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/multiple body parameters/);
        });

        it("rejects GET with body", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "body1",
                                        paramType: { type: "body" },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/GET and contain a body/);
        });

        it("validates header paramId format", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "authToken",
                                        paramType: { type: "header", header: { paramId: "X-Auth-Token" } },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects reserved protocol header paramId", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "contentType",
                                        paramType: { type: "header", header: { paramId: "Content-Type" } },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/protocol headers/);
        });

        it("rejects path params not matching template", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItem", "GET", "/items/{itemId}", [
                                    {
                                        argName: "wrongName",
                                        paramType: { type: "path" },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/path template/);
        });
    });

    describe("HTTP paths", () => {
        it("rejects path not starting with /", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "items"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/start with/);
        });

        it("rejects path ending with /", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items/"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/not end with/);
        });

        it("rejects injection in path", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", '/items";require("child_process")'),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/did not match/);
        });
    });

    describe("error definitions", () => {
        it("accepts valid error", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [makeError("MyError", "com.palantir.product", "Conjure", "INVALID_ARGUMENT")],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects invalid error code", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [makeError("MyError", "com.palantir.product", "Conjure", "MADE_UP")],
                    }),
                ),
            ).toThrow(/Invalid error code/);
        });

        it("rejects invalid namespace", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [makeError("MyError", "com.palantir.product", "bad_namespace", "INTERNAL")],
                    }),
                ),
            ).toThrow(/Namespace for errors/);
        });

        it("rejects injection in namespace", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [makeError("MyError", "com.palantir.product", 'Evil";\nprocess.exit(1)//', "INTERNAL")],
                    }),
                ),
            ).toThrow(/Namespace for errors/);
        });

        it("validates error arg field names", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [
                            makeError("MyError", "com.palantir.product", "Conjure", "INTERNAL", [
                                field('"; inject()//'),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/FieldName/);
        });

        it("rejects duplicate error arg names after normalization", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [
                            makeError(
                                "MyError",
                                "com.palantir.product",
                                "Conjure",
                                "INTERNAL",
                                [field("myField")],
                                [field("my-field")],
                            ),
                        ],
                    }),
                ),
            ).toThrow(/duplicate field names/);
        });
    });

    describe("recursive types", () => {
        it("rejects direct self-reference via alias", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            {
                                type: "alias",
                                alias: {
                                    typeName: { name: "SelfRef", package: "com.palantir.product" },
                                    alias: {
                                        type: "reference",
                                        reference: { name: "SelfRef", package: "com.palantir.product" },
                                    },
                                },
                            } as any,
                        ],
                    }),
                ),
            ).toThrow(/Recursive types/);
        });

        it("accepts container-wrapped self-reference (Tree with List<Tree>)", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            makeObject("Tree", "com.palantir.product", [
                                field("children", {
                                    type: "list",
                                    list: {
                                        itemType: {
                                            type: "reference",
                                            reference: { name: "Tree", package: "com.palantir.product" },
                                        },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("accepts optional self-reference", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            makeObject("Node", "com.palantir.product", [
                                field("next", {
                                    type: "optional",
                                    optional: {
                                        itemType: {
                                            type: "reference",
                                            reference: { name: "Node", package: "com.palantir.product" },
                                        },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("accepts set self-reference", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            makeObject("Graph", "com.palantir.product", [
                                field("neighbors", {
                                    type: "set",
                                    set: {
                                        itemType: {
                                            type: "reference",
                                            reference: { name: "Graph", package: "com.palantir.product" },
                                        },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("accepts map value self-reference", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            makeObject("Index", "com.palantir.product", [
                                field("entries", {
                                    type: "map",
                                    map: {
                                        keyType: { type: "primitive", primitive: "STRING" },
                                        valueType: {
                                            type: "reference",
                                            reference: { name: "Index", package: "com.palantir.product" },
                                        },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });
    });

    describe("nested optionals", () => {
        it("rejects optional of alias to optional", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            {
                                type: "alias",
                                alias: {
                                    typeName: { name: "OptAlias", package: "com.palantir.product" },
                                    alias: {
                                        type: "optional",
                                        optional: { itemType: { type: "primitive", primitive: "STRING" } },
                                    },
                                },
                            } as any,
                            makeObject("MyObj", "com.palantir.product", [
                                field("bad", {
                                    type: "optional",
                                    optional: {
                                        itemType: {
                                            type: "reference",
                                            reference: { name: "OptAlias", package: "com.palantir.product" },
                                        },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/Nested optionals/);
        });
    });

    describe("illegal map keys", () => {
        it("rejects complex map key in object field", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            makeObject("MyObj", "com.palantir.product", [
                                field("bad", {
                                    type: "map",
                                    map: {
                                        keyType: {
                                            type: "list",
                                            list: { itemType: { type: "primitive", primitive: "STRING" } },
                                        },
                                        valueType: { type: "primitive", primitive: "STRING" },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/Complex type not allowed in map key/);
        });

        it("rejects complex map key in union member", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            makeUnion("MyUnion", "com.palantir.product", [
                                field("bad", {
                                    type: "map",
                                    map: {
                                        keyType: {
                                            type: "list",
                                            list: { itemType: { type: "primitive", primitive: "STRING" } },
                                        },
                                        valueType: { type: "primitive", primitive: "STRING" },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/Complex type not allowed in map key/);
        });

        it("rejects map key that is an alias to a container type", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            {
                                type: "alias",
                                alias: {
                                    typeName: { name: "StringList", package: "com.palantir.product" },
                                    alias: {
                                        type: "list",
                                        list: { itemType: { type: "primitive", primitive: "STRING" } },
                                    },
                                },
                            } as any,
                            makeObject("MyObj", "com.palantir.product", [
                                field("bad", {
                                    type: "map",
                                    map: {
                                        keyType: {
                                            type: "reference",
                                            reference: { name: "StringList", package: "com.palantir.product" },
                                        },
                                        valueType: { type: "primitive", primitive: "STRING" },
                                    },
                                }),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/Complex type not allowed in map key/);
        });

        it("rejects complex map key in alias", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            {
                                type: "alias",
                                alias: {
                                    typeName: { name: "BadAlias", package: "com.palantir.product" },
                                    alias: {
                                        type: "map",
                                        map: {
                                            keyType: {
                                                type: "list",
                                                list: { itemType: { type: "primitive", primitive: "STRING" } },
                                            },
                                            valueType: { type: "primitive", primitive: "STRING" },
                                        },
                                    },
                                },
                            } as any,
                        ],
                    }),
                ),
            ).toThrow(/Complex type not allowed in map key/);
        });
    });

    describe("endpoint type validators", () => {
        it("rejects binary in non-body param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "file",
                                        paramType: { type: "query", query: { paramId: "file" } },
                                        type: { type: "primitive", primitive: "BINARY" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/binary.*any/i);
        });

        it("rejects bearer token in query param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "auth",
                                        paramType: { type: "query", query: { paramId: "auth" } },
                                        type: { type: "primitive", primitive: "BEARERTOKEN" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/bearertoken.*not allowed/i);
        });

        it("rejects complex path param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [makeObject("MyObj", "com.palantir.product", [field("name")])],
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItem", "GET", "/items/{itemId}", [
                                    {
                                        argName: "itemId",
                                        paramType: { type: "path" },
                                        type: {
                                            type: "reference",
                                            reference: { name: "MyObj", package: "com.palantir.product" },
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/Path parameters must be primitives/);
        });

        it("rejects list in header param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "tags",
                                        paramType: { type: "header", header: { paramId: "X-Tags" } },
                                        type: {
                                            type: "list",
                                            list: { itemType: { type: "primitive", primitive: "STRING" } },
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/header param.*must be/i);
        });

        it("accepts alias to optional<string> in header param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            {
                                type: "alias",
                                alias: {
                                    typeName: { name: "OptString", package: "com.palantir.product" },
                                    alias: {
                                        type: "optional",
                                        optional: { itemType: { type: "primitive", primitive: "STRING" } },
                                    },
                                },
                            } as any,
                        ],
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "token",
                                        paramType: { type: "header", header: { paramId: "X-Token" } },
                                        type: {
                                            type: "reference",
                                            reference: { name: "OptString", package: "com.palantir.product" },
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("accepts alias to list<string> in query param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        types: [
                            {
                                type: "alias",
                                alias: {
                                    typeName: { name: "StringList", package: "com.palantir.product" },
                                    alias: {
                                        type: "list",
                                        list: { itemType: { type: "primitive", primitive: "STRING" } },
                                    },
                                },
                            } as any,
                        ],
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "tags",
                                        paramType: { type: "query", query: { paramId: "tags" } },
                                        type: {
                                            type: "reference",
                                            reference: { name: "StringList", package: "com.palantir.product" },
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects ANY type in non-body param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "filter",
                                        paramType: { type: "query", query: { paramId: "filter" } },
                                        type: { type: "primitive", primitive: "ANY" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/binary.*any/i);
        });

        it("accepts set<string> in query param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "tags",
                                        paramType: { type: "query", query: { paramId: "tags" } },
                                        type: {
                                            type: "set",
                                            set: { itemType: { type: "primitive", primitive: "STRING" } },
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects map in query param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items", [
                                    {
                                        argName: "filters",
                                        paramType: { type: "query", query: { paramId: "filters" } },
                                        type: {
                                            type: "map",
                                            map: {
                                                keyType: { type: "primitive", primitive: "STRING" },
                                                valueType: { type: "primitive", primitive: "STRING" },
                                            },
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/query param.*must be/i);
        });

        it("rejects optional binary body", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("upload", "POST", "/upload", [
                                    {
                                        argName: "data",
                                        paramType: { type: "body" },
                                        type: {
                                            type: "optional",
                                            optional: { itemType: { type: "primitive", primitive: "BINARY" } },
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/optional.*binary/i);
        });

        it("rejects UNKNOWN http method", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("doThing", "UNKNOWN", "/things"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/must not be UNKNOWN/);
        });

        it("rejects duplicate endpoint errors", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                {
                                    endpointName: "getItems",
                                    httpMethod: "GET",
                                    httpPath: "/items",
                                    args: [],
                                    errors: [
                                        { error: { name: "NotFound", package: "com.palantir", namespace: "Conjure" } },
                                        { error: { name: "NotFound", package: "com.palantir", namespace: "Conjure" } },
                                    ],
                                },
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/declared multiple times/);
        });
    });

    describe("HTTP path edge cases", () => {
        it("accepts path with regex param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItem", "GET", "/items/{itemId:.+}", [
                                    {
                                        argName: "itemId",
                                        paramType: { type: "path" },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).not.toThrow();
        });

        it("rejects .* regex in non-last segment", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItem", "GET", "/items/{itemId:.*}/details", [
                                    {
                                        argName: "itemId",
                                        paramType: { type: "path" },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/only permitted in the last segment/);
        });

        it("rejects duplicate path param names", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItem", "GET", "/items/{itemId}/sub/{itemId}", [
                                    {
                                        argName: "itemId",
                                        paramType: { type: "path" },
                                        type: { type: "primitive", primitive: "STRING" },
                                    },
                                ]),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/appears more than once/);
        });

        it("rejects path template var without matching endpoint param", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItem", "GET", "/items/{itemId}"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/defined in path template but not present in endpoint/);
        });

        it("rejects invalid segment characters", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        services: [
                            makeService("MyService", "com.palantir.product", [
                                makeEndpoint("getItems", "GET", "/items/foo@bar"),
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/did not match/);
        });
    });

    describe("error safety declarations", () => {
        it("rejects error args with explicit safety", () => {
            expect(() =>
                validateConjureDefinition(
                    makeDef({
                        errors: [
                            makeError("MyError", "com.palantir.product", "Conjure", "INTERNAL", [
                                {
                                    fieldName: "message",
                                    type: { type: "primitive", primitive: "STRING" },
                                    safety: "SAFE",
                                },
                            ]),
                        ],
                    }),
                ),
            ).toThrow(/safety cannot be declared/);
        });
    });

    describe("docs sanitization", () => {
        it("neutralizes JSDoc breakout payload in docs", () => {
            const maliciousPayload = "*/;require('child_process').execSync('touch /tmp/PWNED');/*";
            const sanitized = sanitizeDocs(maliciousPayload);
            expect(sanitized).not.toContain("*/");
        });

        it("preserves normal docs content", () => {
            const normalDocs = "This is a normal documentation string.";
            expect(sanitizeDocs(normalDocs)).toBe(normalDocs);
        });

        it("handles docs with asterisks that are not breakouts", () => {
            const docs = "Returns a * b multiplied values";
            expect(sanitizeDocs(docs)).toBe(docs);
        });

        it("handles multiple breakout attempts", () => {
            const docs = "*/alert(1)/* and also */alert(2)/*";
            const sanitized = sanitizeDocs(docs);
            expect(sanitized).not.toContain("*/");
        });

        it("neutralizes breakout in deprecated field", () => {
            const maliciousDeprecated = "*/;require('child_process').execSync('touch /tmp/PWNED');/*";
            const sanitized = sanitizeDocs(maliciousDeprecated);
            expect(sanitized).not.toContain("*/");
        });
    });

    it("accepts empty definition", () => {
        expect(() => validateConjureDefinition(makeDef())).not.toThrow();
    });
});
