import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/common/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import Webhooks from "./pages/webhooks/Webhooks.jsx";
import WebhookEndpoints from "./pages/webhooks/WebhookEndpoints.jsx";
import CreateWebhook from "./pages/webhooks/CreateWebhook.jsx";
import EditWebhook from "./pages/webhooks/EditWebhook.jsx";
import WebhookDetails from "./pages/webhooks/WebhookDetails.jsx";
import Events from "./pages/Events.jsx";
import EventDetails from "./pages/deliveries/EventDetails.jsx";
import Deliveries from "./pages/deliveries/Deliveries.jsx";
import DeliveryDetails from "./pages/deliveries/DeliveryDetails.jsx";
import DeliveryHistory from "./pages/deliveries/DeliveryHistory.jsx";
import Settings from "./pages/settings/Settings.jsx";
import WebhookEventDetails from "./components/webhooks/WebhookEventDetails.jsx";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/webhooks" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/events" element={<Events />} />
                            <Route path="/events/:eventId" element={<EventDetails />} />
                            <Route path="/deliveries" element={<Deliveries />} />
                            <Route path="/deliveries/:id" element={<DeliveryDetails />} />
                            <Route path="/webhooks/:webhookId/history" element={<DeliveryHistory />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/webhooks" element={<Webhooks />} />
                            <Route path="/webhooks/:id" element={<WebhookEventDetails />} />
                            <Route path="/settings/webhooks" element={<WebhookEndpoints />} />
                            <Route path="/settings/webhooks/new" element={<CreateWebhook />} />
                            <Route path="/settings/webhooks/:id/edit" element={<EditWebhook />} />
                            <Route path="/settings/webhooks/:id" element={<WebhookDetails />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/webhooks" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
