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
    IConjureDefinition,
    IEnumDefinition,
    IExternalReference,
    IObjectDefinition,
    ITypeDefinition,
    ITypeDefinitionVisitor,
    IUnionDefinition,
} from "conjure-api";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { generateError } from "./errorGenerator";
import { generateExternalReference } from "./externalImportGenerator";
import { dir } from "./imports";
import { generateService } from "./serviceGenerator";
import { SimpleAst } from "./simpleAst";
import { ITypeGenerationFlags } from "./typeGenerationFlags";
import { generateType } from "./typeGenerator";
import { createHashableTypeName, dissasembleHashableTypeName } from "./utils";

export async function generate(
    definition: IConjureDefinition,
    outDir: string,
    typeGenerationFlags: ITypeGenerationFlags,
) {
    // Create project structure
    const knownTypes = new Map<string, ITypeDefinition>();
    const indexingVisitor = new IndexByTypeNameVisitor(knownTypes);
    definition.types.forEach(typeDefinition => ITypeDefinition.visit(typeDefinition, indexingVisitor));
    const knownDefinitions = Array.from(knownTypes.keys())
        .map(dissasembleHashableTypeName)
        .concat(definition.services.map(serviceDefinition => serviceDefinition.serviceName))
        .concat(definition.errors.map(errorDefinition => errorDefinition.errorName));
    await Promise.all(
        _.uniqBy(knownDefinitions, ({ package: packageName }) => packageName).map(typeName => {
            const modulePath = path.join(outDir, dir(typeName));
            if (fs.existsSync(modulePath)) {
                fs.removeSync(modulePath);
            }
            return fs.mkdirp(modulePath);
        }),
    );

    // Cllects external references that are used in services, types, and errors.
    const externalImports = new Map<string, IExternalReference>();

    const serviceTypeErrorPromises: Array<Promise<any>> = [];
    const simpleAst = new SimpleAst(outDir);

    definition.services.forEach(serviceDefinition =>
        serviceTypeErrorPromises.push(
            generateService(serviceDefinition, knownTypes, externalImports, simpleAst, typeGenerationFlags),
        ),
    );
    definition.types.forEach(typeDefinition =>
        serviceTypeErrorPromises.push(
            generateType(typeDefinition, knownTypes, externalImports, simpleAst, typeGenerationFlags),
        ),
    );
    definition.errors.forEach(errorDefinition =>
        serviceTypeErrorPromises.push(
            generateError(errorDefinition, knownTypes, externalImports, simpleAst, typeGenerationFlags),
        ),
    );

    // Generate all services, types, and errors.
    try {
        await Promise.all(serviceTypeErrorPromises);
    } catch (e) {
        fs.removeSync(outDir);
        throw e;
    }

    // Generate all the external references that were collected during service, type, and error generation.
    const externalReferencePromises: Array<Promise<any>> = [];
    externalImports.forEach(externalImport =>
        externalReferencePromises.push(generateExternalReference(externalImport, simpleAst, typeGenerationFlags)),
    );
    try {
        await Promise.all(externalReferencePromises);
    } catch (e) {
        fs.removeSync(outDir);
        throw e;
    }

    // Generate index files. This can only happen after all TS files have been generated.
    try {
        await simpleAst.generateIndexFiles();
    } catch (e) {
        fs.removeSync(outDir);
        throw e;
    }
}

class IndexByTypeNameVisitor implements ITypeDefinitionVisitor<void> {
    constructor(private map: Map<string, ITypeDefinition>) {}
    public alias = (obj: IAliasDefinition) => {
        this.map.set(createHashableTypeName(obj.typeName), ITypeDefinition.alias(obj));
    };
    public enum = (obj: IEnumDefinition) => {
        this.map.set(createHashableTypeName(obj.typeName), ITypeDefinition.enum_(obj));
    };
    public object = (obj: IObjectDefinition) => {
        this.map.set(createHashableTypeName(obj.typeName), ITypeDefinition.object(obj));
    };
    public union = (obj: IUnionDefinition) => {
        this.map.set(createHashableTypeName(obj.typeName), ITypeDefinition.union(obj));
    };
    public unknown = (obj: ITypeDefinition) => {
        throw new Error("unknown type definition: " + obj);
    };
}
