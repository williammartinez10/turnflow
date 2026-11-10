// Page-specific styling for the Staff Dashboard
import "./StaffDashboard.css";

// Reuses the shared website header
import Header from "../../components/Header/Header";

type AssignedQueue = {
    queue_id: number;
    queue_name: string;
    queue_code: string;
    active: boolean;
    waiting_count: number;
};


import { useEffect, useState } from "react";

function StaffDashboard() {

    const [organizationName, setOrganizationName] = useState("Loading...");
    const [isActive, setIsActive] = useState(false);
    const [assignedQueues, setAssignedQueues] = useState<AssignedQueue[]>([]);

    useEffect(() => {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        async function loadCurrentStaff() {
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

            setOrganizationName(account.organization_name);
            setIsActive(account.active);
        }

        async function loadAssignedQueues() {
            const response = await fetch(
                `${apiBaseUrl}/database/staff/get_my_assigned_queues`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setAssignedQueues(data);
        }

        void loadCurrentStaff();
        void loadAssignedQueues();
    }, []);

    async function changeActiveStatus() {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(
            `${apiBaseUrl}/database/staff/set_active?active=${!isActive}`,
            {
                method: "PUT",
                credentials: "include",
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        setIsActive(data.active);
    }



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
                            {organizationName}
                        </p>
                    </section>


                    <section className="staff-status-section">
                        <h2>Status</h2>

                        <p>
                            Current status:{" "}
                            <strong>{isActive ? "Active" : "Inactive"}</strong>
                        </p>

                        <button
                            type="button"
                            onClick={changeActiveStatus}
                        >
                            {isActive ? "Set Inactive" : "Set Active"}
                        </button>
                    </section>

                    {/* Queues/services assigned to this staff member */}
                    <section className="staff-assigned-section">
                        <h2>Assigned queues</h2>

                        <div className="staff-assigned-list">
                            {assignedQueues.length === 0 ? (
                                <p className="staff-no-assignments">
                                    No queues assigned yet.
                                </p>
                            ) : (
                                assignedQueues.map((queue) => (
                                    <div
                                        className="staff-assigned-row"
                                        key={queue.queue_id}
                                    >
                                        <span>{queue.queue_name}</span>
                                        <span>{queue.waiting_count} waiting</span>
                                    </div>
                                ))
                            )}
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