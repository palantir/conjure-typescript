import { IErrorDefinition } from "./errorDefinition";
import { IServiceDefinition } from "./serviceDefinition";
import * as ITypeDefinition from "./typeDefinition";

export interface IConjureDefinition {
    'version': number;
    'errors': Array<IErrorDefinition>;
    'types': Array<ITypeDefinition.ITypeDefinition>;
    'services': Array<IServiceDefinition>;
}
