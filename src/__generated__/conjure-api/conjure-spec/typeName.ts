export interface ITypeName {
    /**
     * The name of the custom Conjure type or service. It must be in UpperCamelCase. Numbers are permitted, but not at the beginning of a word. Allowed names: "FooBar", "XYCoordinate", "Build2Request". Disallowed names: "fooBar", "2BuildRequest".
     * 
     */
    'name': string;
    /**
     * A period-delimited string of package names. The package names must be lowercase. Numbers are permitted, but not at the beginning of a package name. Allowed packages: "foo", "com.palantir.bar", "com.palantir.foundry.build2". Disallowed packages: "Foo", "com.palantir.foundry.2build".
     * 
     */
    'package': string;
}
