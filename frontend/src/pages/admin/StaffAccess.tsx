import "./StaffAccess.css";
import Header from "../../components/Header/Header";
import { useEffect, useState } from "react";

type StaffMember = {
    staff_id: number;
    full_name: string;
    email: string;
    active: boolean;
};

type Queue = {
    queue_id: number;
    queue_name: string;
    queue_code: string;
    active: boolean;
};

function StaffAccess() {
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [queueList, setQueueList] = useState<Queue[]>([]);
    const [assignedQueues, setAssignedQueues] = useState<Record<number, number[]>>({});

    useEffect(() => {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        async function loadStaff() {
            const response = await fetch(
                `${apiBaseUrl}/database/staff/get_staff_list`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setStaffList(data);
            data.forEach((staff: StaffMember) => {
                void loadAssignedQueues(staff.staff_id);
            });
        }

        async function loadQueues() {
            const response = await fetch(
                `${apiBaseUrl}/database/queue/get_queue_list`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setQueueList(data);
        }

        async function loadAssignedQueues(staffId: number) {
            const response = await fetch(
                `${apiBaseUrl}/database/staff/get_assigned_queues/${staffId}`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            setAssignedQueues((current) => ({
                ...current,
                [staffId]: data.map((queue: Queue) => queue.queue_id),
            }));
        }

        void loadStaff();
        void loadQueues();
    }, []);

    async function changeQueueAssignment(
        staffId: number,
        queueId: number,
        currentlyAssigned: boolean
    ) {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const endpoint = currentlyAssigned
            ? "/database/staff/unassign_queue"
            : "/database/staff/assign_queue";

        const response = await fetch(
            `${apiBaseUrl}${endpoint}?staff_id=${staffId}&queue_id=${queueId}`,
            {
                method: currentlyAssigned ? "DELETE" : "POST",
                credentials: "include",
            }
        );

        if (!response.ok) {
            return;
        }

        setAssignedQueues((current) => {
            const currentQueues = current[staffId] ?? [];

            return {
                ...current,
                [staffId]: currentlyAssigned
                    ? currentQueues.filter((id) => id !== queueId)
                    : [...currentQueues, queueId],
            };
        });
    }

    return (
        <div className="staff-access-page">
            <Header />

            <main className="staff-access-main">
                <section className="staff-access-content">
                    <h1>Staff Access</h1>

                    {staffList.length === 0 ? (
                        <p>No staff members found.</p>
                    ) : (
                        staffList.map((staff) => (
                            <div
                                className="staff-access-row"
                                key={staff.staff_id}
                            >
                                <div>
                                    <strong>{staff.full_name}</strong>
                                    <p>{staff.email}</p>
                                </div>

                                <div className="staff-access-status">
                                    <span className={staff.active ? "is-active" : undefined}>
                                        {staff.active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                <div className="staff-access-queues">
                                    <strong>Assigned Queues</strong>

                                    {queueList.length === 0 ? (
                                        <p>No queues available.</p>
                                    ) : (
                                        queueList.map((queue) => {
                                            const isAssigned =
                                                assignedQueues[staff.staff_id]?.includes(queue.queue_id) ?? false;

                                            return (
                                                <label
                                                    className="staff-access-queue-option"
                                                    key={queue.queue_id}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isAssigned}
                                                        onChange={() =>
                                                            void changeQueueAssignment(
                                                                staff.staff_id,
                                                                queue.queue_id,
                                                                isAssigned
                                                            )
                                                        }
                                                    />

                                                    <span>{queue.queue_name}</span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>
        </div>
    );
}

export default StaffAccess;