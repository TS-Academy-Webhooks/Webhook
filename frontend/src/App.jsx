// src/App.jsx
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Webhooks from "./pages/webhooks/Webhooks.jsx";
import CreateWebhook from "./pages/webhooks/CreateWebhook.jsx";
import EditWebhook from "./pages/webhooks/EditWebhook.jsx";
import WebhookDetails from "./pages/webhooks/WebhookDetails.jsx";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/*<Route path="/" element={<Login />} />*/}
                {/*<Route path="/signup" element={<Signup />} />*/}

                {/* No login page wired up yet, so land on the dashboard
                    directly for now. Swap this back to <Login /> once
                    auth pages exist. */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/webhooks" element={<Webhooks />} />
                    <Route path="/webhooks/new" element={<CreateWebhook />} />
                    <Route path="/webhooks/:id/edit" element={<EditWebhook />} />
                    <Route path="/webhooks/:id" element={<WebhookDetails />} />
                </Route>

                <Route path="/forgot-password" element={<h1>Forgot Password</h1>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;