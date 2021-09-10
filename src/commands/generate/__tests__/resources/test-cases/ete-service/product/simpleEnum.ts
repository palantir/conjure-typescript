export namespace SimpleEnum {
    export type VALUE = "VALUE";

    export const VALUE = "VALUE";
}

export type SimpleEnum = keyof typeof SimpleEnum;
