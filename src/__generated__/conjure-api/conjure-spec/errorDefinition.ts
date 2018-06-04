import { ErrorCode } from "./errorCode";
import { IFieldDefinition } from "./fieldDefinition";
import { ITypeName } from "./typeName";

export interface IErrorDefinition {
    'errorName': ITypeName;
    'docs'?: string | null;
    'namespace': string;
    'code': ErrorCode;
    'safeArgs': Array<IFieldDefinition>;
    'unsafeArgs': Array<IFieldDefinition>;
}
