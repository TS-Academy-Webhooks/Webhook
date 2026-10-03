import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { AuthProvider } from "./context/AuthContext.jsx";

import "./styles/global.css";
import "./styles/auth.css";
import "./styles/DashboardLayout.css";
import "./styles/Dashboard.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);