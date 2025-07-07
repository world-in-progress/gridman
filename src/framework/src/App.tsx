import './App.css'
import Framework from './components/framework'
import { Toaster } from './components/ui/sonner'

function App() {

    return (
        <>
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
