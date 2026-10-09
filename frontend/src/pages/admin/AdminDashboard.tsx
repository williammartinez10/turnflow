import "./AdminDashboard.css"; // For formatting
import Header from "../../components/Header/Header";
import { Link } from "react-router-dom"; // For Navigation section at the bottom of page

function AdminDashboard() {
    // Variables to store database content
    const organizationName = "<Organization Name>";
    const locationName = "<Location>";
    return (
        <div className="admin-dashboard-page">
            <Header />

            <main className="admin-dashboard-main">
                {/*Heading Bolded*/}
                <section className="admin-dashboard-content">
                    <h1 className="admin-dashboard-title">Admin Dashboard</h1>
                    {/*Organization and Location info*/}
                    <p><strong>Organization</strong></p>
                    <p>{organizationName}</p>

                    <p><strong>Location</strong></p>
                    <p>{locationName}</p>

                </section>
                {/*Table info*/}
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
                    </div>
                    {/*Navigation info*/}
                    <p className="admin-dashboard-navigation">
                        Navigation:{" "}
                        <Link to="/admin/Services_Queues">Services & Queues</Link>
                        {" · "}
                        <span>Staff Access</span>
                        {" · "}
                        <span>Monitoring, Statistics & History</span>
                    </p>
            </main>
        </div>
    );
}

export default AdminDashboard;