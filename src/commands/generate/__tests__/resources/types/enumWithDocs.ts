/**
 * Some documentation
 */
export namespace EnumWithDocs {
    /**
     * Some field documentation
     */
    export type FOO = "FOO";
    export type BAR = "BAR";

    export const FOO = "FOO";
    export const BAR = "BAR";
}

export type EnumWithDocs = keyof typeof EnumWithDocs;
