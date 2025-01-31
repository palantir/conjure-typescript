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
import { addDeprecatedToDocs, addErrorsToDocs, addIncubatingToDocs } from "../../utils/docsUtils";
import { combineImports, resolveImports, resolveImportsForReferenceType } from "../../utils/resolveImports";
import { resolveMediaType } from "../../utils/resolveMediaType";
import { resolveStringConversion } from "../../utils/resolveStringConversion";
import { resolveTsType } from "../../utils/resolveTsType";
import { SimpleAst } from "./simpleAst";

/** Type used in the generation of the service class. Expected to be provided by conjure-client */
const HTTP_API_BRIDGE_TYPE = "IHttpApiBridge";
/** Variable name used in the generation of the service class. */
const BRIDGE = "bridge";
const HTTP_API_BRIDGE_IMPORT: ImportDeclarationStructure = {
    kind: StructureKind.ImportDeclaration,
    moduleSpecifier: CONJURE_CLIENT_MODULE_SPECIFIER,
    namedImports: [{ name: HTTP_API_BRIDGE_TYPE }],
};

const UNDEFINED_CONSTANT = "__undefined";

export const generateService = async (
    definition: IServiceDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
): Promise<void> => {
    const sourceFile = simpleAst.createSourceFile(definition.serviceName);

    const endpointSignatures: MethodSignatureStructure[] = [];
    const endpointImplementations: MethodDeclarationStructure[] = [];
    const imports: ImportDeclarationStructure[] = [HTTP_API_BRIDGE_IMPORT];
    if (sourceFile.getVariableDeclaration(UNDEFINED_CONSTANT) == null) {
        sourceFile.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const,
            docs: [
                "Constant reference to `undefined` that we expect to get minified and therefore reduce total code size",
            ],
            declarations: [{ name: UNDEFINED_CONSTANT, type: "undefined", initializer: "undefined" }],
        });
    }
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

        let returnTsType = "void";
        if (endpointDefinition.returns != null) {
            returnTsType = resolveTsType(
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

        const signature: MethodSignatureStructure = {
            kind: StructureKind.MethodSignature,
            name: endpointDefinition.endpointName,
            parameters,
            returnType: `Promise<${returnTsType}>`,
        };
        let docs = addDeprecatedToDocs(endpointDefinition);
        docs = addIncubatingToDocs(endpointDefinition, docs);
        docs = addErrorsToDocs(endpointDefinition, docs);
        if (docs != null) {
            signature.docs = [docs];
        }
        endpointSignatures.push(signature);

        endpointImplementations.push({
            kind: StructureKind.Method,
            statements: generateEndpointBody(definition.serviceName.name, endpointDefinition, returnTsType, knownTypes),
            name: endpointDefinition.endpointName,
            parameters,
            returnType: `Promise<${returnTsType}>`,
            // this appears to be a no-op by ts-simple-ast, since default in typescript is public
            scope: Scope.Public,
            docs: docs != null ? [docs] : undefined,
        });

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
    });

    combineImports(sourceFile, imports);

    const iface = sourceFile.addInterface({
        isExported: true,
        methods: endpointSignatures,
        name: "I" + definition.serviceName.name,
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
        name: definition.serviceName.name,
    });

    sourceFile.formatText({ trimTrailingWhitespace: true });
    return sourceFile.save();
};

const generateEndpointBody = (
    serviceName: string,
    endpointDefinition: IEndpointDefinition,
    returnTsType: string,
    knownTypes: Map<string, ITypeDefinition>,
): ((writer: CodeBlockWriter) => void) => {
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
            .write(`return this.${BRIDGE}.call<${returnTsType}>(`)
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
        writer.write(");");
    };
};

function parsePathParamsFromPath(httpPath: string): string[] {
    // first fix up the path to remove any ':.+' stuff in path params
    const fixedPath = httpPath.replace(/{(.*):[^}]*}/, "{$1}");
    // follow-up by just pulling out any path segment with a starting '{' and trailing '}'
    return fixedPath
        .split("/")
        .filter(segment => segment.startsWith("{") && segment.endsWith("}"))
        .map(segment => segment.slice(1, -1));
}
