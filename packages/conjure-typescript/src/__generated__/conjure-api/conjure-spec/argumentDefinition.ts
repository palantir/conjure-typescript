import * as IParameterType from "./parameterType";
import * as IType from "./type";

export interface IArgumentDefinition {
    'argName': string;
    'type': IType.IType;
    'paramType': IParameterType.IParameterType;
    'docs'?: string | null;
    'markers': Array<IType.IType>;
}
