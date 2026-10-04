// src/App.jsx
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Webhooks from "./pages/webhooks/Webhooks.jsx";
import WebhookEndpoints from "./pages/webhooks/WebhookEndpoints.jsx";
import CreateWebhook from "./pages/webhooks/CreateWebhook.jsx";
import EditWebhook from "./pages/webhooks/EditWebhook.jsx";
import WebhookDetails from "./pages/webhooks/WebhookDetails.jsx";
import Events from "./pages/Events.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import Deliveries from "./pages/deliveries/Deliveries.jsx";
import DeliveryDetails from "./pages/deliveries/DeliveryDetails.jsx";
import Settings from "./pages/settings/Settings.jsx";
import WebhookEventDetails from "./components/webhooks/WebhookEventDetails.jsx";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/webhooks" replace />} />

                    <Route element={<DashboardLayout />}>
                        <Route path="/events" element={<Events />} />
                        <Route path="/events/:id" element={<EventDetails />} />
                        <Route path="/deliveries" element={<Deliveries />} />
                        <Route path="/deliveries/:id" element={<DeliveryDetails />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/webhooks" element={<Webhooks />} />
                        <Route path="/webhooks/:id" element={<WebhookEventDetails />} />
                        <Route path="/settings/webhooks" element={<WebhookEndpoints />} />
                        <Route path="/settings/webhooks/new" element={<CreateWebhook />} />
                        <Route path="/settings/webhooks/:id/edit" element={<EditWebhook />} />
                        <Route path="/settings/webhooks/:id" element={<WebhookDetails />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/webhooks" replace />} />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
