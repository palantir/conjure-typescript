import { IFieldDefinition } from "./fieldDefinition";
import { ITypeName } from "./typeName";

export interface IUnionDefinition {
    'typeName': ITypeName;
    'union': Array<IFieldDefinition>;
    'docs'?: string | null;
}
