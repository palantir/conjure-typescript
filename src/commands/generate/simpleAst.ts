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
import { Project, SourceFile } from "ts-morph";
import { directoryNameForType, moduleNameForType } from "../../utils/fileUtils";

const TS_EXTENSION = ".ts";
const dashRegex = /-(\w)/g;

export class SimpleAst {
    private ast: Project;
    private outDir: string;
    private sourceFileByPackageName = new Map<string, SourceFile>();

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
        let sourceFile = this.sourceFileByPackageName.get(currType.package);
        if (sourceFile == null) {
            sourceFile = this.ast.createSourceFile(path.join(this.outDir, dir(currType), "index.ts"));
            this.sourceFileByPackageName.set(currType.package, sourceFile);
        }
        return sourceFile;
    }

    public generateIndexFiles(): Promise<void[]> {
        const moduleTypes: Map<string, string[]> = new Map();
        this.ast.getSourceFiles().forEach(file => {
            const packageName = file.getDirectory().getBaseName();
            const allTypes = (moduleTypes.get(packageName) || []).concat(file.getBaseNameWithoutExtension());
            moduleTypes.set(packageName, allTypes);
        });

        const rootIndex = this.ast.createSourceFile(path.join(this.outDir, "index.ts"));
        const moduleArray = Array.from(moduleTypes.entries());
        const indexPromises = this.ast.getSourceFiles().map(file => {
            file.formatText({ trimTrailingWhitespace: true });
            return file.save();
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
