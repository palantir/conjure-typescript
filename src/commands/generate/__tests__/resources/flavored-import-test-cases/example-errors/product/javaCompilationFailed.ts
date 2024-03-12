export interface IJavaCompilationFailed {
    'errorCode': "INTERNAL";
    'errorInstanceId': string;
    'errorName': "ConjureJava:JavaCompilationFailed";
    'parameters': {
    };
}

export function isJavaCompilationFailed(arg: any): arg is IJavaCompilationFailed {
    return arg && arg.errorName === "ConjureJava:JavaCompilationFailed";
}
