import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Folosim un efect de încărcare progresivă
const renderApp = () => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Verificăm dacă documentul este gata
if (document.readyState === 'loading') {
  // Așteptăm până când documentul este complet încărcat
  document.addEventListener('DOMContentLoaded', renderApp)
} else {
  // Documentul este deja încărcat, putem randa aplicația
  renderApp()
}

// Dezactivăm StrictMode în producție pentru performanță
if (import.meta.env.PROD) {
  console.log('Running in production mode')
}
