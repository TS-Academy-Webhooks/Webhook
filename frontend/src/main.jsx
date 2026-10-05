import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import './styles/auth.css'
import App from './App.jsx'

const rootElement = document.getElementById("root");
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
const prerenderedPath = rootElement.dataset.prerenderedPath;
const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

if (prerenderedPath === currentPath) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}