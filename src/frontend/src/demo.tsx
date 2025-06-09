import { useState } from "react"
import { toast } from "sonner"



export default function Demo() {

    const [count, setCount] = useState(0)

    const handleClick = () => {
        console.log('点击了')
        toast.success('点击了')
        setCount(count + 1)
    }

    return (
        <div className='flex flex-col items-center justify-center h-screen bg-amber-200 space-y-4'>
            <div className='text-2xl font-bold'>
                你好
            </div>
            <button
                className='bg-blue-500 hover:bg-blue-600 w-20 text-white p-2 rounded-md cursor-pointer'
                onClick={handleClick}
            >
                <div>点击我</div>
                <div>count:{count}</div>
            </button>
        </div>

    )
}
