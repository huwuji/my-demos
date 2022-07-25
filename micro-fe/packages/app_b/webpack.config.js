const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;
var HtmlWebpackPlugin = require("html-webpack-plugin");
const { dependencies } = require("./package.json");

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app_b.bundle.js",
  },
  mode: "development", //'production',
  module: {
    rules: [
      {
        test: /bootstrap\.js$/,
        loader: "bundle-loader",
        options: {
          lazy: true,
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: "/node_modules/",
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "app_b",
      filename: "remoteEntry.js",
      exposes: {},
      remotes: {
        app1: "app_a@http://localhost:3001/remoteEntry.js",
      },
      shared: {
        ...dependencies,
        react: {
          // eager: true, // 共享依赖在打包过程中是否被分离为 async chunk。设置为 true， 共享依赖会打包到 main、remoteEntry，不会被分离，因此当设置为true时共享依赖是没有意义的
          requiredVersion: dependencies["react"],
          singleton: true,
        },
        "react-dom": {
          // eager: true,
          requiredVersion: dependencies["react-dom"],
          singleton: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "./index.ejs",
    }),
  ],
};
