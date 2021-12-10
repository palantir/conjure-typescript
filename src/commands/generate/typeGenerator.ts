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
    IAliasDefinition,
    IEnumDefinition,
    IObjectDefinition,
    IType,
    ITypeDefinition,
    IUnionDefinition,
} from "conjure-api";
import {
    FunctionDeclarationStructure,
    ImportDeclarationStructure,
    InterfaceDeclarationStructure,
    ObjectLiteralExpression,
    PropertySignatureStructure,
    VariableDeclarationKind,
} from "ts-simple-ast";
import { ImportsVisitor, sortImports } from "./imports";
import { SimpleAst } from "./simpleAst";
import { TsReturnTypeVisitor } from "./tsReturnTypeVisitor";
import { ITypeGenerationFlags } from "./typeGenerationFlags";
import { addDeprecatedToDocs, doubleQuote, isFlavorizable, isValidFunctionName, singleQuote } from "./utils";


export function generateType(
    definition: ITypeDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
): Promise<void> {
    if (ITypeDefinition.isAlias(definition)) {
        return generateAlias(definition.alias, knownTypes, simpleAst, typeGenerationFlags);
    } else if (ITypeDefinition.isEnum(definition)) {
        return generateEnum(definition.enum, simpleAst);
    } else if (ITypeDefinition.isObject(definition)) {
        return generateObject(definition.object, knownTypes, simpleAst, typeGenerationFlags);
    } else if (ITypeDefinition.isUnion(definition)) {
        return generateUnion(definition.union, knownTypes, simpleAst, typeGenerationFlags);
    } else {
        throw Error("unsupported type: " + definition);
    }
}

/**
 * Generates a file of the following format:
 * ```
 *  export type ExampleAlias = string & {
 *     __conjure_flavor_type?: "_flavor_ExampleAlias";
 *  };
 * ```
 */
const FLAVOR_TYPE_FIELD = "__conjure_type";
export async function generateAlias(
    definition: IAliasDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
): Promise<void> {
    if (isFlavorizable(definition.alias, typeGenerationFlags.shouldFlavorizeAliasWhenPossible)) {
        const tsTypeVisitor = new TsReturnTypeVisitor(knownTypes, definition.typeName, false, typeGenerationFlags);
        const fieldType = IType.visit(definition.alias, tsTypeVisitor);
        const sourceFile = simpleAst.createSourceFile(definition.typeName);
        const typeAlias = sourceFile.addTypeAlias({
            isExported: true,
            name: "I" + definition.typeName.name,
            type: `${fieldType} & { ${FLAVOR_TYPE_FIELD}?: "${definition.typeName.name}" }`,
        });
        if (definition.docs) {
            typeAlias.addJsDoc(definition.docs);
        }
        sourceFile.formatText();
        return sourceFile.save();
    }
}

/**
 * Generates a file of the following format:
 * ```
 * export namespace EnumExample {
 *     export type ONE = "ONE";
 *     export type TWO = "TWO";
 *
 *     export const ONE = "ONE" as "ONE";
 *     export const TWO = "TWO" as "TWO";
 * }
 * export type EnumExample = keyof typeof EnumExample;
 * ```
 *
 * We do not use TypeScript Enums because they can not be assigned to an equivalent enum, making interop across
 * libraries more difficult
 */
