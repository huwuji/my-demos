import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { creactList } from './config';

import './index.css';

// 创建一个二维数组
const getTermsArray = (length = 0, terms = 0) => {
  let ar = [];
  for (let i = 0; i < length; i++) {
    ar[i] = terms ? new Array(terms) : [];
  }
  return ar;
}

// 截流控制标签
let throttleFlag = false;

// 滚动dom距离最下面距离阀值
const BOTTOM_FLAG = 100;
// 滚动top距离最上面距离阀值
const TOP_FLAG = 100;

// 列数
const CORLUMN_NUM = 4;

// 元素行之间的间隔
const OFFSET_ITEM_ROW = 20;

// 元素列之间的间隔
const OFFSET_ITEM_COLUMN = 20;

// item
const ITEM_DEFAULT_WIDTH = 200;

// 首次加载位置
const DEFAULT_STA = 0;
const DEFAULT_END = 0;
// 列表对应开始值
let startIndex = DEFAULT_STA;
let endIndex = DEFAULT_END;

// 每次加载数量
const ADD_NUM = 20;//40

// 存储虚拟列表上方被删除的元素
let TOP_LIST = [];
// 存储虚拟列表下方被删除的元素
let BOTTOM_LIST = [];

// 初始化columnItems，包含垫片
const getDefaultCulumnsItems = () => {
  console.log('getDefaultCulumnsItems')
  let newItems = getTermsArray(CORLUMN_NUM, 0);
  for (let i = 0; i < CORLUMN_NUM; i++) {
    const v = {
      width: 200,
      height: 0,
      key: `gasket-${i}`,
    };
    newItems[i].push(v);
  }
  // console.log('newItems==', newItems)

  return newItems;
}
const DefaultCulumnsItems = getDefaultCulumnsItems();


// 能否下拉信号量标识：处理虚拟列表尾数大于总数的长度，等待总数加载.
let waitFlag = false;
// 每次分页请求数量
const PAGE_NUM = 100;//400
// 异步请求标识值:与末尾下标的差
const REQUEST_FLAG = 50;
// 总数量
let allItems = creactList(PAGE_NUM);

// 记录记录每列长度  todo: 这里也可以不记录，通过记录每列的实例对象，获取实例对象的高度
let columnHeightList = [0, 0, 0, 0];


