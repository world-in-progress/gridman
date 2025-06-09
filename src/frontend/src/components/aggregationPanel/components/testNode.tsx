import React from 'react'

export default function TestNode() {
    const [count, setCount] = React.useState(0)
    const handleClickButton = () => {
        setCount(count + 1)
    }
  return (
    <button className='rounded-md bg-blue-500 hover:bg-blue-600 shadow-lg p-2 text-white font-bold cursor-pointer'
    onClick={handleClickButton}
    >
        我是测试节点{count}
    </button>
  )
}
