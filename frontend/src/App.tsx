import Home from "./pages/Home/Home";
import Login from "./pages/login/Login";
import AdminSignup from "./pages/signup/admin/AdminSignup";

function App() {
    if (window.location.pathname === "/login") {
        return <Login />;
    }

    if (window.location.pathname === "/signup/admin") {
        return <AdminSignup />;
    }

    return <Home />;
}

export default App;