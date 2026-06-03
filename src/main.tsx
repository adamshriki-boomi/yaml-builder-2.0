import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@boomi/exosphere/dist/styles.css'
import '@boomi/exosphere/dist/exo-component-theme.css'
import '@boomi/exosphere/dist/icon.js'
import './global.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
