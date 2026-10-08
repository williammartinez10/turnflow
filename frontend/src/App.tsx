import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import CustomerJoinQueue from "./pages/customer/access/CustomerJoinQueue";
import CustomerFindTicket from "./pages/customer/access/CustomerFindTicket";
import CustomerServiceInfo from "./pages/customer/interface/CustomerServiceInfo";
import CustomerJoinDetails from "./pages/customer/interface/CustomerJoinDetails";
import CustomerQueueStatus from "./pages/customer/interface/CustomerQueueStatus";
import Login from "./pages/login/Login";
import AdminSignup from "./pages/signup/admin/AdminSignup";
import StaffCode from "./pages/signup/staff/StaffCode/StaffCode";
import StaffSignup from "./pages/signup/staff/StaffSignup/StaffSignup";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join-queue" element={<CustomerJoinQueue />} />
      <Route path="/find-ticket" element={<CustomerFindTicket />} />
      <Route path="/service-information" element={<CustomerServiceInfo />} />
      <Route path="/join-details" element={<CustomerJoinDetails />} />
      <Route path="/queue-status" element={<CustomerQueueStatus />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup/admin" element={<AdminSignup />} />
      <Route path="/signup/staff/staff_code" element={<StaffCode />} />
      <Route path="/signup/staff" element={<StaffSignup />} />
    </Routes>
  );
}

export default App;