import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { creactList } from './config';

import './index.css';

// 元素之间的间隔
const OFFSET_ITEM = 20;

// 滚动dom距离最下面距离阀值
const BOTTOM_FLAG = 500;
// 滚动top距离最上面距离阀值
const TOP_FLAG = 500;

// 每次直接加载数量
const ADD_ITEMS_NUM = 5;

// todo:数据更改刷新后，需要重新定位的滚动值
// let willScrollHeight = 0;

// 截流控制标签
let throttleFlag = false;

// 能否下拉信号量标识：处理虚拟列表尾数大于总数的长度，等待总数加载.
let waitFlag = false;

// 首次加载位置
const DEFAULT_STA = 0;
const DEFAULT_END = 20;
// 列表对应开始值
let startIndex = DEFAULT_STA;
let endIndex = DEFAULT_END;

// 异步请求标识值:与末尾下标的差
const REQUEST_FLAG = 10;


// 每次分页请求数量
const PAGE_NUM = 100;
// 总数量
let allItems = creactList(PAGE_NUM);

function DemoScroll() {
  const scrollRef = useRef(null);
  const wrapperDomRef = useRef(null);
  const timerRef = useRef(null);

  const [showItems, setShowItems] = useState(allItems.slice(startIndex, endIndex));

  // 上拉加载
  const getTopNewShowItems = useCallback((scBottom) => {
    if (throttleFlag) {
      return;
    }
    throttleFlag = true;

    const len = showItems.length - 1
    let n = len;
    let h = showItems[n].height;;

    while (h < scBottom - BOTTOM_FLAG) {
      n -= 1;
      h += showItems[n].height;
    }
    const delNum = len - (n + 1);
    const delHeight = h - showItems[n].height;

    // 尾点
    const newEndIndex = endIndex - delNum;
    // 起点
    let newStartIndex = startIndex - ADD_ITEMS_NUM;

    // 判断起点值，这里需要重新纠正，以防allItems已经加载到开始，造成bug
    if (newStartIndex <= 0) {
      newStartIndex = 0;
    }
    const newShowItems = allItems.slice(newStartIndex, newEndIndex);
    // 计算滚动差
    // willScrollHeight = scTop - delHeight - delNum * OFFSET_ITEM;
    // console.log('sss==', willScrollHeight, scTop, delHeight, delNum, showItems, newShowItems);
    startIndex = newStartIndex;
    endIndex = newEndIndex;
    setShowItems(newShowItems);
    waitFlag = false;
    throttleFlag = false;
  }, [showItems]);

  // 计算一次加载和删除的过程.
  const getBottomNewShowItems = useCallback((scTop) => {
    if (throttleFlag || waitFlag) {
      return;
    }
    throttleFlag = true;
    let n = 0;
    let h = showItems[n].height;;

    while (h < scTop - TOP_FLAG) {
      n += 1;
      h += showItems[n].height;
    }
    const delNum = n - 1;
    // 起点
    const newStartIndex = startIndex + delNum;
    // 尾点
    let newEndIndex = endIndex + ADD_ITEMS_NUM;

    // todo 是否需要提前加载请求数据，补充allItems
    if (allItems.length - newEndIndex <= REQUEST_FLAG) {

      // todo 异步加载总数据，以下是模拟。注意：异步加载后需要判断当前是否需要重新更新显示区域数据
      if (!timerRef || !timerRef.current) {
        Promise.resolve().then((data) => {
          timerRef.current = setTimeout(() => {
            const addItems = creactList(PAGE_NUM);
            // console.log('异步请求', addItems)
            const older = [...allItems];
            allItems = [...older, ...addItems];

            waitFlag = false;
            timerRef.current = null
            clearTimeout(timerRef);

            // todo 判断当前是否需要重新更新显示区域数据
            if (endIndex >= older.length) {
              // 起点
              const newStartIndex = startIndex;
              // 尾点
              const newEndIndex = endIndex + ADD_ITEMS_NUM;
              const newShowItems = allItems.slice(newStartIndex, newEndIndex);
              setShowItems(newShowItems);
            }
          }, 2000);
        })
      }

    }

    // 判断尾点值，这里需要重新纠正，以防allItems数据没有及时新增，造成bug
    if (newEndIndex >= allItems.length) {
      newEndIndex = allItems.length;
      waitFlag = true;
    }
    const newShowItems = allItems.slice(newStartIndex, newEndIndex);
    // 计算滚动差
    // willScrollHeight = scTop - delHeight - delNum * OFFSET_ITEM;
    // console.log('sss==', willScrollHeight, scTop, delHeight, delNum, showItems, newShowItems);
    startIndex = newStartIndex;
    endIndex = newEndIndex;
    setShowItems(newShowItems);
    throttleFlag = false;
  }, [showItems]);

  const handle = useCallback((e) => {
    const targetDom = e.target;
    // console.log('targetDom==', targetDom.scrollTop, targetDom.clientHeight, targetDom.scrollHeight);
    // 下方距离
    const bottomOffset = targetDom.scrollHeight - targetDom.scrollTop - targetDom.clientHeight;
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

  }, [getBottomNewShowItems, getTopNewShowItems]);

  useEffect(() => {
    if (scrollRef && scrollRef.current) {
      scrollRef.current.addEventListener('scroll', handle)
      // scrollRef.current.scrollTo(0, willScrollHeight)
    }
    return () => {
      scrollRef.current.removeEventListener('scroll', handle)
    }
  }, [showItems]);

  return (
    <div
      className='wrapper'
      ref={scrollRef}
    >
      <div
        ref={wrapperDomRef}
      >
        {
          showItems.map((v, index) => {
            return <div
              key={v.key}//
              style={{
                width: v.width,
                height: v.height,
                background: 'red',
                marginBottom: OFFSET_ITEM
              }}
            >
              {v.key}-{v.height}
            </div>
          })
        }
      </div>
      <div>
        loading
        </div>
    </div>
  )
}
export default DemoScroll;

