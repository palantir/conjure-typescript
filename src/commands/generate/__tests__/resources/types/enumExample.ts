export namespace EnumExample {
    export type ONE = "ONE";
    export type TWO = "TWO";

    export const ONE = "ONE";
    export const TWO = "TWO";
}

export type EnumExample = keyof typeof EnumExample;
