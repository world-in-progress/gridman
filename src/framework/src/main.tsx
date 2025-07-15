import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './includes/i18n'

createRoot(document.getElementById('root')!).render(
  <App />
)
