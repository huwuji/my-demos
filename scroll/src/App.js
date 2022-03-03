import React from 'react';
import logo from './logo.svg';
import './App.css';
import SingleDemoScroll from './components/demo-scroll-single';
import MultiDemoScroll from './components/demo-scroll-multi';

function App() {
  return (
    <div className="App">
      <div className='demo_wrapper'>
        <MultiDemoScroll />
      </div>
    </div>
  );
}

export default App;
