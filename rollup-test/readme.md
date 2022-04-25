### 利用rollup的manualChunks手动配置

1. 简单按页面拆分。
2. 简单提取公共包

简谈拆包：
从rollup中观察到rollup对模块的定义（<https://rollupjs.org/guide/en/#thisgetmoduleinfo>
）如下图

```
    type ModuleInfo = {
  id: string; // the id of the module, for convenience
  code: string | null; // the source code of the module, `null` if external or not yet available
  ast: ESTree.Program; // the parsed abstract syntax tree if available
  isEntry: boolean; // is this a user- or plugin-defined entry point
  isExternal: boolean; // for external modules that are referenced but not included in the graph
  importedIds: string[]; // the module ids statically imported by this module
  importers: string[]; // the ids of all modules that statically import this module
  dynamicallyImportedIds: string[]; // the module ids imported by this module via dynamic import()
  dynamicImporters: string[]; // the ids of all modules that import this module via dynamic import()
  implicitlyLoadedAfterOneOf: string[]; // implicit relationships, declared via this.emitFile
  implicitlyLoadedBefore: string[]; // implicit relationships, declared via this.emitFile
  hasModuleSideEffects: boolean | 'no-treeshake'; // are imports of this module included if nothing is imported from it
  meta: { [plugin: string]: any }; // custom module meta-data
  syntheticNamedExports: boolean | string; // final value of synthetic named exports
};
```

1. 定义每个模块文件，id为文件的全路径，
2. 从入口配置文件出发，分析文件的引用关系，然后匹配output中的配置（这里直接指manualChunks）,重新构建引用关系。（这其中就是按规则构建新文件，更新引用）。
比如：

```
原entry_1.js文件：
import fn_c from './components/c';

const fn = () => {
  console.log('entry_1');
  fn_c();
}
export default fn;
//////
打包后的entry_1.js文件
import { f as fn_c } from './common-ede159a1.js';

const fn = () => {
  console.log('entry_1');
  fn_c();
};

export { fn as default };

```

对fn_c的引用关系更改。

关于打包其他的部分，比如去重，转换（babel），压缩（这里还可以了解Huffman编码）就不在这里介绍了。

参照：

1. [https://rollupjs.org/guide/en/#outputmanualchunks](https://rollupjs.org/guide/en/#outputmanualchunks)
2. [https://rollupjs.org/guide/en/#big-list-of-options](https://rollupjs.org/guide/en/#big-list-of-options)
