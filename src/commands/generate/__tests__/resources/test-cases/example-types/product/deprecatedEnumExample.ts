export enum DeprecatedEnumExample {
    ONE = "ONE",
    /**
     * @deprecated use ONE
     */
    OLD_ONE = "OLD_ONE",
    /**
     * You should no longer use this
     * 
     * @deprecated use ONE
     */
    OLD_DEPRECATED_ONE = "OLD_DEPRECATED_ONE",
    /**
     * You should no longer use this
     * 
     * @deprecated should use ONE
     * 
     */
    OLD_DOCUMENTED_ONE = "OLD_DOCUMENTED_ONE"
}
