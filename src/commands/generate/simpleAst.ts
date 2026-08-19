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

import { ITypeName } from "conjure-api";
import * as path from "path";
import { ExportDeclarationStructure, OptionalKind, Project, SourceFile } from "ts-morph";
import { directoryNameForType, moduleNameForType } from "../../utils/fileUtils";

const TS_EXTENSION = ".ts";
const dashRegex = /-(\w)/g;

export class SimpleAst {
    private ast: Project;
    private outDir: string;

    public constructor(outDir: string) {
        this.outDir = outDir;
        this.ast = new Project({
            compilerOptions: {
                declaration: true,
                outDir,
            },
        });
    }

    public createSourceFile(currType: ITypeName): SourceFile {
        return this.ast.createSourceFile(path.join(this.outDir, typeNameToFilePath(currType)));
    }

    public async generateIndexFiles(): Promise<void[]> {
        const moduleFiles: Map<string, SourceFile[]> = new Map();
        this.ast.getSourceFiles().forEach(file => {
            const packageName = file.getDirectory().getBaseName();
            const allFiles = (moduleFiles.get(packageName) || []).concat(file);
            moduleFiles.set(packageName, allFiles);
        });

        const rootIndex = this.ast.createSourceFile(path.join(this.outDir, "index.ts"));
        const moduleArray = Array.from(moduleFiles.entries());
        const indexPromises = moduleArray.map(([packageName, files]) => {
            const moduleIndex = this.ast.createSourceFile(path.join(this.outDir, packageName, "index.ts"));
            files.forEach(file => moduleIndex.addExportDeclarations(exportDeclarationsForFile(file)));
            return moduleIndex.save();
        });

        if (moduleArray.length === 1) {
            rootIndex.addExportDeclaration({ moduleSpecifier: `./${moduleArray[0][0]}` });
        } else {
            moduleArray.forEach(([packageName, _types]) => {
                const camelCaseModule = packageName.replace(dashRegex, x => x[1].toUpperCase());
                rootIndex.addImportDeclaration({
                    moduleSpecifier: `./${packageName}`,
                    namespaceImport: camelCaseModule,
                });
                rootIndex.addExportDeclaration({ namedExports: [camelCaseModule] });
            });
        }
        indexPromises.push(rootIndex.save());

        return Promise.all(indexPromises);
    }
}

export function typeNameToFilePath(type: ITypeName): string {
    return path.join(directoryNameForType(type), moduleNameForType(type) + TS_EXTENSION);
}

interface IExportableDeclaration {
    getName(): string | undefined;
    isExported(): boolean;
}

/**
 * Named re-exports let bundlers resolve a package's exports from its index alone, so modules nothing
 * references are never parsed. `export *` forces them to read every file in the package.
 */
function exportDeclarationsForFile(file: SourceFile): Array<OptionalKind<ExportDeclarationStructure>> {
    const moduleSpecifier = `./${file.getBaseNameWithoutExtension()}`;
    const valueNames = exportedNames([
        ...file.getClasses(),
        ...file.getEnums(),
        ...file.getFunctions(),
        ...file.getModules(),
        ...file.getVariableDeclarations(),
    ]);
    // Enums and unions declare a type and a value of the same name, and the value export covers both.
    const typeNames = exportedNames([...file.getInterfaces(), ...file.getTypeAliases()]).filter(
        name => valueNames.indexOf(name) === -1,
    );

    const declarations: Array<OptionalKind<ExportDeclarationStructure>> = [];
    if (valueNames.length > 0) {
        declarations.push({ moduleSpecifier, namedExports: valueNames });
    }
    // Without `export type`, consumers that transpile file by file emit a runtime re-export of a
    // binding that only exists at type level.
    if (typeNames.length > 0) {
        declarations.push({ isTypeOnly: true, moduleSpecifier, namedExports: typeNames });
    }
    return declarations;
}

function exportedNames(declarations: IExportableDeclaration[]): string[] {
    const names = declarations
        .filter(declaration => declaration.isExported())
        .map(declaration => declaration.getName())
        .filter((name): name is string => name != null);
    return Array.from(new Set(names)).sort();
}
