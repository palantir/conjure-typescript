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

import {
    IArgumentDefinition,
    IEndpointDefinition,
    IParameterType,
    IParameterType_Header,
    IParameterType_Query,
    IServiceDefinition,
    IType,
    ITypeDefinition,
} from "conjure-api";
import { MediaType } from "conjure-client";
import {
    CodeBlockWriter,
    ImportDeclarationStructure,
    MethodDeclarationStructure,
    MethodSignatureStructure,
    ParameterDeclarationStructure,
    Scope,
    StructureKind,
    VariableDeclarationKind,
} from "ts-morph";
import { ITypeGenerationFlags } from "../../types/typeGenerationFlags";
import { CONJURE_CLIENT_MODULE_SPECIFIER } from "../../utils/constants";
import { addDeprecatedToDocs, addIncubatingToDocs } from "../../utils/docsUtils";
import { resolveImports, resolveImportsForReferenceType, sortImports } from "../../utils/resolveImports";
import { resolveMediaType } from "../../utils/resolveMediaType";
import { resolveStringConversion } from "../../utils/resolveStringConversion";
import { resolveTsType } from "../../utils/resolveTsType";
import { SimpleAst } from "./simpleAst";

/** Types used in the generation of the service class. Expected to be provided by conjure-client */
const HTTP_API_BRIDGE_TYPE = "IHttpApiBridge";
const CONJURE_FAILURE_TYPE = "IConjureFailure";
const CONJURE_RESULT_TYPE = "IConjureResult";
const CONJURE_SUCCESS_TYPE = "IConjureSuccess";

/** Variable name used in the generation of the service class. */
const BRIDGE = "bridge";

/** Default imports used in the generation of the service class. */
const CONJURE_CLIENT_IMPORTS: ImportDeclarationStructure = {
    kind: StructureKind.ImportDeclaration,
    moduleSpecifier: CONJURE_CLIENT_MODULE_SPECIFIER,
    namedImports: [
        { name: CONJURE_FAILURE_TYPE },
        { name: CONJURE_RESULT_TYPE },
        { name: CONJURE_SUCCESS_TYPE },
        { name: HTTP_API_BRIDGE_TYPE },
    ],
    isTypeOnly: true,
};

const UNDEFINED_CONSTANT = "__undefined";

export function generateNonThrowingService(
    definition: IServiceDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
): Promise<void> {
    const sourceFile = simpleAst.createSourceFile({
        package: definition.serviceName.package,
        name: `${definition.serviceName.name}WithErrors`,
    });
    const endpointSignatures: MethodSignatureStructure[] = [];
    const endpointImplementations: MethodDeclarationStructure[] = [];
    const imports: ImportDeclarationStructure[] = [CONJURE_CLIENT_IMPORTS];

    sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        docs: ["Constant reference to `undefined` that we expect to get minified and therefore reduce total code size"],
        declarations: [{ name: UNDEFINED_CONSTANT, type: "undefined", initializer: "undefined" }],
    });

    definition.endpoints.forEach(endpointDefinition => {
        const parameters: ParameterDeclarationStructure[] = endpointDefinition.args
            .sort((a, b) => {
                const aIsOptional = IType.isOptional(a.type);
                const bIsOptional = IType.isOptional(b.type);
                // Maintain order except optional arguments are pushed to the back
                return aIsOptional && !bIsOptional ? 1 : !aIsOptional && bIsOptional ? -1 : 0;
            })
            .map(argDefinition => {
                const parameterType = resolveTsType(
                    argDefinition.type,
                    definition.serviceName,
                    knownTypes,
                    typeGenerationFlags,
                    true,
                    true,
                );

                imports.push(
                    ...resolveImports(argDefinition.type, definition.serviceName, knownTypes, typeGenerationFlags),
                );

                return {
                    kind: StructureKind.Parameter,
                    hasQuestionToken: IType.isOptional(argDefinition.type),
                    name: argDefinition.argName,
                    type: parameterType,
                };
            });

        let resultType = "void";
        if (endpointDefinition.returns != null) {
            resultType = resolveTsType(
                endpointDefinition.returns,
                definition.serviceName,
                knownTypes,
                typeGenerationFlags,
                false,
                true,
            );
            imports.push(
                ...resolveImports(endpointDefinition.returns, definition.serviceName, knownTypes, typeGenerationFlags),
            );
        }

        let docs = addDeprecatedToDocs(endpointDefinition);
        docs = addIncubatingToDocs(endpointDefinition, docs);

        endpointDefinition.errors?.forEach(error => {
            const errorImports = resolveImportsForReferenceType(
                {
                    name: error.error.name,
                    package: error.error.package,
                },
                definition.serviceName,
                knownTypes,
                typeGenerationFlags,
            ).map(i => ({ ...i, isTypeOnly: true }));
            imports.push(...errorImports);
        });

        const errorNames = endpointDefinition.errors?.map(error => `I${error.error.name}`) ?? [];
        if (errorNames.length === 0) {
            errorNames.push("never");
        }
        const errorsType = errorNames.join(" | ");

        const returnType = `IConjureResult<${resultType}, ${errorsType}>`;

        endpointSignatures.push({
            kind: StructureKind.MethodSignature,
            name: endpointDefinition.endpointName,
            parameters,
            returnType: `Promise<${returnType}>`,
            docs: docs != null ? [docs] : undefined,
        });
        endpointImplementations.push({
            kind: StructureKind.Method,
            statements: generateEndpointBody(
                definition.serviceName.name,
                endpointDefinition,
                resultType,
                errorsType,
                knownTypes,
            ),
            name: endpointDefinition.endpointName,
            parameters,
            returnType: `Promise<${returnType}>`,
            // this appears to be a no-op by ts-simple-ast, since default in typescript is public
            scope: Scope.Public,
            docs: docs != null ? [docs] : undefined,
        });
    });

    sourceFile.addImportDeclarations(sortImports(imports));

    const iface = sourceFile.addInterface({
        isExported: true,
        methods: endpointSignatures,
        name: `I${definition.serviceName.name}WithErrors`,
    });
    if (definition.docs != null) {
        iface.addJsDoc({ description: definition.docs });
    }

    sourceFile.addClass({
        ctors: [
            {
                parameters: [
                    {
                        name: BRIDGE,
                        scope: Scope.Private,
                        type: HTTP_API_BRIDGE_TYPE,
                    },
                ],
            },
        ],
        isExported: true,
        methods: endpointImplementations,
        name: `${definition.serviceName.name}WithErrors`,
        implements: [iface.getName()],
    });

    sourceFile.formatText();
    return sourceFile.save();
}

