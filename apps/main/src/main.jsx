import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Order matters: fonts and tokens first, then the base layer, then app styles.
// `.container` uses padding-inline and components use padding-block so the two
// can never overwrite each other whichever way the bundler orders them.
import '@viverst/brand/main.css'
import '@viverst/brand/base.css'
import '@viverst/brand/motion.css'
import './index.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
