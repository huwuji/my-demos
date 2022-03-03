import React, { useRef, useEffect, useCallback, useState } from 'react';
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
const TOP_FLAG = 500;

// 
const OFFSET = 50;

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
// let startIndex = DEFAULT_STA;
// 列表加载的尾标识值
let endIndex = DEFAULT_END;

// 每次加载数量
const ADD_NUM = 40;//todo

// 存储虚拟列表上方被删除的元素
let TOP_LIST = [];
// 存储虚拟列表下方被删除的元素
let BOTTOM_LIST = [];

// 记录记录每列长度 
let columnHeightList = [0, 0, 0, 0];
// 记录每列垫片元素当前的高度
let currentGasketList = [0, 0, 0, 0];

// 初始化columnItems，包含垫片
const getDefaultCulumnsItems = () => {
  console.log('getDefaultCulumnsItems')
  let newItems = getTermsArray(CORLUMN_NUM, 0);
  for (let i = 0; i < CORLUMN_NUM; i++) {
    const v = {
      width: ITEM_DEFAULT_WIDTH,
      height: 0,
      key: `gasket-${i}`,
    };
    newItems[i].push(v);
    columnHeightList[i] += OFFSET_ITEM_ROW;
  }
  // console.log('newItems==', newItems)

  return newItems;
}
const DefaultCulumnsItems = getDefaultCulumnsItems();

let pastScrollTop = 0;


// 能否下拉信号量标识：处理虚拟列表尾数大于总数的长度，等待总数加载.
let waitFlag = false;
let waitTopFlag = false;
let topWaitFlag = false;


// 每次分页请求数量
const PAGE_NUM = 800;//todo
// 异步请求标识值:与末尾下标的差
const REQUEST_FLAG = 50;
// 总数量
let allItems = creactList(PAGE_NUM);

