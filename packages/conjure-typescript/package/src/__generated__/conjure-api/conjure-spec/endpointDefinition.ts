import { IArgumentDefinition } from "./argumentDefinition";
import * as IAuthType from "./authType";
import { HttpMethod } from "./httpMethod";
import * as IType from "./type";

export interface IEndpointDefinition {
    'endpointName': string;
    'httpMethod': HttpMethod;
    'httpPath': string;
    'auth'?: IAuthType.IAuthType | null;
    'args': Array<IArgumentDefinition>;
    'returns'?: IType.IType | null;
    'docs'?: string | null;
    'deprecated'?: string | null;
    'markers': Array<IType.IType>;
}
