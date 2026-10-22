import { Link } from "react-router-dom";

function DevPage() {
    return (
        <div>
            <h1>Development Pages</h1>

            <Link to="/">Home</Link><br />
            <Link to="/login">Login</Link><br />
            <Link to="/join-queue">Join Queue</Link><br />
            <Link to="/find-ticket">Find Ticket</Link><br />
            <Link to="/service-information">Service Information</Link><br />
            <Link to="/join-details">Join Details</Link><br />
            <Link to="/queue-status">Queue Status</Link><br />
            <Link to="/signup/admin">Admin Signup</Link><br />
            <Link to="/signup/staff">Staff Signup</Link><br />
            <Link to="/admin/AdminDashboard">Admin Dashboard</Link><br />
            <Link to="/admin/Services_Queues">Services & Queues</Link>
        </div>
    );
}

export default DevPage;