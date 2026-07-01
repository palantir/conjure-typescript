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
    ITypeName,
    IUnionDefinition,
} from "conjure-api";
import {
    FunctionDeclarationStructure,
    ImportDeclarationStructure,
    InterfaceDeclarationStructure,
    ModuleDeclarationKind,
    ObjectLiteralExpression,
    PropertySignatureStructure,
    StructureKind,
    TypeAliasDeclarationStructure,
    VariableDeclarationKind,
    VariableStatementStructure,
} from "ts-morph";
import { ITypeGenerationFlags } from "../../../types/typeGenerationFlags";
import { buildFromJsonFieldExpr } from "../../../utils/buildFromJsonExpr";
import { addDeprecatedToDocs } from "../../../utils/docsUtils";
import { relativePath } from "../../../utils/fileUtils";
import { isFlavorizable } from "../../../utils/flavorizingUtils";
import { isValidFunctionName } from "../../../utils/functionUtils";
import { createHashableTypeName } from "../../../utils/hashingUtils";
import { doubleQuote, singleQuote } from "../../../utils/quotesUtils";
import { resolveImports, sortImports } from "../../../utils/resolveImports";
import { resolveJsonTsType } from "../../../utils/resolveJsonTsType";
import { resolveTsType } from "../../../utils/resolveTsType";
import { SimpleAst } from "../simpleAst";

/** Returns true when JSON interfaces should be generated (any of the three flags is set). */
function shouldGenerateJsonTypes(flags: ITypeGenerationFlags): boolean {
    return flags.generateJsonTypes || flags.generateFromJson || flags.applyFromJson;
}

/** Returns true when fromJson functions should be generated. */
function shouldGenerateFromJson(flags: ITypeGenerationFlags): boolean {
    return flags.generateFromJson || flags.applyFromJson;
}

export function generateType(
    definition: ITypeDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
): Promise<void> {
    if (ITypeDefinition.isAlias(definition)) {
        return generateAlias(definition.alias, knownTypes, simpleAst, typeGenerationFlags);
    } else if (ITypeDefinition.isEnum(definition)) {
        return generateEnum(definition.enum, simpleAst, typeGenerationFlags);
    } else if (ITypeDefinition.isObject(definition)) {
        return generateObject(definition.object, knownTypes, simpleAst, typeGenerationFlags);
    } else if (ITypeDefinition.isUnion(definition)) {
        return generateUnion(definition.union, knownTypes, simpleAst, typeGenerationFlags);
    } else {
        throw Error("unsupported type: " + definition);
    }
}

const FLAVOR_TYPE_FIELD = "__conjure_type";
const FLAVOR_PACKAGE_FIELD = "__conjure_package";

/**
 * Generates a file of the following format:
 * ```
 *  export type ExampleAlias = string & {
 *     __conjure_type?: "ExampleAlias";
 *     __conjure_package?: "com.palantir.product";
 *  };
 * ```
 */
