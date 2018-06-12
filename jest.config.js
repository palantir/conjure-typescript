/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 */

/**
 * The Jest configuration object.
 * @see http://facebook.github.io/jest/docs/configuration.html
 */
module.exports = {
    bail: false,
    collectCoverage: false,
    /**
     * Here, we enable code coverage reporting for parts of your application that can be easily
     * unit tested as well as critical code paths where logic errors are costly. Note that many aspects
     * of an application's user interface are best verified using ETE or integration tests rather than
     * unit tests. While Jest tests are very cheap to run in a jsdom environment, they might provide
     * a false sense of security that features are properly guarded against regressions.
     */
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!**/*.d.ts",
    ],
    coveragePathIgnorePatterns: [
    ],
    coverageThreshold: {
        /**
         * These thresholds are intentionally kept low so as not to impose undue burden when bootstrapping
         * a project. They should be adjusted as necessary as a project matures.
         */
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
    globals: {
        "ts-jest": {
            /** This global is necessary for ts-jest to locate the compiler project config. */
            tsConfigFile: "src/tsconfig.json",
        },
    },
    moduleFileExtensions: ["js", "json", "ts", "tsx"],
    // rootDir is set at the package level and assumed to be the package root
    // setupFiles: ["<rootDir>/src/testBootstrap.js"],
    testEnvironment: "jsdom",
    testMatch: ["<rootDir>/src/**/__tests__/*.{ts,tsx}"],
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "ts-jest",
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(lodash-es)/)",
    ],
    verbose: true,
};
