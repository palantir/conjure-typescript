import * as IType from "./type";

export interface IFieldDefinition {
    'fieldName': string;
    'type': IType.IType;
    'docs'?: string | null;
}