function MultiDemoScroll() {
  const scrollRef = useRef(null);
  const wrapperDomRef = useRef(null);

  // 虚拟列表数据对象
  const [columnItems, setColumnItems] = useState(DefaultCulumnsItems);

  // todo 找最短列
  const findShortestColumn = useCallback(() => {
    let shortestColumnIndex = 0;
    let shortestHeight = columnHeightList[0];
    for (let i = 1; i < CORLUMN_NUM; i++) {
      if (shortestHeight > columnHeightList[i]) {
        shortestColumnIndex = i;
        shortestHeight = columnHeightList[i];
      }
    }
    return shortestColumnIndex;
  }, []);

  // 多列表添加数据过程
  const addItemsToColumns = useCallback((needAddNum, columnItems) => {
    let newColumns = [...columnItems];
    let moreAddNum = needAddNum;
    const bLen = BOTTOM_LIST.length;
    if (bLen) {
      for (let i = 0; i < bLen; i++) {
        //
        const columnIndex = BOTTOM_LIST[i].belong;
        newColumns[columnIndex].push(BOTTOM_LIST[i]);
        columnHeightList[columnIndex] += BOTTOM_LIST[i].height + OFFSET_ITEM_ROW;
      }
      if (bLen < needAddNum) {
        moreAddNum = needAddNum - bLen;
      } else {
        moreAddNum = 0;
      }
    }
    if (moreAddNum > 0) {
      for (let i = 0; i < moreAddNum; i++) {
        const num = findShortestColumn();
        // console.log('找最短列0000==', i, endIndex + i, allItems[endIndex + i]);
        newColumns[num].push(allItems[endIndex + i]);
        columnHeightList[num] += allItems[endIndex + i].height + OFFSET_ITEM_ROW;
      }
    }

    endIndex += needAddNum;
    // console.log('找最短列11111==', columnHeightList);

    // setColumnItems(newColumns);
    return newColumns
  }, []);

  // 下拉时，删除虚拟列表上方数据的过程  
  const delListTopItems = useCallback((scTop, columnItems) => {
    console.log('下拉删除开始', scTop, TOP_FLAG);

    // 每列依次删除到距离阀值最近位置，并记录每列删除的高度。
    const delHeightReords = [];
    // 每列新数据
    const newColumnsItems = [];

    for (let i = 0; i < CORLUMN_NUM; i++) {
      let n = 0;
      let h = columnItems[i][n].height + OFFSET_ITEM_ROW;

      while (h < scTop - TOP_FLAG) {
        if (n > 0) {
          TOP_LIST.push(columnItems[i][n]);
        }
        n += 1;
        h += columnItems[i][n].height + OFFSET_ITEM_ROW;
      }
      let sIndex = 0
      if (n <= 0) {
        sIndex = 1;
      } else {
        sIndex = n;
      }
      const arr = columnItems[i].slice(sIndex);
      newColumnsItems.push([columnItems[i][0], ...arr]);
      const delHeight = h - columnItems[i][n].height;

      delHeightReords.push(delHeight);
    }

    //计算每列与最大删除值的差。
    const minDelHeight = Math.min(...delHeightReords);
    // 补全差值，达到相对静止
    for (let i = 0; i < CORLUMN_NUM; i++) {
      const gasketHeight = delHeightReords[i] - minDelHeight;
      // 重制垫片高度
      newColumnsItems[i][0].height = gasketHeight;
      columnHeightList[i] = columnHeightList[i] - delHeightReords[i] + gasketHeight;
    }
    console.log('下拉删除结束');
    // 渲染
    // setColumnItems(newColumnsItems);
    return newColumnsItems;
  }, []);

  // 初始化 
  const init = useCallback(() => {
    console.log('init')
    const newColumnsItems = addItemsToColumns(ADD_NUM, columnItems);
    setColumnItems(newColumnsItems)
  }, [columnItems]);

  useEffect(() => {
    init();
  }, []);

  // 下拉加载  计算一次加载和删除的过程.
  const getBottomNewShowItems = useCallback((scTop) => {
    if (throttleFlag || waitFlag) {
      return;
    }
    throttleFlag = true;

    // 加载时，尾点增加
    let newEndIndex = endIndex + ADD_NUM;

    // todo 是否需要提前加载请求数据，补充allItems。这里不再重复讨论。
    if (allItems.length - newEndIndex <= REQUEST_FLAG) {
    }
    // 判断尾点值，这里需要重新纠正，以防allItems数据没有及时新增，造成bug
    if (newEndIndex >= allItems.length) {
      newEndIndex = allItems.length;
      waitFlag = true;
    }

    let newColumnsItems = delListTopItems(scTop, columnItems);
    newColumnsItems = addItemsToColumns(newEndIndex - endIndex, newColumnsItems);
    setColumnItems(newColumnsItems);

    throttleFlag = false;
  }, [columnItems])

  // 上拉加载 todo
  const getTopNewShowItems = useCallback((scBottom) => {
    if (throttleFlag) {
      return;
    }
    throttleFlag = true;


    waitFlag = false;
    throttleFlag = false;
  }, []);

  const handle = useCallback((e) => {
    const targetDom = e.target;
    // console.log('00000==', targetDom, columnHeightList);

    // 最短列下方距离
    const shortestHeight = Math.min(...columnHeightList);
    const bottomOffset = shortestHeight - targetDom.scrollTop - targetDom.clientHeight;
    // console.log('targetDom==', shortestHeight, bottomOffset, targetDom.scrollTop, targetDom.clientHeight);

    // 当底部距离可视区域位置达到阀值时
    if (bottomOffset < BOTTOM_FLAG) {
      // todo 具体策略，细节可以根据需求变化，
      // 下拉加载
      getBottomNewShowItems(targetDom.scrollTop);
    }
    // 上方距离
    const topOffset = targetDom.scrollTop;
    if (topOffset < TOP_FLAG && startIndex > 0) {
      //  上拉加载
      getTopNewShowItems(bottomOffset);
    }

  }, [getBottomNewShowItems]);

  useEffect(() => {
    if (scrollRef && scrollRef.current) {
      scrollRef.current.addEventListener('scroll', handle)
      // scrollRef.current.scrollTo(0, willScrollHeight)
    }
    // const timer = setTimeout(() => {
    //   let newColumns = [];
    //   for (let i = 0; i < CORLUMN_NUM; i++) {
    //     newColumns[i] = columnItems[i].slice(1)
    //   }
    //   console.log('0000==', newColumns, columnItems)

    //   setColumnItems(newColumns)
    // }, 2000);
    return () => {
      scrollRef.current.removeEventListener('scroll', handle);
      // clearTimeout(timer)
    }
  }, [columnItems]);

  // console.log('columnItems==', columnItems)
  return (
    <div
      className='wrapper'
      ref={scrollRef}
    >
      <div
        // ref={scrollRef}
        className='columns_wrapper'
      >
        {
          columnItems.map((cItems, index) => {
            return (
              <div
                className={'column_wrapper'}
                key={`${index}`}
                style={{
                  marginRight: OFFSET_ITEM_COLUMN,
                  width: ITEM_DEFAULT_WIDTH
                }}
              // ref={}
              >
                {
                  cItems.map((v, index) => {
                    return (
                      <div
                        key={v.key}//
                        style={{
                          width: v.width,
                          height: v.height,
                          background: 'red',
                          marginBottom: OFFSET_ITEM_ROW,
                          overflow: 'hidden'
                        }}
                      >
                        {v.key}-{v.height}
                      </div>
                    )
                  })
                }
              </div>
            )
          })
        }
      </div>
      <div>
        loading
        </div>
    </div>
  )
}
export default MultiDemoScroll;

