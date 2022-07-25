import React, { Suspense, lazy } from "react";

const App_A_Button = lazy(() => import("app1/button"));
const CompB = () => {
  return (
    <div>
      这个是一个App_b应用
      <Suspense fallback="loading">
        <App_A_Button>{"按钮文本"}</App_A_Button>
      </Suspense>
    </div>
  );
};

export default CompB;