export async function generateEnum(definition: IEnumDefinition, simpleAst: SimpleAst): Promise<void> {
    const sourceFile = simpleAst.createSourceFile(definition.typeName);

    if (definition.values.length > 0) {
        const namespaceDefinition = sourceFile.addNamespace({
            isExported: true,
            name: definition.typeName.name,
            typeAliases: definition.values.map(enumValue => ({
                isExported: true,
                name: enumValue.value,
                type: doubleQuote(enumValue.value),
                docs: addDeprecatedToDocs(enumValue),
            })),
            bodyText: writer => {
                definition.values.forEach(({ value }) => {
                    const quotedValue = doubleQuote(value);
                    writer.writeLine(`export const ${value} = ${quotedValue} as ${quotedValue};`);
                });
            },
        });
        if (definition.docs != null) {
            namespaceDefinition.addJsDoc(definition.docs);
        }
        sourceFile.addTypeAlias({
            isExported: true,
            name: definition.typeName.name,
            type: `keyof typeof ${definition.typeName.name}`,
        });
    } else {
        // We need to special case empty enums for two reasons:
        // 1) `keyof typeof MyEnum` results in an erorr
        // 2) Typescript won't generate `const MyEnum = {}` and will instead just skip it from the compiled code.
        const variableStatement = sourceFile.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const,
            declarations: [
                {
                    initializer: "{}",
                    name: definition.typeName.name,
                },
            ],
            isExported: true,
        });
        if (definition.docs != null) {
            variableStatement.addJsDoc(definition.docs);
        }
        sourceFile.addTypeAlias({
            isExported: true,
            name: definition.typeName.name,
            // We use void instead of never because void can't be assigned to anything else
            // (while never is assignable to anything)
            type: "void",
        });
    }

    sourceFile.formatText();
    return sourceFile.save();
}

/**
 * Generates a file of the following format:
 * ```
 * import {IAnotherObject} from "./anotherObject"
 * export interface ObjectExample {
 *     'field1': string;
 *     'field2': IAnotherObject;
 * }
 * ```
 */
export async function generateObject(
    definition: IObjectDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags
) {
    const tsTypeVisitor = new TsReturnTypeVisitor(knownTypes, definition.typeName, false, typeGenerationFlags);
    const importsVisitor = new ImportsVisitor(knownTypes, definition.typeName, typeGenerationFlags);
    const properties: PropertySignatureStructure[] = [];
    const imports: ImportDeclarationStructure[] = [];
    definition.fields.forEach(fieldDefinition => {
        const fieldType = IType.visit(fieldDefinition.type, tsTypeVisitor);

        const property: PropertySignatureStructure = {
            hasQuestionToken: IType.isOptional(fieldDefinition.type),
            name: singleQuote(fieldDefinition.fieldName),
            type: fieldType,
            docs: addDeprecatedToDocs(fieldDefinition),
        };

        properties.push(property);

        imports.push(...IType.visit(fieldDefinition.type, importsVisitor));
    });

    const sourceFile = simpleAst.createSourceFile(definition.typeName);
    if (imports.length !== 0) {
        sourceFile.addImportDeclarations(sortImports(imports));
    }
    const iface = sourceFile.addInterface({
        isExported: true,
        name: "I" + definition.typeName.name,
        properties,
    });
    if (definition.docs !== undefined && definition.docs !== null) {
        iface.addJsDoc({ description: definition.docs });
    }

    sourceFile.formatText();
    return sourceFile.save();
}

/** Variable name used in the generation of the union type visitor function. */
const obj = "obj";
/** Variable name used in the generation of the union type visitor function. */
const visitor = "visitor";

