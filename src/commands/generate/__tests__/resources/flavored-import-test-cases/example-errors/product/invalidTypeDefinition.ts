export interface IInvalidTypeDefinition {
    'errorCode': "INVALID_ARGUMENT";
    'errorInstanceId': string;
    'errorName': "Conjure:InvalidTypeDefinition";
    'parameters': {
        typeName: string;
        typeDef: any;
    };
}

export function isInvalidTypeDefinition(arg: any): arg is IInvalidTypeDefinition {
    return arg && arg.errorName === "Conjure:InvalidTypeDefinition";
}
