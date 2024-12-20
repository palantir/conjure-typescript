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
    IObjectDefinition,
    ITypeDefinition,
    ITypeDefinitionVisitor,
    IUnionDefinition,
} from "conjure-api";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { generateError } from "./errorGenerator";
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
    const knownTypes: Map<string, ITypeDefinition> = new Map();
    const indexingVisitor = new IndexByTypeNameVisitor(knownTypes);
    definition.types.forEach(typeDefinition => ITypeDefinition.visit(typeDefinition, indexingVisitor));
    // Add the errors to knownTypes so they can be imported by services
    definition.errors.forEach(errorDefinition =>
        knownTypes.set(
            createHashableTypeName(errorDefinition.errorName),
            ITypeDefinition.object({
                typeName: errorDefinition.errorName,
                docs: errorDefinition.docs,
                fields: [], // We don't need to know an error's fields to import an error
            }),
        ),
    );
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

    const promises: Array<Promise<any>> = [];
    const simpleAst = new SimpleAst(outDir);

    definition.services.forEach(serviceDefinition =>
        promises.push(generateService(serviceDefinition, knownTypes, simpleAst, typeGenerationFlags)),
    );
    definition.types.forEach(typeDefinition =>
        promises.push(generateType(typeDefinition, knownTypes, simpleAst, typeGenerationFlags)),
    );
    definition.errors.forEach(errorDefinition =>
        promises.push(generateError(errorDefinition, knownTypes, simpleAst, typeGenerationFlags)),
    );

    promises.push(simpleAst.generateIndexFiles());
    return Promise.all(promises)
        .then(() => {
            return;
        })
        .catch(e => {
            fs.removeSync(outDir);
            throw e;
        });
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
