import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent native text/element selection and image drag across the entire window
if (typeof window !== 'undefined') {
  window.addEventListener('selectstart', (e) => e.preventDefault());
  window.addEventListener('dragstart', (e) => e.preventDefault());
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

