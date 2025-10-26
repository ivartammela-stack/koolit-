import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import {
  FuturisticLoginRHFUI_3D,
  FuturisticRegisterRHF,
  FuturisticForgotRHF
} from './components/NeonAuthKit'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<FuturisticLoginRHFUI_3D loginUrl="/api/auth/login" />} />
        <Route path="/register" element={<FuturisticRegisterRHF registerUrl="/api/auth/register" />} />
        <Route path="/forgot" element={<FuturisticForgotRHF forgotUrl="/api/auth/forgot" />} />
        <Route path="*" element={<FuturisticLoginRHFUI_3D />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
