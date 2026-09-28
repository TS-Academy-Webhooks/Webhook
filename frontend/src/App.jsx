import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Deliveries from "./pages/deliveries/Deliveries";
import DeliveryDetails from "./pages/deliveries/DeliveryDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<h1>Forgot Password</h1>} />
        <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/deliveries/:id" element={<DeliveryDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;