export async function generateUnion(
    definition: IUnionDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags
) {
    const unionTsType = "I" + definition.typeName.name;
    const unionSourceFileInput = processUnionMembers(unionTsType, definition, knownTypes, typeGenerationFlags);

    const sourceFile = simpleAst.createSourceFile(definition.typeName);
    if (unionSourceFileInput.imports.length !== 0) {
        sourceFile.addImportDeclarations(sortImports(unionSourceFileInput.imports));
    }
    sourceFile.addInterfaces(unionSourceFileInput.memberInterfaces);
    sourceFile.addFunctions(unionSourceFileInput.functions);

    sourceFile.addTypeAlias({
        docs: definition.docs != null ? [{ description: definition.docs }] : undefined,
        isExported: true,
        name: unionTsType,
        type: unionSourceFileInput.memberInterfaces.map(iface => iface.name).join(" | "),
    });

    const visitorInterface = sourceFile.addInterface({
        isExported: true,
        name: unionTsType + "Visitor",
        properties: unionSourceFileInput.visitorProperties,
        typeParameters: [{ name: "T" }],
    });

    sourceFile.addFunction({
        bodyText: unionSourceFileInput.visitorStatements.join("\n"),
        name: "visit",
        parameters: [
            {
                name: "obj",
                type: unionTsType,
            },
            {
                name: "visitor",
                type: visitorInterface.getName() + "<T>",
            },
        ],
        returnType: "T",
        typeParameters: [{ name: "T" }],
    });

    const variableStatement = sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
            {
                initializer: "{}",
                name: unionTsType,
            },
        ],
        isExported: true,
    });
    const objectLiteralExpr = variableStatement.getDeclarations()[0].getInitializer() as ObjectLiteralExpression;
    sourceFile.getFunctions().forEach(f => {
        objectLiteralExpr.addPropertyAssignment({
            initializer: f.getName(),
            name: f.getName(),
        });
    });

    sourceFile.formatText();
    return sourceFile.save();
}

function processUnionMembers(
    unionTsType: string,
    definition: IUnionDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags
) {
    const tsTypeVisitor = new TsReturnTypeVisitor(knownTypes, definition.typeName, false, typeGenerationFlags);
    const importsVisitor = new ImportsVisitor(knownTypes, definition.typeName, typeGenerationFlags);

    const imports: ImportDeclarationStructure[] = [];
    const visitorProperties: PropertySignatureStructure[] = [];
    const memberInterfaces: InterfaceDeclarationStructure[] = [];
    const functions: FunctionDeclarationStructure[] = [];
    const visitorStatements: string[] = [];

    definition.union.forEach(fieldDefinition => {
        const memberName = fieldDefinition.fieldName;
        const fieldType = IType.visit(fieldDefinition.type, tsTypeVisitor);
        imports.push(...IType.visit(fieldDefinition.type, importsVisitor));

        const interfaceName = `${unionTsType}_${uppercase(memberName)}`;

        memberInterfaces.push({
            docs: addDeprecatedToDocs(fieldDefinition),
            isExported: true,
            name: interfaceName,
            properties: [
                {
                    name: singleQuote(memberName),
                    type: fieldType,
                },
                {
                    name: singleQuote("type"),
                    type: doubleQuote(memberName),
                },
            ],
        });

        const typeGuard = {
            bodyText: `return (obj.type === "${memberName}");`,
            name: "is" + uppercase(memberName),
            parameters: [
                {
                    name: "obj",
                    type: unionTsType,
                },
            ],
            returnType: `obj is ${interfaceName}`,
        };
        functions.push(typeGuard);

        // factory
        const factoryName = isValidFunctionName(memberName) ? memberName + "_" : memberName;
        functions.push({
            bodyText: `return {
                ${memberName}: obj,
                type: ${doubleQuote(memberName)},
            };`,
            // TODO(gracew): ensure that memberName is lowercase?
            name: factoryName,
            parameters: [
                {
                    name: "obj",
                    type: fieldType,
                },
            ],
            returnType: interfaceName,
            // deprecate creation of deprecated types
            docs:
                fieldDefinition.deprecated !== null && fieldDefinition.deprecated !== undefined
                    ? [`@deprecated ${fieldDefinition.deprecated}`]
                    : undefined,
        });

        visitorProperties.push({
            name: singleQuote(memberName),
            type: `(obj: ${fieldType}) => T`,
        });
        visitorStatements.push(`if (${typeGuard.name}(${obj})) {
            return ${visitor}.${memberName}(${obj}.${memberName});
        }`);
    });

    visitorProperties.push({
        name: singleQuote("unknown"),
        type: `(obj: ${unionTsType}) => T`,
    });
    visitorStatements.push(`return ${visitor}.unknown(${obj});`);

    return {
        functions,
        imports,
        memberInterfaces,
        visitorProperties,
        visitorStatements,
    };
}

function uppercase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
