const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const distBin = path.resolve(__dirname, 'dist/bin');

module.exports = {
    mode: "production",
    devtool: false,
    entry: "./src/conjureTypeScript.ts",
    resolve: {
        extensions: [ ".js", ".ts", ".json" ],
    },
    output: {
        path: distBin,
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
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true}),
        new CopyWebpackPlugin([
            { from: 'bin/conjure-typescript.bat', to: distBin }
        ])
    ],
};