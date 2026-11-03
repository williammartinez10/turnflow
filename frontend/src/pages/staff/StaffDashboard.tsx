// Page-specific styling for the Staff Dashboard
import "./StaffDashboard.css";

// Reuses the shared website header
import Header from "../../components/Header/Header";

// Link allows navigation to other pages without reloading the website
import { Link } from "react-router-dom";


import { useEffect, useState } from "react";

function StaffDashboard() {
    return (
        <div className="staff-dashboard-page">
            <Header />

            <main className="staff-dashboard-main">
                <section className="staff-dashboard-content">

                    <h1 className="staff-dashboard-title">
                        Staff Dashboard
                    </h1>

                    {/* Organization information */}
                    <section className="staff-organization">
                        <h2>Organization</h2>

                        <p className="staff-organization-name">
                            {"<Organization Name>"}
                        </p>
                    </section>

                    {/* Queues/services assigned to this staff member */}
                    <section className="staff-assigned-section">
                        <h2>Assigned queues / services</h2>

                        <div className="staff-assigned-list">
                            <div className="staff-assigned-row">
                                <span>{"<Queue / Service Name>"}</span>
                                <span>{"<Count> waiting"}</span>
                            </div>
                        </div>
                    </section>

                    <p className="staff-dashboard-note">
                        Only assigned queues are visible.
                    </p>

                </section>
            </main>
        </div>
    );
}

export default StaffDashboard;