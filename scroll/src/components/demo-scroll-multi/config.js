import React, { useEffect, useState, useRef } from 'react';
/**
 * 列表项基本数据结构
 */
const RANGE_VALUE = 10;

export function creactList(len = 10) {
  let res = [];
  for (let i = 0; i < len; i++) {
    // const randomW = RANGE_VALUE + Math.floor(Math.random());
    const randomH = 50 * Math.floor(1 + RANGE_VALUE * Math.random());
    res[i] = {
      width: 200,
      height: randomH,
      key: i,
      belong: null,//todo 所属列。‘’标示未归类
    };
  }
  return res
}

/**
 * 截流函数
 */

export const useThrottle = (value, delay) => {
  const [state, setThrottle] = useState(value)
  let timer = useRef(null);

  useEffect(() => {
    if (!timer) {
      timer.current = setTimeout(() => {
        setThrottle(value)
      }, delay);
    }
    return () => {
      clearTimeout(timer);
    }
  }, [value, delay]);
  return state
}


export const throttle = (fn, delay = 200) => {
  let timer = null;
  let flag = false;

  return () => {
    if (flag || timer) {
      // 跳过
    } else {
      flag = true;
      timer = setTimeout(() => {
        fn();
        timer = null;
        flag = false;
      }, delay);
    }
  }
}
