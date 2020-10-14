/**
 * This enumerates the numbers 1:2 also 100.
 * 
 */
export enum EnumExample {
    ONE = "ONE",
    /**
     * @deprecated use one
     */
    OLD_ONE = "OLD_ONE",
    /**
     * You should no longer use this
     * 
     * @deprecated use one
     */
    OLD_DEPRECATED_ONE = "OLD_DEPRECATED_ONE",
    /**
     * You should no longer use this
     * 
     * @deprecated should use ONE
     */
    OLD_DOCUMENTED_ONE = "OLD_DOCUMENTED_ONE",
}
