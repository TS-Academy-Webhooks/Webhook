import {BrowserRouter, Routes, Route} from "react-router-dom";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/*<Route path="/" element={<Login />} />*/}

                {/*<Route path="/signup" element={<Signup />} />*/}

                <Route path="webhooks" element={<Webhooks />} />
                <Route path="webhooks/new" element={<CreateWebhook />} />
                <Route path="webhooks/:id/edit" element={<EditWebhook />} />
                <Route path="webhooks/:id" element={<WebhookDetails />} />

                <Route path="/forgot-password" element={<h1>Forgot Password</h1>}/>

                <Route path="/dashboard" element={<h1>Dashboard</h1>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;