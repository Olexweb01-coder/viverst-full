import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@viverst/brand/studio.css'
import '@viverst/brand/base.css'
import '@viverst/brand/motion.css'
import './index.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
