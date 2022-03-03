/**
 * 简单的打包器，实现webpack简单打包流程
 * 1. 从入口文件开始，遍历，解析模块代码，并记录依赖关系，构建模块依赖图；
 * 2. 遍历依赖图（数组或链表），打包模块文件，生成IIFE,并构建输出文件。
 * 
 */

const path=require('path');
const fs=require('fs');
const {parse}=require('@babel/parser');
const traverse=require('@babel/traverse').default;
const {transformFromAstSync}= require('@babel/core');

const {entry,output}=require('../minipack-config');

let ID=0;

/**
 * 模块解析
 */
 function  parseModule (modulePath){
    const dirPath=path.dirname(modulePath);
    const baseName=path.basename(modulePath);
    const allPath=path.join(dirPath,baseName);

    const codes=fs.readFileSync(allPath,'utf-8');
    // console.log('codes==',codes)

    // 解析js模块 可以通过https://astexplorer.net/查看
    const ast=parse(codes,{
        sourceType:'module',
    });
    // console.log('ast==',ast);
    const dependencies=[];
    // 遍历ast,收集依赖
    traverse(ast,{
        ImportDeclaration:function({node}){
            dependencies.push(node.source.value);
        }
    });
    // es6的ast转译生成为es5
    const {code}= transformFromAstSync(ast,null,{
        presets:['env']
    })
    const moduleId=ID++;
    return {
        id:moduleId,
        baseNme:baseName,
        dirName:dirPath,
        code:code,
        dependencies:dependencies,
    }
}

// console.log(parseModule(entry));

/**
 * 从入口文件开始，生成依赖图
 */
function createGraph(entryPath){
    const graphList=[];
    const cacheQueue=[];
    const entryAsset=parseModule(entryPath);
    cacheQueue.push(entryAsset);

    while(cacheQueue.length){
        const asset=cacheQueue.pop();
        // console.log('0000=',asset);
        graphList.push(asset);

        const dependencyList=asset.dependencies
        asset.mapping={}
        dependencyList.forEach(filePath => {
            const absPath=path.resolve(asset.dirName,filePath);
            const dependencyAsset= parseModule(absPath);

            asset.mapping[filePath]=dependencyAsset.id;
            cacheQueue.unshift(dependencyAsset);
            // console.log('0000=',asset);
        });
    }

    return graphList;
}

// console.log(createGraph(entry));

const graphList=createGraph(entry);

let modules='';
/**
 * 打包
 */
function bundle(graph){
    graph.forEach(mod => {
        modules+=`${mod.id}:[
                funciton(require,module,module.exports){
                    ${mod.code}
                },${mod.mapping}]`;
    });

    return `(function(modules){
        function require(id){
            const {fn,mapping}=modules(id);
            const module={
                exports:{}
            }
            funtion requireLocal(path){
               return require(mapping[path]);
            };
            fn(requireLocal,module,module.exports);

            return module.exports;
        };
        require(0);
    })(${modules})`;
}

const bundleCodes=bundle(graphList);

fs.writeFileSync(output,bundleCodes);