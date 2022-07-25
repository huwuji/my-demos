### Webpack Module Federation Demo 实践

1. 项目介绍
   注意：
   1）这里使用 lerna 来模拟管理多应用，实际项目中这么很可能是分开在不同工程；
   2）这么只是模拟了单项的依赖，双向依赖类似；
   3）开启了并发模式渲染，依赖于此配置搭建应用要注意自动批处理；如果想取消自动批处理，想某些事件同步执行，请使用 flushSync；

   - app_a 提供远程模块；

   - app_b 构建项目并依赖 app_a 提供的远程模块；

2. 构建 Demo

   - 全局安装 lerna，并构建
     npm install lerna -g
     lerna init
     ...

3. 项目运行

   - 先运行构建
     lerna run build
   - 再启动服务器
     lerna run start

4. 其他说明：

   1） 需要注意这么抽离了一个 bootsrap.js 文件，并对此文件单独打包输出一个 bundle 文件，被浏览器 request;

   ```
   module: {
       rules: [
       {
           test: /bootstrap\.js$/,
           loader: "bundle-loader",
           options: {
           lazy: true,
           },
       },
       ],
   }
   ```

2)
