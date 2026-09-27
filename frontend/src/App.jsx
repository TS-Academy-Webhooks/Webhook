// src/App.jsx
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/common/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import Webhooks from "./pages/webhooks/Webhooks.jsx";
import CreateWebhook from "./pages/webhooks/CreateWebhook.jsx";
import EditWebhook from "./pages/webhooks/EditWebhook.jsx";
import WebhookDetails from "./pages/webhooks/WebhookDetails.jsx";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* No auth state to check yet on "/" itself — ProtectedRoute
                        below decides whether this actually lands on the
                        dashboard or bounces to /login. */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />

                            <Route path="/webhooks" element={<Webhooks />} />
                            <Route path="/webhooks/new" element={<CreateWebhook />} />
                            <Route path="/webhooks/:id/edit" element={<EditWebhook />} />
                            <Route path="/webhooks/:id" element={<WebhookDetails />} />
                        </Route>
                    </Route>

                    <Route path="/forgot-password" element={<h1>Forgot Password</h1>} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;