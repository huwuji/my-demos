1. 加入了检测站点指标的脚本

    ```
    const reportWebVitals = onPerfEntry => {

    if (onPerfEntry && onPerfEntry instanceof Function) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
        });
    }
    };

    export default reportWebVitals;
    ```

    2. 如App.test.js
        使用@testing-library/react来做react 模块的单元测试

    ```
    import { render, screen } from '@testing-library/react';

    import App from './App';

    test('renders learn react link', () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
    });

    ```

3. 此项目是CSR客户端渲染项目，为提升项目的SEO，需要优化项目；
    1）优化为SSR项目：但是需要而外的服务器资源，管理和维护前端项目的渲染，需要更多的精力关注服务器抗并发能力等；
    2）SSG：及静态页面生成。基于react，使用react 框架提供的hydrate功能（基于现有dome节点再构建和渲染）；首次直接访问返回html页面，供seo搜索。再加载js代码（通过hydrate渲染），提供更丰富的前端交互功能。

    这里我们使用方式二。

    上面说到我们做静态化改造，需要两部分。
    一个是首次的hmtl页面，这个可以通过另起脚本，从启动的服务上爬取，使用pupeteer;
    二则是需要使用hydrate方式渲染的脚本。这里我们通过设置全局变量_useSsg来判断，如果_useSsg===true，则启动hydrate渲染。
