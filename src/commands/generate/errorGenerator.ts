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

import { IErrorDefinition, IExternalReference, IType, ITypeDefinition } from "conjure-api";
import { ImportDeclarationStructure } from "ts-morph";
import { ImportsVisitor, sortImports } from "./imports";
import { SimpleAst } from "./simpleAst";
import { TsReturnTypeVisitor } from "./tsReturnTypeVisitor";
import { ITypeGenerationFlags } from "./typeGenerationFlags";
import { doubleQuote, singleQuote } from "./utils";

export function generateError(
    definition: IErrorDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    externalImports: Map<string, IExternalReference>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
): Promise<void> {
    const sourceFile = simpleAst.createSourceFile(definition.errorName);
    const interfaceName = "I" + definition.errorName.name;
    const errorName = `${definition.namespace}:${definition.errorName.name}`;
    const tsTypeVisitor = new TsReturnTypeVisitor(knownTypes, externalImports, definition.errorName, false, typeGenerationFlags);
    const importsVisitor = new ImportsVisitor(knownTypes, externalImports, definition.errorName, typeGenerationFlags);
    const imports: ImportDeclarationStructure[] = [];

    const args = definition.safeArgs.concat(definition.unsafeArgs);
    const properties = args.reduce((acc, arg) => {
        imports.push(...IType.visit(arg.type, importsVisitor));
        return acc + `${arg.fieldName}: ${IType.visit(arg.type, tsTypeVisitor)};\n`;
    }, "");

    if (imports.length !== 0) {
        sourceFile.addImportDeclarations(sortImports(imports));
    }

    sourceFile.addInterface({
        isExported: true,
        name: interfaceName,
        properties: [
            {
                name: singleQuote("errorCode"),
                type: doubleQuote(definition.code),
                isReadonly: typeGenerationFlags.readonlyInterfaces,
            },
            {
                name: singleQuote("errorInstanceId"),
                type: "string",
                isReadonly: typeGenerationFlags.readonlyInterfaces,
            },
            {
                name: singleQuote("errorName"),
                type: doubleQuote(errorName),
                isReadonly: typeGenerationFlags.readonlyInterfaces,
            },
            {
                name: singleQuote("parameters"),
                type: `{\n${properties}}`,
                isReadonly: typeGenerationFlags.readonlyInterfaces,
            },
        ],
    });

    sourceFile.addFunction({
        statements: `return arg && arg.errorName === "${errorName}";`,
        isExported: true,
        name: "is" + definition.errorName.name,
        parameters: [
            {
                name: "arg",
                type: "any",
            },
        ],
        returnType: `arg is ${interfaceName}`,
    });

    sourceFile.formatText();
    return sourceFile.save();
}
