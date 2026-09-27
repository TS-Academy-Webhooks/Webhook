import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
 
      <Route path="/signup" element={<Signup />} />
        
      <Route path="/forgot-password" element={<h1>Forgot Password</h1>} />

      <Route path="/dashboard" element={<h1>Dashboard</h1>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;