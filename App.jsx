import React from './core/React';

function Bbb(params) {
  return (
    <div id="bbb">
      Bbb<div>num：{params.num}</div>
    </div>
  );
}
function App() {
  return (
    <div id="app">
      App
      <Bbb num={123}></Bbb>
    </div>
  );
}

export default App;
