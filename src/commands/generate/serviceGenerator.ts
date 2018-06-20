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
    PrimitiveType,
} from "conjure-api";
import {
    CodeBlockWriter,
    ImportDeclarationStructure,
    MethodDeclarationStructure,
    ParameterDeclarationStructure,
    Scope,
} from "ts-simple-ast";
import { ImportsVisitor, sortImports } from "./imports";
import { SimpleAst } from "./simpleAst";
import { StringConversionTypeVisitor } from "./stringConversionTypeVisitor";
import { TsTypeVisitor } from "./tsTypeVisitor";
import { CONJURE_CLIENT } from "./utils";

/** Type used in the generation of the service class. Expected to be provided by conjure-client */
const HTTP_API_BRIDGE_TYPE = "IHttpApiBridge";
const MEDIA_TYPE = "MediaType";
/** Variable name used in the generation of the service class. */
const BRIDGE = "bridge";
const HTTP_API_BRIDGE_IMPORT = {
    moduleSpecifier: CONJURE_CLIENT,
    namedImports: [{ name: HTTP_API_BRIDGE_TYPE }],
};
const MEDIA_TYPE_IMPORT = {
    moduleSpecifier: CONJURE_CLIENT,
    namedImports: [{ name: MEDIA_TYPE }],
};

export function generateService(
    definition: IServiceDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
): Promise<void> {
    const sourceFile = simpleAst.createSourceFile(definition.serviceName);
    const tsTypeVisitor = new TsTypeVisitor(knownTypes, definition.serviceName);
    const importsVisitor = new ImportsVisitor(knownTypes, definition.serviceName);

    const endpointSignatures: MethodDeclarationStructure[] = [];
    const endpointImplementations: MethodDeclarationStructure[] = [];
    const imports: ImportDeclarationStructure[] = [HTTP_API_BRIDGE_IMPORT, MEDIA_TYPE_IMPORT];
    definition.endpoints.forEach(endpointDefinition => {
        const parameters: ParameterDeclarationStructure[] = endpointDefinition.args
            .sort((a, b) => {
                const aIsOptional = IType.isOptional(a.type);
                const bIsOptional = IType.isOptional(b.type);
                // Maintain order except optional arguments are pushed to the back
                return aIsOptional && !bIsOptional ? 1 : !aIsOptional && bIsOptional ? -1 : 0;
            })
            .map(argDefinition => {
                const argType = IType.visit(argDefinition.type, tsTypeVisitor);
                imports.push(...IType.visit(argDefinition.type, importsVisitor));
                return {
                    hasQuestionToken: IType.isOptional(argDefinition.type),
                    name: argDefinition.argName,
                    type: argType,
                };
            });

        let returnTsType = "void";
        if (endpointDefinition.returns != null) {
            returnTsType = IType.visit(endpointDefinition.returns, tsTypeVisitor);
            imports.push(...IType.visit(endpointDefinition.returns, importsVisitor));
        }

        const signature: MethodDeclarationStructure = {
            name: endpointDefinition.endpointName,
            parameters,
            returnType: `Promise<${returnTsType}>`,
        };
        if (endpointDefinition.docs != null) {
            signature.docs = [{ description: endpointDefinition.docs }];
        }
        endpointSignatures.push(signature);

        endpointImplementations.push({
            bodyText: generateEndpointBody(endpointDefinition, returnTsType, endpointDefinition.returns || undefined),
            name: endpointDefinition.endpointName,
            parameters,
            returnType: `Promise<${returnTsType}>`,
            // this appears to be a no-op by ts-simple-ast, since default in typescript is public
            scope: Scope.Public,
        });
    });

    if (imports.length !== 0) {
        sourceFile.addImportDeclarations(sortImports(imports));
    }

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

    sourceFile.formatText();
    return sourceFile.save();
}

function generateEndpointBody(
    endpointDefinition: IEndpointDefinition,
    returnTsType: string,
    returnType?: IType,
): (writer: CodeBlockWriter) => void {
    const bodyArgs: IArgumentDefinition[] = [];
    const pathArgNames: string[] = [];
    const headerArgs: IArgumentDefinition[] = [];
    const queryArgs: IArgumentDefinition[] = [];

    endpointDefinition.args.forEach(argDefinition => {
        if (IParameterType.isBody(argDefinition.paramType)) {
            bodyArgs.push(argDefinition);
        } else if (IParameterType.isPath(argDefinition.paramType)) {
            pathArgNames.push(argDefinition.argName);
        } else if (IParameterType.isHeader(argDefinition.paramType)) {
            headerArgs.push(argDefinition);
        } else if (IParameterType.isQuery(argDefinition.paramType)) {
            queryArgs.push(argDefinition);
        }
    });

    if (bodyArgs.length > 1) {
        throw Error("endpoint cannot have more than one body arg, found: " + bodyArgs.length);
    }
    const data = bodyArgs.length === 0 ? "undefined" : bodyArgs[0].argName;
    const bodyType = bodyArgs.length === 0 ? undefined : bodyArgs[0].type;
    const formattedHeaderArgs = headerArgs.map(argDefinition => {
        const paramId = (argDefinition.paramType as IParameterType_Header).header.paramId!;
        if (paramId == null) {
            throw Error("header arguments must define a 'param-id': " + argDefinition.argName);
        }
        const stringConversion = IType.visit(argDefinition.type, new StringConversionTypeVisitor());
        return `"${paramId}": ${argDefinition.argName}${stringConversion},`;
    });
    const formattedQueryArgs = queryArgs.map(argDefinition => {
        const paramId = (argDefinition.paramType as IParameterType_Query).query.paramId;
        if (paramId == null) {
            throw Error("query arguments must define a 'param-id': " + argDefinition.argName);
        }
        return `"${paramId}": ${argDefinition.argName},`;
    });
    const requestMediaType = mediaType(bodyType);
    const responseMediaType = mediaType(returnType);

    return writer => {
        writer.write(`return this.${BRIDGE}.callEndpoint<${returnTsType}>(`).inlineBlock(() => {
            writer.writeLine(`data: ${data},`);
            writer.writeLine(`endpointName: "${endpointDefinition.endpointName}",`);
            writer.writeLine(`endpointPath: "${endpointDefinition.httpPath}",`);

            writer.write("headers: {");
            formattedHeaderArgs.forEach(formattedHeader => writer.indent().writeLine(formattedHeader));
            writer.writeLine("},");

            writer.writeLine(`method: "${endpointDefinition.httpMethod}",`);

            writer.write("pathArguments: [");
            pathArgNames.forEach(pathArgName => writer.indent().writeLine(pathArgName + ","));
            writer.writeLine("],");

            writer.write("queryArguments: {");
            formattedQueryArgs.forEach(formattedQuery => writer.indent().writeLine(formattedQuery));
            writer.writeLine("},");

            writer.writeLine(`requestMediaType: ${requestMediaType},`);

            writer.writeLine(`responseMediaType: ${responseMediaType},`);
        });
        writer.write(");");
    };
}

function mediaType(conjureType?: IType) {
    if (conjureType != null && IType.isPrimitive(conjureType) && conjureType.primitive === PrimitiveType.BINARY) {
        return "MediaType.APPLICATION_OCTET_STREAM";
    }
    return "MediaType.APPLICATION_JSON";
}
