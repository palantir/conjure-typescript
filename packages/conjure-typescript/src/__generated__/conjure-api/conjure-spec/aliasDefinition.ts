import * as IType from "./type";
import { ITypeName } from "./typeName";

export interface IAliasDefinition {
    'typeName': ITypeName;
    'alias': IType.IType;
    'docs'?: string | null;
}
