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
const DEFAULT_END = 10;
// 列表对应开始值
let startIndex = DEFAULT_STA;
let endIndex = DEFAULT_END;

function DemoScroll() {
  const scrollRef = useRef(null);
  const wrapperDomRef = useRef(null);

  const [allItems, setAllItems] = useState(creactList(100));
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
  }, [showItems, allItems]);

  // 先加载，再删除.
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
    // console.log('n,h=', n, h, startIndex, endIndex)
    const delNum = n - 1;
    // const delHeight = h - showItems[n].height;
    // 起点
    const newStartIndex = startIndex + delNum;
    // 尾点
    const newEndIndex = endIndex + ADD_ITEMS_NUM;
    // 判断尾点值，这里需要重新纠正，以防allItems数据没有及时新增，造成bug
    if (newEndIndex >= allItems.length) {
      waitFlag = true;
      throttleFlag = false;
      // todo：异步加载总数据，

      return;
    }
    const newShowItems = allItems.slice(newStartIndex, newEndIndex);
    // 计算滚动差
    // willScrollHeight = scTop - delHeight - delNum * OFFSET_ITEM;
    // console.log('sss==', willScrollHeight, scTop, delHeight, delNum, showItems, newShowItems);
    startIndex = newStartIndex;
    endIndex = newEndIndex;
    setShowItems(newShowItems);
    throttleFlag = false;
  }, [showItems, allItems]);

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
      // todo 上拉加载
      getTopNewShowItems(bottomOffset);
    }

  }, [getBottomNewShowItems]);

  useEffect(() => {
    if (scrollRef && scrollRef.current) {
      scrollRef.current.addEventListener('scroll', handle)
      // scrollRef.current.scrollTo(0, willScrollHeight)
    }

    // setTimeout(() => {
    //   const s = showItems[0] || {}
    //   console.log('000===', scrollRef.current.scrollTop);
    //  todo 应该滚动的距离
    //   scrollV = scrollRef.current.scrollTop - s.height - OFFSET_ITEM;
    //   setShowItems(showItems.slice(1));

    // }, 3000);
    return () => {
      scrollRef.current.removeEventListener('scroll', handle)
    }
  }, [showItems]);

  // useEffect(() => {

  //   setInterval(() => {
  //     console.log('sss==', scrollRef.current.scrollTop);
  //     setShowItems(showItems.slice(1));
  //     // scrollRef.current.scrollTo(0, scrollRef.current.scrollTop - 100)
  //   }, 2000);

  // }, [showItems])
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

