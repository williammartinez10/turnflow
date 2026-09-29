import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/login/Login";
import AdminSignup from "./pages/signup/admin/AdminSignup";
import StaffCode from "./pages/signup/staff/StaffCode/StaffCode";
import StaffSignup from "./pages/signup/staff/StaffSignup/StaffSignup";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup/admin" element={<AdminSignup />} />
      <Route path="/signup/staff/staff_code" element={<StaffCode />} />
      <Route path="/signup/staff" element={<StaffSignup />} />
    </Routes>
  );
}

export default App;