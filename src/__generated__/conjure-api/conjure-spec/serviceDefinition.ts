import { IEndpointDefinition } from "./endpointDefinition";
import { ITypeName } from "./typeName";

export interface IServiceDefinition {
    'serviceName': ITypeName;
    'endpoints': Array<IEndpointDefinition>;
    'docs'?: string | null;
}
