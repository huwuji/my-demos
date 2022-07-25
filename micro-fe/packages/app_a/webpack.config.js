const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;
const { dependencies } = require("./package.json");

module.exports = {
  entry: "./lib/index.js",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app_a.bundle.js",
  },
  module: {
    rules: [
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
      name: "app_a",
      filename: "remoteEntry.js",
      // 这里配置需要导出的模块给其它应用共享
      exposes: {
        "./button": "./lib/button",
      },
      // 指明需要共享的依赖
      shared: {
        ...dependencies,
        react: {
          // eager: true,
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
  ],
};