function generateEndpointBody(
    serviceName: string,
    endpointDefinition: IEndpointDefinition,
    resultType: string,
    errorsType: string,
    knownTypes: Map<string, ITypeDefinition>,
): (writer: CodeBlockWriter) => void {
    const bodyArgs: IArgumentDefinition[] = [];
    const headerArgs: IArgumentDefinition[] = [];
    const queryArgs: IArgumentDefinition[] = [];

    endpointDefinition.args.forEach(argDefinition => {
        if (IParameterType.isBody(argDefinition.paramType)) {
            bodyArgs.push(argDefinition);
        } else if (IParameterType.isHeader(argDefinition.paramType)) {
            headerArgs.push(argDefinition);
        } else if (IParameterType.isQuery(argDefinition.paramType)) {
            queryArgs.push(argDefinition);
        }
    });

    const pathParamsFromPath = parsePathParamsFromPath(endpointDefinition.httpPath);

    if (bodyArgs.length > 1) {
        throw Error("endpoint cannot have more than one body arg, found: " + bodyArgs.length);
    }

    const data = bodyArgs.length === 0 ? UNDEFINED_CONSTANT : bodyArgs[0].argName;
    // It's not quite correct to default to application/json for body less and return less requests.
    // We do this to preserve existing behaviour.
    const requestMediaType =
        bodyArgs.length === 0 ? MediaType.APPLICATION_JSON : resolveMediaType(bodyArgs[0].type, knownTypes);
    const responseMediaType =
        endpointDefinition.returns != null && endpointDefinition.returns != null
            ? resolveMediaType(endpointDefinition.returns, knownTypes)
            : MediaType.APPLICATION_JSON;
    const formattedHeaderArgs = headerArgs.map(argDefinition => {
        const paramId = (argDefinition.paramType as IParameterType_Header).header.paramId!;
        if (paramId == null) {
            throw Error("header arguments must define a 'param-id': " + argDefinition.argName);
        }
        const stringConversion = resolveStringConversion(argDefinition.type);
        return `"${paramId}": ${argDefinition.argName}${stringConversion},`;
    });
    const formattedQueryArgs = queryArgs.map(argDefinition => {
        const paramId = (argDefinition.paramType as IParameterType_Query).query.paramId;
        if (paramId == null) {
            throw Error("query arguments must define a 'param-id': " + argDefinition.argName);
        }
        return `"${paramId}": ${argDefinition.argName},`;
    });

    return writer => {
        writer
            .write(`return this.${BRIDGE}`)
            .writeLine(`.call<${resultType}>(`)
            .writeLine(`"${serviceName}",`)
            .writeLine(`"${endpointDefinition.endpointName}",`)
            .writeLine(`"${endpointDefinition.httpMethod}",`)
            .writeLine(`"${endpointDefinition.httpPath}",`)
            .writeLine(`${data},`);

        if (formattedHeaderArgs.length === 0) {
            writer.writeLine(`${UNDEFINED_CONSTANT},`);
        } else {
            writer.write("{");
            formattedHeaderArgs.forEach(formattedHeader => writer.indent().writeLine(formattedHeader));
            writer.writeLine("},");
        }

        if (formattedQueryArgs.length === 0) {
            writer.writeLine(`${UNDEFINED_CONSTANT},`);
        } else {
            writer.write("{");
            formattedQueryArgs.forEach(formattedQuery => writer.indent().writeLine(formattedQuery));
            writer.writeLine("},");
        }

        if (pathParamsFromPath.length === 0) {
            writer.writeLine(`${UNDEFINED_CONSTANT},`);
        } else {
            writer.write("[");
            pathParamsFromPath.forEach(pathArgName => writer.indent().writeLine(pathArgName + ","));
            writer.writeLine("],");
        }
        writer.writeLine(
            `${requestMediaType === MediaType.APPLICATION_JSON ? UNDEFINED_CONSTANT : `"${requestMediaType}"`},`,
        );
        writer.writeLine(
            `${responseMediaType === MediaType.APPLICATION_JSON ? UNDEFINED_CONSTANT : `"${responseMediaType}"`}`,
        );
        writer
            .write(")")
            .writeLine(`.then(result => ({ status: "success", result }) as IConjureSuccess<${resultType}>)`)
            .writeLine(`.catch(error => ({ status: "failure", error }) as IConjureFailure<${errorsType}>);`);
    };
}

function parsePathParamsFromPath(httpPath: string): string[] {
    // first fix up the path to remove any ':.+' stuff in path params
    const fixedPath = httpPath.replace(/{(.*):[^}]*}/, "{$1}");
    // follow-up by just pulling out any path segment with a starting '{' and trailing '}'
    return fixedPath
        .split("/")
        .filter(segment => segment.startsWith("{") && segment.endsWith("}"))
        .map(segment => segment.slice(1, -1));
}
