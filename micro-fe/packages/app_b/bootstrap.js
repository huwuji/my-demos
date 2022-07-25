import React from "react";
// import { render } from "react-dom";
import App from "./app";

// const container = document.getElementById("app");
// render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   container
// );

// react 18 启动
import { createRoot } from "react-dom/client";
const container = document.getElementById("app");
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
