import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@boomi/exosphere/dist/styles.css'
import '@boomi/exosphere/dist/icon.js'
import './global.css'
import UserStoriesPage from './components/UserStories/UserStoriesPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserStoriesPage onBack={() => { window.location.href = import.meta.env.BASE_URL; }} />
  </StrictMode>,
)
