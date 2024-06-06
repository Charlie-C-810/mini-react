import React from "./core/React.js"

function App() {
  const handleClick = () => {
    confirm("click")
  }
  return (
    <div onClick={handleClick}>
      App
    </div>
  )
}

export default App

