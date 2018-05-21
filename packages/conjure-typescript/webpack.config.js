const path = require("path");
const webpack = require("webpack");
const { TsConfigPathsPlugin } = require('awesome-typescript-loader');

module.exports = {
    mode: "production",
    devtool: false,
    entry: "./src/cli.ts",
    resolve: {
        extensions: [ ".js", ".ts", ".json" ],
        plugins: [new TsConfigPathsPlugin({ configFileName: "./src/tsconfig.json" })]
    },
    output: {
        path: path.resolve(__dirname, 'dist/bundle'),
        filename: "conjure-typescript.bundle.js"
    },
    target: "node",
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: require.resolve("awesome-typescript-loader"),
                options: {
                    configFileName: "./src/tsconfig.json",
                    useCache: true,
                    declaration: false
                }
            }
        ]
    },
    plugins: [
        new webpack.IgnorePlugin(/^electron$/),
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true})
    ],
};