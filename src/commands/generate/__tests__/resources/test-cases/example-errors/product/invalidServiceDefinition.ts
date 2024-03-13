export interface IInvalidServiceDefinition {
    'errorCode': "INVALID_ARGUMENT";
    'errorInstanceId': string;
    'errorName': "Conjure:InvalidServiceDefinition";
    'parameters': {
        serviceName: string;
        serviceDef: any;
    };
}

export function isInvalidServiceDefinition(arg: any): arg is IInvalidServiceDefinition {
    return arg && arg.errorName === "Conjure:InvalidServiceDefinition";
}
