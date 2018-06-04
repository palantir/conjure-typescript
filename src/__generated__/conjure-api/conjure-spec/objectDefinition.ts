import { IFieldDefinition } from "./fieldDefinition";
import { ITypeName } from "./typeName";

export interface IObjectDefinition {
    'typeName': ITypeName;
    'fields': Array<IFieldDefinition>;
    'docs'?: string | null;
}
