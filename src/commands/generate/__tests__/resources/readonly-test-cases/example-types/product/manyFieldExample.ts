export interface IManyFieldExample {
    /**
     * docs for string field
     */
    'string': string;
    /**
     * docs for integer field
     */
    'integer': number;
    /**
     * docs for doubleValue field
     */
    'doubleValue': number | "NaN";
    /**
     * docs for optionalItem field
     */
    'optionalItem'?: string | null;
    /**
     * docs for items field
     */
    'items': ReadonlyArray<string>;
    /**
     * docs for set field
     */
    'set': ReadonlyArray<string>;
    /**
     * docs for map field
     */
    'map': { readonly [key: string]: string };
    /**
     * docs for alias field
     */
    'alias': string;
}
