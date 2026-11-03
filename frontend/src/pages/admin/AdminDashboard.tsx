// Page-specific styling for the Admin Dashboard
import "./AdminDashboard.css";

// Reuses the shared website header
import Header from "../../components/Header/Header";

// Link allows navigation to other pages without reloading the website
import { Link } from "react-router-dom";


import { useEffect, useState } from "react";

function AdminDashboard() {

    // Stores the logged-in admin's organization name
    const [organizationName, setOrganizationName] = useState("Loading...");
    // Stores the number of customers currently waiting in this admin's queues
    const [peopleWaiting, setPeopleWaiting] = useState(0);
    // Stores the number of active queues owned by the logged-in admin
    const [activeQueues, setActiveQueues] = useState(0);
    useEffect(() => {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        async function loadCurrentAdmin() {
            const response = await fetch(
                `${apiBaseUrl}/auth/get_current_account`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                return;
            }

            const account = await response.json();

            // Gets the number of active queues owned by this admin
            const activeQueuesResponse = await fetch(
                `${apiBaseUrl}/database/queue/count_active_${account.admin_id}`,
                {
                    credentials: "include",
                }
            );

            if (activeQueuesResponse.ok) {
                const activeQueueCount = await activeQueuesResponse.json();
                setActiveQueues(activeQueueCount);
            }

            setOrganizationName(account.organization_name);

            // Gets the number of customers waiting in queues owned by this admin
            const waitingResponse = await fetch(
                `${apiBaseUrl}/database/customer/count_waiting_${account.admin_id}`,
                {
                    credentials: "include",
                }
            );

            if (waitingResponse.ok) {
                const waitingCount = await waitingResponse.json();
                setPeopleWaiting(waitingCount);
            }
        }

        void loadCurrentAdmin();
    }, []);



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

                    {/* Displays the organization information */}
                    <p><strong>Organization</strong></p>
                    <p>{organizationName}</p>

                </section> {/* End organization information */}


                    {/* ===== Dashboard Statistics ===== */}
                    {/* Displays important organization information in a 2x2 grid */}
                    <div className="admin-dashboard-grid">

                        <div className="admin-dashboard-item">
                            <strong>Active Queues</strong>
                            <p>{activeQueues}</p>
                        </div>

                        <div className="admin-dashboard-item">
                            <strong>People Waiting</strong>
                            <p>{peopleWaiting}</p>
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