import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/common/ProtectedRoute.jsx";
import Seo from "./components/Seo.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import MarketingHome from "./pages/MarketingHome.jsx";
import About from "./pages/About.jsx";
import Docs from "./pages/Docs.jsx";
import Tracking from "./pages/Tracking.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Shipments from "./pages/shipments/Shipments.jsx";
import CreateShipment from "./pages/shipments/CreateShipment.jsx";
import ShipmentDetails from "./pages/shipments/ShipmentDetails.jsx";
import Events from "./pages/Events.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import Deliveries from "./pages/deliveries/Deliveries.jsx";
import DeliveryDetails from "./pages/deliveries/DeliveryDetails.jsx";
import DeliveryHistory from "./pages/deliveries/DeliveryHistory.jsx";
import Settings from "./pages/settings/Settings.jsx";
import ApiKeys from "./pages/settings/ApiKeys.jsx";
import WebhookEndpoints from "./pages/webhooks/WebhookEndpoints.jsx";
import CreateWebhook from "./pages/webhooks/CreateWebhook.jsx";
import EditWebhook from "./pages/webhooks/EditWebhook.jsx";
import WebhookDetails from "./pages/webhooks/WebhookDetails.jsx";
import DemoReceiver from "./pages/DemoReceiver.jsx";

function NotFound() {
    return (
        <main className="not-found-page">
            <p className="public-page__eyebrow">404</p>
            <h1>Page not found</h1>
            <p>This page may have moved, or the address may be incorrect.</p>
            <Link to="/">Return to Waybridge</Link>
        </main>
    );
}

export function AppRoutes() {
    return (
        <>
            <Seo />
            <Routes>
                <Route path="/" element={<MarketingHome />} />
                <Route path="/about" element={<About />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/track" element={<Tracking />} />
                <Route path="/track/:trackingNumber" element={<Tracking />} />
                <Route path="/tracking" element={<Navigate to="/track" replace />} />
                <Route path="/tracking/:trackingNumber" element={<Tracking />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/shipments" element={<Shipments />} />
                        <Route path="/shipments/new" element={<CreateShipment />} />
                        <Route path="/shipments/:id" element={<ShipmentDetails />} />

                        <Route path="/webhooks" element={<WebhookEndpoints />} />
                        <Route path="/webhooks/new" element={<CreateWebhook />} />
                        <Route path="/webhooks/:webhookId/history" element={<DeliveryHistory />} />
                        <Route path="/webhooks/:id/edit" element={<EditWebhook />} />
                        <Route path="/webhooks/:id" element={<WebhookDetails />} />

                        <Route path="/deliveries" element={<Deliveries />} />
                        <Route path="/deliveries/:id" element={<DeliveryDetails />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/settings/api-keys" element={<ApiKeys />} />
                        <Route path="/tools/demo-receiver" element={<DemoReceiver />} />

                        <Route path="/settings/webhooks" element={<WebhookEndpoints />} />
                        <Route path="/settings/webhooks/new" element={<CreateWebhook />} />
                        <Route path="/settings/webhooks/:id/edit" element={<EditWebhook />} />
                        <Route path="/settings/webhooks/:id" element={<WebhookDetails />} />

                        <Route element={<ProtectedRoute requiredRole="admin" />}>
                            <Route path="/events" element={<Events />} />
                            <Route path="/events/:id" element={<EventDetails />} />
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
