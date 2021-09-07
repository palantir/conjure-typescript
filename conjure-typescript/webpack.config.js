const path = require("path");
const webpack = require("webpack");

module.exports = {
    mode: "production",
    devtool: false,
    // entry: "./src/conjureTypeScript.ts",
    entry: "./build/scripts/main/index.js",
    resolve: {
        extensions: [ ".js", ".ts", ".json" ],
    },
    output: {
        // path: path.resolve(__dirname, 'dist/bin'),
        path: path.resolve(__dirname, 'build/webpack'),
        filename: "conjure-typescript"
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