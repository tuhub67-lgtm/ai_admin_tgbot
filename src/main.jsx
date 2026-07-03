import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './design/styles.css'
import './styles/landing.css'
// Самостоятельный хостинг шрифтов — импортируем ПОСЛЕ дизайн-системы, чтобы
// локальные @font-face перекрыли Google-@import (в РФ он часто недоступен →
// иначе интерфейс падает на системный шрифт).
import './styles/fonts.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
