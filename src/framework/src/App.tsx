import { useState } from 'react'
import './App.css'
import Framework from './components/framework'
import { Toaster } from './components/ui/sonner'
import store from './store'
import Loader from './components/ui/loader'

function App() {

    const [isLoading, setIsLoading] = useState(false)

    store.set('isLoading', {
        on: () => {
            setIsLoading(true)
        },
        off: () => {
            setIsLoading(false)
        }
    })

    return (
        <>
            {isLoading && (
                <>
                    <div className="fixed inset-0 pointer-events-auto z-80 bg-[#212121] opacity-30" />
                    <Loader />
                </>
            )}
            <Framework />
            <Toaster
                position="bottom-right"
                richColors
                closeButton
                style={{
                    bottom: '1.5rem',
                    right: '1.5rem',
                }}
            />
        </>
    )
}

export default App
