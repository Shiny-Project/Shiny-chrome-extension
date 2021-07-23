const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");

const generateHTMLPluginConf = (input) => {
    const result = [];
    for (const file of Object.keys(input)) {
        result.push(
            new HtmlWebpackPlugin({
                filename: path.resolve(__dirname, `../dist/${file}/index.html`),
                template: path.resolve(__dirname, "../src/index.html"),
                chunks: ["vendors", input[file]["output"]],
            })
        );
    }
    return result;
};

const generateEntries = (input) => {
    const result = {};
    for (const file of Object.keys(input)) {
        result[input[file]["output"]] = path.resolve(
            __dirname,
            `../src/${input[file]["input"]}`
        );
    }
    return result;
};

const generateConfig = (input) => {
    return {
        mode: "production",
        entry: generateEntries(input),
        resolve: {
            extensions: [".js", ".vue"],
        },
        plugins: [
            new WriteFilePlugin(),
            new CleanWebpackPlugin({
                verbose: true,
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, "../assets/"),
                        to: path.resolve(__dirname, "../dist/assets"),
                    },
                    {
                        from: path.resolve(__dirname, "../manifest.json"),
                        to: path.resolve(__dirname, "../dist/manifest.json"),
                    },
                ],
            }),
            new MiniCssExtractPlugin(),
            ...generateHTMLPluginConf(input),
        ],
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: "vue-loader",
                },
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                [
                                    "@babel/preset-env",
                                    {
                                        targets: "> 0.25%, not dead",
                                        useBuiltIns: "usage",
                                        corejs: "3.13",
                                    },
                                ],
                            ],
                        },
                    },
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                    loader: "url-loader",
                },
            ],
        },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, `../dist/`),
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    commons: {
                        test: /[\\/]node_modules[\\/]/,
                        name: "vendors",
                        chunks: "all",
                    },
                },
                name: false,
            },
        },
    };
};

module.exports = [
    generateConfig({
        background: {
            input: "background/index.js",
            output: "background/bundle",
        },
        recent: {
            input: "recent/index.js",
            output: "recent/bundle",
        },
        landing: {
            input: "landing.js",
            output: "landing/bundle",
        },
        config: {
            input: "config/index.js",
            output: "config/bundle",
        },
        "popups/block": {
            input: "popups/block.js",
            output: "popups/block/bundle",
        },
        "popups/star": {
            input: "popups/star.js",
            output: "popups/star/bundle",
        },
        "account/login": {
            input: "account/login.js",
            output: "account/login/bundle",
        },
        "account/register": {
            input: "account/register.js",
            output: "account/register/bundle",
        },
        subscription: {
            input: "subscription/index.js",
            output: "subscription/bundle",
        },
    }),
];
