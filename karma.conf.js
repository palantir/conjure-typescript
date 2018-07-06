module.exports = function (config) {
    config.set({
        frameworks: ["mocha", "chai", "karma-typescript"],
        files: [
            "src/__integTest__/**/*.ts"
        ],
        preprocessors: {
            "src/__integTest__/**/*.ts": "karma-typescript"
        },
        karmaTypescriptConfig: {
            tsconfig: "src/tsconfig.karma.json"
        },
        reporters: ["progress", "karma-typescript"],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ["ChromeHeadless"],
        autoWatch: false,
        // singleRun: false, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity,
        coverage: false
    })
}