export async function generateAlias(
    definition: IAliasDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    simpleAst: SimpleAst,
    typeGenerationFlags: ITypeGenerationFlags,
): Promise<void> {
    if (isFlavorizable(definition.alias, typeGenerationFlags.flavorizedAliases)) {
        const fieldType = resolveTsType(
            definition.alias,
            definition.typeName,
            knownTypes,
            typeGenerationFlags,
            false,
            false,
        );
        const sourceFile = simpleAst.createSourceFile(definition.typeName);
        const typeAlias = sourceFile.addTypeAlias({
            isExported: true,
            name: "I" + definition.typeName.name,
            type: [
                `${fieldType} & {`,
                `\t${FLAVOR_TYPE_FIELD}?: "${definition.typeName.name}",`,
                `\t${FLAVOR_PACKAGE_FIELD}?: "${definition.typeName.package}",`,
                "}",
            ].join("\n"),
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
export async function generateEnum(
    definition: IEnumDefinition,
    simpleAst: SimpleAst,
    typeGenerationFlags?: ITypeGenerationFlags,
): Promise<void> {
    const sourceFile = simpleAst.createSourceFile(definition.typeName);

    if (definition.values.length > 0) {
        const typeAliases = definition.values.map<TypeAliasDeclarationStructure>(enumValue => {
            const docs = addDeprecatedToDocs(enumValue);
            return {
                kind: StructureKind.TypeAlias,
                isExported: true,
                name: enumValue.value,
                type: doubleQuote(enumValue.value),
                docs: docs != null ? [docs] : undefined,
            };
        });
        typeAliases[typeAliases.length - 1].trailingTrivia = `\n\n`;
        const variableDeclarations = definition.values.map<VariableStatementStructure>(enumValue => ({
            kind: StructureKind.VariableStatement,
            isExported: true,
            declarationKind: VariableDeclarationKind.Const,
            declarations: [
                {
                    name: enumValue.value,
                    initializer: `${doubleQuote(enumValue.value)} as ${doubleQuote(enumValue.value)}`,
                },
            ],
        }));

        const namespaceDefinition = sourceFile.addModule({
            kind: StructureKind.Module,
            declarationKind: ModuleDeclarationKind.Namespace,
            isExported: true,
            name: definition.typeName.name,
            statements: [...typeAliases, ...variableDeclarations],
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
        // 1) `keyof typeof MyEnum` results in an error
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
    typeGenerationFlags: ITypeGenerationFlags,
) {
    const properties: PropertySignatureStructure[] = [];
    const imports: ImportDeclarationStructure[] = [];
    definition.fields.forEach(fieldDefinition => {
        const fieldType = resolveTsType(
            fieldDefinition.type,
            definition.typeName,
            knownTypes,
            typeGenerationFlags,
            false,
            false,
        );
        const docs = addDeprecatedToDocs(fieldDefinition);

        const property: PropertySignatureStructure = {
            kind: StructureKind.PropertySignature,
            hasQuestionToken: IType.isOptional(fieldDefinition.type),
            name: singleQuote(fieldDefinition.fieldName),
            type: fieldType,
            docs: docs != null ? [docs] : undefined,
            isReadonly: typeGenerationFlags.readonlyInterfaces,
        };

        properties.push(property);
        imports.push(...resolveImports(fieldDefinition.type, definition.typeName, knownTypes, typeGenerationFlags));
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
    if (definition.docs != null && definition.docs != null) {
        iface.addJsDoc({ description: definition.docs });
    }

    if (shouldGenerateJsonTypes(typeGenerationFlags)) {
        addJsonInterface(sourceFile, definition, knownTypes, typeGenerationFlags);
    }

    if (shouldGenerateFromJson(typeGenerationFlags)) {
        addFromJsonFunction(sourceFile, definition, knownTypes, typeGenerationFlags);
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
    typeGenerationFlags: ITypeGenerationFlags,
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
        type:
            unionSourceFileInput.memberInterfaces.length === 0
                ? "unknown"
                : unionSourceFileInput.memberInterfaces.map(iface => iface.name).join(" | "),
    });

    const visitorInterface = sourceFile.addInterface({
        isExported: true,
        name: unionTsType + "Visitor",
        properties: unionSourceFileInput.visitorProperties,
        typeParameters: [{ name: "T" }],
    });

    sourceFile.addFunction({
        statements: unionSourceFileInput.visitorStatements.join("\n"),
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
        const name = f.getName();
        if (name == null) throw new Error("Name == null! We assign the name above. This should never happen.");
        objectLiteralExpr.addPropertyAssignment({
            initializer: name,
            name,
        });
    });

    if (shouldGenerateJsonTypes(typeGenerationFlags)) {
        addUnionJsonType(sourceFile, definition, knownTypes, typeGenerationFlags);
    }

    if (shouldGenerateFromJson(typeGenerationFlags)) {
        addUnionFromJsonFunction(sourceFile, definition, knownTypes, typeGenerationFlags);
    }

    sourceFile.formatText();
    return sourceFile.save();
}

function processUnionMembers(
    unionTsType: string,
    definition: IUnionDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
) {
    const imports: ImportDeclarationStructure[] = [];
    const visitorProperties: PropertySignatureStructure[] = [];
    const memberInterfaces: InterfaceDeclarationStructure[] = [];
    const functions: FunctionDeclarationStructure[] = [];
    const visitorCaseStatements: string[] = [];

    definition.union.forEach(fieldDefinition => {
        const memberName = fieldDefinition.fieldName;
        const fieldType = resolveTsType(
            fieldDefinition.type,
            definition.typeName,
            knownTypes,
            typeGenerationFlags,
            false,
            false,
        );
        imports.push(...resolveImports(fieldDefinition.type, definition.typeName, knownTypes, typeGenerationFlags));

        const interfaceName = `${unionTsType}_${capitalize(memberName)}`;
        const docs = addDeprecatedToDocs(fieldDefinition);

        memberInterfaces.push({
            kind: StructureKind.Interface,
            docs: docs != null ? [docs] : undefined,
            isExported: true,
            name: interfaceName,
            properties: [
                {
                    name: singleQuote(memberName),
                    type: fieldType,
                    isReadonly: typeGenerationFlags.readonlyInterfaces,
                },
                {
                    name: singleQuote("type"),
                    type: doubleQuote(memberName),
                    isReadonly: typeGenerationFlags.readonlyInterfaces,
                },
            ],
        });

        const typeGuard: FunctionDeclarationStructure = {
            kind: StructureKind.Function,
            statements: `return (obj.type === "${memberName}");`,
            name: "is" + capitalize(memberName),
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
        const factoryName = isValidFunctionName(memberName) ? memberName : `${memberName}_`;
        functions.push({
            kind: StructureKind.Function,
            statements: `return {
                ${memberName}: obj,
                type: ${doubleQuote(memberName)},
            };`,
            name: factoryName,
            parameters: [
                {
                    name: "obj",
                    type: fieldType,
                },
            ],
            returnType: interfaceName,
            // deprecate creation of deprecated types
            docs: fieldDefinition.deprecated != null ? [`@deprecated ${fieldDefinition.deprecated}`] : undefined,
        });

        visitorProperties.push({
            kind: StructureKind.PropertySignature,
            name: singleQuote(memberName),
            type: `(obj: ${fieldType}) => T`,
            isReadonly: typeGenerationFlags.readonlyInterfaces,
        });
        visitorCaseStatements.push(
            `case ${doubleQuote(memberName)}: return ${visitor}.${memberName}(${obj}.${memberName});`,
        );
    });

    visitorProperties.push({
        kind: StructureKind.PropertySignature,
        name: singleQuote("unknown"),
        type: `(obj: ${unionTsType}) => T`,
        isReadonly: typeGenerationFlags.readonlyInterfaces,
    });

    const visitorStatements: string[] = [];
    if (visitorCaseStatements.length === 0) {
        visitorStatements.push(`return ${visitor}.unknown(${obj});`);
    } else {
        visitorStatements.push(`switch (${obj}.type) {`);
        visitorStatements.push(...visitorCaseStatements);
        visitorStatements.push(`default: return ${visitor}.unknown(${obj});`);
        visitorStatements.push(`}`);
    }

    return {
        functions,
        imports,
        memberInterfaces,
        visitorProperties,
        visitorStatements,
    };
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Emits the `IFooJSON` interface alongside the regular `IFoo` interface in the object's source file.
 * Each field uses the JSON-accurate type (collections are nullable, object refs use IBarJSON).
 * Also emits any additional imports needed for IBarJSON references.
 */
function addJsonInterface(
    sourceFile: ReturnType<SimpleAst["createSourceFile"]>,
    definition: IObjectDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): void {
    const jsonProperties: PropertySignatureStructure[] = [];
    const jsonImports: ImportDeclarationStructure[] = [];
    const jsonImportedRefs = new Set<string>();

    definition.fields.forEach(fieldDefinition => {
        const jsonFieldType = resolveJsonTsType(
            fieldDefinition.type,
            definition.typeName,
            knownTypes,
            typeGenerationFlags,
            false,
            false,
        );

        jsonProperties.push({
            kind: StructureKind.PropertySignature,
            hasQuestionToken: IType.isOptional(fieldDefinition.type),
            name: singleQuote(fieldDefinition.fieldName),
            type: jsonFieldType,
        });

        // Collect imports for IFooJSON references
        collectJsonTypeImports(
            fieldDefinition.type,
            definition.typeName,
            knownTypes,
            typeGenerationFlags,
            jsonImports,
            jsonImportedRefs,
        );
    });

    if (jsonImports.length > 0) {
        sourceFile.addImportDeclarations(sortImports(jsonImports));
    }

    sourceFile.addInterface({
        isExported: true,
        name: `I${definition.typeName.name}JSON`,
        properties: jsonProperties,
    });
}

/**
 * Emits the `fromFooJson(json: IFooJSON): IFoo` function into the object's source file.
 */
function addFromJsonFunction(
    sourceFile: ReturnType<SimpleAst["createSourceFile"]>,
    definition: IObjectDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): void {
    const fromJsonImports: ImportDeclarationStructure[] = [];
    const fromJsonImportedRefs = new Set<string>();
    const fieldExprs: string[] = [];

    definition.fields.forEach(fieldDefinition => {
        const { expr, refs } = buildFromJsonFieldExpr(
            fieldDefinition.type,
            `json.${fieldDefinition.fieldName}`,
            knownTypes,
            typeGenerationFlags,
        );
        fieldExprs.push(`${fieldDefinition.fieldName}: ${expr}`);

        refs.forEach(ref => {
            const key = createHashableTypeName(ref);
            if (!fromJsonImportedRefs.has(key) && !(ref.name === definition.typeName.name && ref.package === definition.typeName.package)) {
                fromJsonImportedRefs.add(key);
                fromJsonImports.push({
                    kind: StructureKind.ImportDeclaration,
                    moduleSpecifier: relativePath(definition.typeName, ref),
                    namedImports: [{ name: `from${ref.name}Json` }],
                });
            }
        });
    });

    if (fromJsonImports.length > 0) {
        sourceFile.addImportDeclarations(sortImports(fromJsonImports));
    }

    const typeName = definition.typeName.name;
    sourceFile.addFunction({
        isExported: true,
        name: `from${typeName}Json`,
        parameters: [{ name: "json", type: `I${typeName}JSON` }],
        returnType: `I${typeName}`,
        statements: `return {\n${fieldExprs.map(e => `    ${e},`).join("\n")}\n};`,
    });
}

/**
 * Emits the `IFooJSON` type alias for a union type.
 * Each variant member type gets JSON treatment (collections nullable, object refs use IBarJSON).
 */
function addUnionJsonType(
    sourceFile: ReturnType<SimpleAst["createSourceFile"]>,
    definition: IUnionDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): void {
    const jsonImports: ImportDeclarationStructure[] = [];
    const jsonImportedRefs = new Set<string>();

    const memberTypeStrings = definition.union.map(fieldDefinition => {
        const jsonFieldType = resolveJsonTsType(
            fieldDefinition.type,
            definition.typeName,
            knownTypes,
            typeGenerationFlags,
            false,
            false,
        );

        collectJsonTypeImports(
            fieldDefinition.type,
            definition.typeName,
            knownTypes,
            typeGenerationFlags,
            jsonImports,
            jsonImportedRefs,
        );

        return `{ '${fieldDefinition.fieldName}': ${jsonFieldType}; 'type': "${fieldDefinition.fieldName}" }`;
    });

    // Include unknown-variant catch-all
    memberTypeStrings.push(`{ 'type': string; [key: string]: unknown }`);

    if (jsonImports.length > 0) {
        sourceFile.addImportDeclarations(sortImports(jsonImports));
    }

    sourceFile.addTypeAlias({
        isExported: true,
        name: `I${definition.typeName.name}JSON`,
        type: memberTypeStrings.join(" | "),
    });
}

/**
 * Emits the `fromFooJson(json: IFooJSON): IFoo` function for a union type.
 * Switches on `json.type` and applies per-variant transformations.
 */
function addUnionFromJsonFunction(
    sourceFile: ReturnType<SimpleAst["createSourceFile"]>,
    definition: IUnionDefinition,
    knownTypes: Map<string, ITypeDefinition>,
    typeGenerationFlags: ITypeGenerationFlags,
): void {
    const fromJsonImports: ImportDeclarationStructure[] = [];
    const fromJsonImportedRefs = new Set<string>();

    const caseStatements = definition.union.map(fieldDefinition => {
        const memberName = fieldDefinition.fieldName;
        const { expr, refs } = buildFromJsonFieldExpr(
            fieldDefinition.type,
            `json.${memberName}`,
            knownTypes,
            typeGenerationFlags,
        );

        refs.forEach(ref => {
            const key = createHashableTypeName(ref);
            if (!fromJsonImportedRefs.has(key) && !(ref.name === definition.typeName.name && ref.package === definition.typeName.package)) {
                fromJsonImportedRefs.add(key);
                fromJsonImports.push({
                    kind: StructureKind.ImportDeclaration,
                    moduleSpecifier: relativePath(definition.typeName, ref),
                    namedImports: [{ name: `from${ref.name}Json` }],
                });
            }
        });

        return `case "${memberName}": return { type: "${memberName}", ${memberName}: ${expr} };`;
    });

    if (fromJsonImports.length > 0) {
        sourceFile.addImportDeclarations(sortImports(fromJsonImports));
    }

    const typeName = definition.typeName.name;
    const unionType = `I${typeName}`;
    const jsonType = `I${typeName}JSON`;

    const switchStatements = [
        `switch (json.type) {`,
        ...caseStatements,
        `default: return json as unknown as ${unionType};`,
        `}`,
    ].join("\n");

    sourceFile.addFunction({
        isExported: true,
        name: `from${typeName}Json`,
        parameters: [{ name: "json", type: jsonType }],
        returnType: unionType,
        statements: switchStatements,
    });
}

/**
 * Collects import declarations needed for `IFooJSON` references within a field type.
 * Adds `{ IBarJSON }` imports for object/union reference fields.
 */
function collectJsonTypeImports(
    fieldType: IType,
    baseType: ITypeName,
    knownTypes: Map<string, ITypeDefinition>,
    flags: ITypeGenerationFlags,
    imports: ImportDeclarationStructure[],
    importedRefs: Set<string>,
): void {
    switch (fieldType.type) {
        case "primitive":
            return;
        case "list":
            collectJsonTypeImports(fieldType.list.itemType, baseType, knownTypes, flags, imports, importedRefs);
            return;
        case "set":
            collectJsonTypeImports(fieldType.set.itemType, baseType, knownTypes, flags, imports, importedRefs);
            return;
        case "map":
            collectJsonTypeImports(fieldType.map.valueType, baseType, knownTypes, flags, imports, importedRefs);
            return;
        case "optional":
            collectJsonTypeImports(fieldType.optional.itemType, baseType, knownTypes, flags, imports, importedRefs);
            return;
        case "external":
            collectJsonTypeImports(fieldType.external.fallback, baseType, knownTypes, flags, imports, importedRefs);
            return;
        case "reference": {
            const referencedType = fieldType.reference;
            const definition = knownTypes.get(createHashableTypeName(referencedType));
            if (definition == null) {
                throw new Error(
                    `Unknown reference type. package: '${referencedType.package}', name: '${referencedType.name}'`,
                );
            }

            if (ITypeDefinition.isEnum(definition)) {
                // Enums unchanged — no JSON import needed, but the regular import already handles it.
                return;
            }

            if (ITypeDefinition.isAlias(definition)) {
                if (!isFlavorizable(definition.alias.alias, flags.flavorizedAliases)) {
                    // Non-flavorized alias inlines transparently.
                    collectJsonTypeImports(definition.alias.alias, baseType, knownTypes, flags, imports, importedRefs);
                    return;
                }
                // Flavorized alias: unchanged, no extra import.
                return;
            }

            // Object or union: import IFooJSON from same module.
            if (referencedType.name === baseType.name && referencedType.package === baseType.package) {
                return; // self-reference — no import needed
            }

            const key = createHashableTypeName(referencedType);
            if (!importedRefs.has(key)) {
                importedRefs.add(key);
                imports.push({
                    kind: StructureKind.ImportDeclaration,
                    moduleSpecifier: relativePath(baseType, referencedType),
                    namedImports: [{ name: `I${referencedType.name}JSON` }],
                });
            }
            return;
        }
    }
}
