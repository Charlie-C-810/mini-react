import React from "./core/React.js"

let count = 0

function App() {
 const handleClick = () => {
  count++
  React.update()
 }
 return (
  <div>
   count：
   {count}
   <button onClick={handleClick}>+1</button>
  </div>
 )
}

export default App

