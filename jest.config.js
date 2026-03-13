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
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!**/*.d.ts',
    ],
    coveragePathIgnorePatterns: [],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
    globals: {
        'ts-jest': {
            tsconfig: 'src/tsconfig.json',
        },
    },
    // Jest mistakenly believes it has access to all CPU cores on CI of the
    // underlying host, rather than the 2 CPU cores allocated to it for
    // CircleCI's medium resource class. Spawning 32-64 workers causes Jest
    // tests to hang on CI.
    maxWorkers: process.env.CI ? 2 : undefined,
    moduleFileExtensions: [
        'js',
        'json',
        'ts',
        'tsx',
    ],
    testEnvironment: 'jsdom',
    testMatch: [
        '<rootDir>/src/**/__tests__/*.{ts,tsx}',
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(lodash-es)/)',
    ],
    verbose: true,
    preset: 'ts-jest/presets/js-with-ts',
}
