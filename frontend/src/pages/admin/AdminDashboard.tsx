// Page-specific styling for the Admin Dashboard
import "./AdminDashboard.css";

// Reuses the shared website header
import Header from "../../components/Header/Header";

// Link allows navigation to other pages without reloading the website
import { Link } from "react-router-dom";

function AdminDashboard() {

    // Placeholder values that will later come from the database
    const organizationName = "<Organization Name>";
    const locationName = "<Location>";

    // Defines what the Admin Dashboard displays
    return (
        <div className="admin-dashboard-page">

            {/* Reuses the shared website header */}
            <Header />

            {/* Contains the main content of the Admin Dashboard */}
            <main className="admin-dashboard-main">

                {/* ===== Organization Information ===== */}
                <section className="admin-dashboard-content">

                    {/* Main page title */}
                    <h1 className="admin-dashboard-title">
                        Admin Dashboard
                    </h1>

                    {/* Displays the organization and location information */}
                    <p><strong>Organization</strong></p>
                    <p>{organizationName}</p>

                    <p><strong>Location</strong></p>
                    <p>{locationName}</p>

                </section> {/* End organization information */}


                    {/* ===== Dashboard Statistics ===== */}
                    {/* Displays important organization information in a 2x2 grid */}
                    <div className="admin-dashboard-grid">

                        <div className="admin-dashboard-item">
                            <strong>Active Queues</strong>
                            <p>&lt;Count&gt;</p>
                        </div>

                        <div className="admin-dashboard-item">
                            <strong>People Waiting</strong>
                            <p>&lt;Count&gt;</p>
                        </div>

                        <div className="admin-dashboard-item">
                            <strong>Active Staff</strong>
                            <p>&lt;Count&gt;</p>
                        </div>

                        <div className="admin-dashboard-item">
                            <strong>Average Wait</strong>
                            <p>&lt;Count&gt;</p>
                        </div>
                    </div> {/* End dashboard statistics */}


                    {/* ===== Admin Navigation ===== */}
                    {/* Links the dashboard to other admin management areas */}
                    <p className="admin-dashboard-navigation">
                        Navigation:{" "}

                        {/* This page is currently available */}
                        <Link to="/admin/Services_Queues">
                            Services & Queues
                        </Link>

                        {" · "}

                        {/* Plain text until the Staff Access page is available */}
                        <span>Staff Access</span>

                        {" · "}

                        {/* Plain text until the Monitoring page is available */}
                        <span>Monitoring, Statistics & History</span>
                    </p>

            </main> {/* End main dashboard content */}

        </div> /* End admin-dashboard-page */
    );
}

export default AdminDashboard;