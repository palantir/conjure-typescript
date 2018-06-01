import { IEnumValueDefinition } from "./enumValueDefinition";
import { ITypeName } from "./typeName";

export interface IEnumDefinition {
    'typeName': ITypeName;
    'values': Array<IEnumValueDefinition>;
    'docs'?: string | null;
}
