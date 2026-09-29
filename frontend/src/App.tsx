import Home from "./pages/Home/Home";
import Login from "./pages/login/Login";
import AdminSignup from "./pages/signup/admin/AdminSignup";
import StaffCode from "./pages/signup/staff/StaffCode/StaffCode";
import StaffSignup from "./pages/signup/staff/StaffSignup/StaffSignup";

function App() {
    if (window.location.pathname === "/login") {
        return <Login />;
    }

    if (window.location.pathname === "/signup/admin") {
        return <AdminSignup />;
    }

    if (window.location.pathname === "/signup/staff/staff_code") {
        return <StaffCode />;
    }

    if (window.location.pathname === "/signup/staff") {
        return <StaffSignup />;
    }

    return <Home />;
}

export default App;