function MultiDemoScroll() {
  const scrollRef = useRef(null);
  const columnsWrapperRef = useRef(null);

  // const scrollPastTopRef = useRef(null);

  // 虚拟列表数据对象
  const [columnItems, setColumnItems] = useState(DefaultCulumnsItems);

  const [loadedUp, setLoadedUp] = useState(Date.now());//上拉完成是'up',下拉完成是'down'
  const [loadedDown, setLoadedDown] = useState(Date.now());//上拉完成是'up',下拉完成是'down'

  useEffect(() => {
    waitFlag = false;
    throttleFlag = false;
  }, [loadedUp])

  useEffect(() => {
    topWaitFlag = false;
    throttleFlag = false;
  }, [loadedDown])
  //  找最短列
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
  const addItemsToBottomColumns = useCallback((needAddNum, columnItems) => {
    let newColumns = [...columnItems];
    const bLen = BOTTOM_LIST.length;
    if (bLen > 0) {
      const needAddList = BOTTOM_LIST.pop();

      const needLen = needAddList.length;
      for (let i = needLen - 1; i >= 0; i--) {
        const currentItem = needAddList[i];
        // 加入数组时会带上这个标识符
        const num = currentItem.belong;
        newColumns[num].push(currentItem);
        // 记录高度
        columnHeightList[num] += (currentItem.height + OFFSET_ITEM_ROW);
        endIndex += 1;
      }

    } else {
      for (let i = 0; i < needAddNum; i++) {
        const num = findShortestColumn();
        newColumns[num].push(allItems[endIndex + i]);
        columnHeightList[num] += allItems[endIndex + i].height + OFFSET_ITEM_ROW;
      }
      endIndex += needAddNum;
    }
    // setColumnItems(newColumns);
    return newColumns
  }, [findShortestColumn]);

  // 下拉时，删除虚拟列表上方数据的过程，找最长列，一个个删。当然，也可以一列列删，这样的化，
  // 这样TOP_LIST数据结构是需要增加记录每一次的数据。取的时候就可以一次取完 
  const delListTopItems = useCallback((scTop, columnItems) => {
    // 每列依次删除到距离阀值最近位置，并记录每列删除的高度。
    const delHeightReords = [];
    // 每列新数据
    const newColumnsItems = [];

    // 此次删除的元素集合
    let topListItems = [];

    for (let i = 0; i < CORLUMN_NUM; i++) {
      let n = 1;
      let h = columnItems[i][n].height + OFFSET_ITEM_ROW;

      while (h < scTop - columnItems[i][0].height - OFFSET_ITEM_ROW - TOP_FLAG - OFFSET) {
        if (n > 0) {
          const newItem = columnItems[i][n];
          newItem.belong = i;
          topListItems.push(newItem);
        }
        n += 1;
        h += columnItems[i][n].height + OFFSET_ITEM_ROW;
      }
      // let sIndex = 0
      // if (n <= 0) {
      //   sIndex = 1;
      // } else {
      //   sIndex = n;
      // }
      const arr = columnItems[i].slice(n);
      newColumnsItems.push([columnItems[i][0], ...arr]);
      const delHeight = h - columnItems[i][n].height - OFFSET_ITEM_ROW;

      delHeightReords.push(delHeight);
    }
    // 记录此次删除元素集合
    if (topListItems.length <= 0) {
      return newColumnsItems;
    }
    TOP_LIST.push(topListItems);
    //计算每列与最大删除值的差。
    // const minDelHeight = Math.min(...delHeightReords);

    // 补全差值
    for (let i = 0; i < CORLUMN_NUM; i++) {
      // const gasketHeight = delHeightReords[i] - minDelHeight;
      // 重制垫片高度
      // console.log('delHeightReords===', newColumnsItems[i][0].height, delHeightReords)
      newColumnsItems[i][0].height = newColumnsItems[i][0].height + delHeightReords[i];
      // columnHeightList[i] = columnHeightList[i] + delHeightReords[i];
      currentGasketList[i] = newColumnsItems[i][0].height;
    }

    // 渲染
    // setColumnItems(newColumnsItems);
    return newColumnsItems;
  }, []);

  // 初始化 
  const init = useCallback(() => {
    console.log('init')
    const newColumnsItems = addItemsToBottomColumns(ADD_NUM, columnItems);
    setColumnItems(newColumnsItems)
  }, [columnItems, addItemsToBottomColumns]);

  useEffect(() => {
    init();
  }, []);

  // 本地数据加载完
  const extraLoad = useCallback(() => {
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
    return newEndIndex;
  }, [])

  // 下拉加载  计算一次加载和删除的过程.
  const getBottomNewShowItems = useCallback((scTop) => {
    console.log('下拉加载开始', throttleFlag, waitFlag);

    if (throttleFlag || waitFlag) {
      return;
    }

    throttleFlag = true;

    const newEndIndex = extraLoad();
    let newColumnsItems = addItemsToBottomColumns(newEndIndex - endIndex, columnItems);
    newColumnsItems = delListTopItems(scTop, newColumnsItems);

    console.log('下拉加载结束');
    setColumnItems(newColumnsItems);

    setLoadedDown(Date.now());

  }, [columnItems, addItemsToBottomColumns, delListTopItems, extraLoad])

  // 上拉加载元素
  const addItemsToTopColumns = useCallback((list) => {
    let newColumns = [...list];
    // const len = TOP_LIST.length;
    // 添加数据
    // console.log('0000000000', TOP_LIST.length, TOP_LIST[0].toString());
    if (TOP_LIST.length > 0) {
      const needAddList = TOP_LIST.pop();
      const needLen = needAddList.length;
      // 记录每列新增元素的高度。
      let addHeightReords = [0, 0, 0, 0];
      // 添加元素前的高度
      // const pastColumnHeightList = [...columnHeightList];
      for (let i = needLen - 1; i >= 0; i--) {
        const currentItem = needAddList[i];
        // 加入数组时会带上这个标识符
        const num = currentItem.belong;
        newColumns[num].splice(1, 0, currentItem);
        // 记录高度
        addHeightReords[num] = (addHeightReords[num] || 0) + (currentItem.height + OFFSET_ITEM_ROW);
      }

      for (let i = 0; i < CORLUMN_NUM; i++) {
        newColumns[i][0].height = newColumns[i][0].height - addHeightReords[i];
        currentGasketList[i] = currentGasketList[i] - addHeightReords[i];

      }
      // setColumnItems(newColumns)
    } else {
      //无需加载，已经到最开始位置
      topWaitFlag = true
    }
    return newColumns
  }, []);

  // 上拉删除下方元素
  const delListBottomItems = useCallback((columnItems, scBottom) => {
    const newColumnsItems = [...columnItems];
    let bottomListItems = [];

    for (let i = 0; i < CORLUMN_NUM; i++) {
      let n = columnItems[i].length - 1;
      let h = columnItems[i][n].height + OFFSET_ITEM_ROW;

      const limitHeight = scBottom - TOP_FLAG - OFFSET;
      while (h < limitHeight) {
        if (n > 0) {
          const newItem = columnItems[i][n];
          newItem.belong = i;
          bottomListItems.push(newItem);
        }
        n -= 1;
        h += columnItems[i][n].height + OFFSET_ITEM_ROW;
      }
      if (n === (columnItems[i].length - 1)) {
        // 不用处理
      } else {
        newColumnsItems[i] = columnItems[i].slice(0, n + 1);
        const delHeight = h - columnItems[i][n].height - OFFSET_ITEM_ROW;
        columnHeightList[i] -= delHeight;
      }
    }
    if (bottomListItems.length > 0) {
      // 记录此次删除元素集合
      BOTTOM_LIST.push(bottomListItems);
      waitFlag = false;
      endIndex = endIndex - bottomListItems.length;

    }

    return newColumnsItems
  }, []);

  // 上拉加载 todo
  const getTopNewShowItems = useCallback((scBottom) => {
    if (throttleFlag && topWaitFlag) {
      return;
    }
    console.log('上拉加载开始');
    throttleFlag = true;

    // 先加载
    let newColumnsItems = addItemsToTopColumns(columnItems);

    //删除数据 todo
    newColumnsItems = delListBottomItems(newColumnsItems, scBottom);
    // 渲染 todo
    setColumnItems(newColumnsItems)

    setLoadedUp(Date.now());
    console.log('上拉加载结束');
  }, [columnItems, addItemsToTopColumns, delListBottomItems]);

  const handle = useCallback((e) => {
    const targetDom = e.target;
    // 最短列下方距离
    const shortestHeight = Math.min(...columnHeightList);
    const bottomOffset = shortestHeight - targetDom.scrollTop - targetDom.clientHeight;
    // 上方距离
    const topOffset = targetDom.scrollTop - Math.max(...currentGasketList);

    if (pastScrollTop < targetDom.scrollTop) {
      // 当底部距离可视区域位置达到阀值时
      if (bottomOffset < BOTTOM_FLAG) {
        // todo 具体策略，细节可以根据需求变化，
        // 下拉加载
        // console.log('下拉加载');
        if (waitTopFlag) {
          return;
        } else {
          waitTopFlag = true;
          getBottomNewShowItems(targetDom.scrollTop);
          setTimeout(() => {
            waitTopFlag = false;
          }, 200)
        }
      }
    } else {
      if (topOffset < TOP_FLAG && TOP_LIST.length > 0) {
        // console.log('上拉加载');
        // throttle(getTopNewShowItems(targetDom.scrollTop))
        if (waitTopFlag) {
          return;
        } else {
          waitTopFlag = true;
          getTopNewShowItems(targetDom.scrollHeight - targetDom.scrollTop - targetDom.clientHeight);
          setTimeout(() => {
            waitTopFlag = false;
          }, 200)
        }
      }
    }
    pastScrollTop = targetDom.scrollTop

  }, [getBottomNewShowItems, getTopNewShowItems]);

  useEffect(() => {
    const node = scrollRef && scrollRef.current;
    if (node) {
      node.addEventListener('scroll', handle)
      // scrollRef.current.scrollTo(0, willScrollHeight)
    }
    return () => {
      if (node) {
        node.removeEventListener('scroll', handle);
      }
    }
  }, [columnItems, handle]);

  return (
    <div
      className='wrapper'
      ref={scrollRef}
    >
      <div
        className='columns_wrapper'
        ref={columnsWrapperRef}
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

