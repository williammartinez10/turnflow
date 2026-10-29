import "./Services_Queues.css";
import Header from "../../components/Header/Header";
import { useEffect, useState } from "react";

// Describes what information every Service object should contain
type Service = {
    serviceId: number;
    name: string;
    description: string;
    active: boolean;
    estimatedDuration: number;
    currentWait: number;
};

type Queue = {
    name: string;
    queueCode: string;
    prefix: string;
    description: string;
    serviceName: string;
    serviceId: number | null;
    active: boolean;
    currentWait: number;
    peopleWaiting: number;

};

function Services_Queues() {
    // Stores the service list and temporary values used when creating or editing a service
    const [showNewService, setShowNewService] = useState(false);
    const [newServiceName, setNewServiceName] = useState("");
    const [newServiceDescription, setNewServiceDescription] = useState("");
    const [services, setServices] = useState<Service[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editActive, setEditActive] = useState(true);
    const [editDuration, setEditDuration] = useState(0);
    const [editDescription, setEditDescription] = useState("");

    // Stores the queue list and temporary values used when creating or editing a queue
    const [showNewQueue, setShowNewQueue] = useState(false);
    const [newQueueName, setNewQueueName] = useState("");
    const [newQueuePrefix, setNewQueuePrefix] = useState("");
    const [newQueueDescription, setNewQueueDescription] = useState("");
    const [newQueueServiceId, setNewQueueServiceId] = useState<number | null>(null);
    const [newQueueActive, setNewQueueActive] = useState(true);
    const [queues, setQueues] = useState<Queue[]>([]);

    const [editingQueueIndex, setEditingQueueIndex] = useState<number | null>(null);
    const [editQueueName, setEditQueueName] = useState("");
    const [editQueueActive, setEditQueueActive] = useState(true);
    const [editQueuePrefix, setEditQueuePrefix] = useState("");
    const [editQueueDescription, setEditQueueDescription] = useState("");
    const [editQueueServiceId, setEditQueueServiceId] = useState<number | null>(null);


    // Loads queues already saved in the database.
    async function loadQueues() {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(
            `${apiBaseUrl}/database/queue/get_queue_list`,
            {
                credentials: "include",
            }
        );

        if (!response.ok) {
            return;
        }

        const savedQueues = await response.json();

        setQueues(
            savedQueues.map((queue: {
                queue_code: string;
                queue_name: string | null;
                prefix: string | null;
                description: string | null;
                service_id: number;
                service_name: string;
                active: boolean;
            }) => ({
                name: queue.queue_name ?? "",
                queueCode: queue.queue_code,
                prefix: queue.prefix ?? "",
                description: queue.description ?? "",
                serviceId: queue.service_id ?? null,
                serviceName: queue.service_name ?? "",
                active: queue.active,
                currentWait: 0,
                peopleWaiting: 0,
            }))
        );
    }

    // Loads queues when the page first opens.
    useEffect(() => {
        void loadQueues();

        const interval = setInterval(() => {
            void loadQueues();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Loads services already saved in the database when the page opens.
    useEffect(() => {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        async function loadServices() {
            const response = await fetch(
                `${apiBaseUrl}/database/service/get_service_list`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                return;
            }

            const savedServices = await response.json();

            setServices(
                savedServices.map((service: {
                    service_id: number;
                    service_name: string;
                    description: string | null;
                    active: boolean;
                    estimated_duration: number;
                }) => ({
                    serviceId: service.service_id,
                    name: service.service_name,
                    description: service.description ?? "",
                    active: service.active,
                    estimatedDuration: service.estimated_duration,
                    currentWait: 0,
                }))
            );
        }

        void loadServices();
    }, []);


    // Clears the New Service form and closes it without creating anything
    function cancelNewService() {
        setNewServiceName("");
        setNewServiceDescription("");
        setShowNewService(false);
    }

// Creates the service in the database, then adds it to the page.
    async function createService() {
        if (!newServiceName.trim()) {
            alert("Enter a service name before creating the service.");
            return;
        }

        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(
            `${apiBaseUrl}/database/service/add_service`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    service_name: newServiceName.trim(),
                    description: newServiceDescription.trim(),
                    active: true,
                    estimated_duration: 0,
                }),
            }
        );

        if (!response.ok) {
            console.error("Could not create service.");
            return;
        }

        const createdService = await response.json();

        setServices([
            ...services,
            {
                serviceId: createdService.service_id,
                name: newServiceName.trim(),
                description: newServiceDescription.trim(),
                active: true,
                estimatedDuration: 0,
                currentWait: 0,
            },
        ]);

        setNewServiceName("");
        setNewServiceDescription("");
        setShowNewService(false);
    }


    // Saves service changes to the database and then updates the page.
    async function saveEdit() {
        if (editingIndex === null || !editName.trim()) {
            return;
        }

        const service = services[editingIndex];

        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(
            `${apiBaseUrl}/database/service/update_service`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    service_id: service.serviceId,
                    service_name: editName.trim(),
                    description: editDescription.trim(),
                    active: editActive,
                    estimated_duration: editDuration,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Could not update service:", error);
            alert(`Could not update service: ${error}`);
            return;
        }

        const updatedServices = [...services];

        updatedServices[editingIndex] = {
            ...updatedServices[editingIndex],
            name: editName.trim(),
            description: editDescription.trim(),
            active: editActive,
            estimatedDuration: editDuration,
        };

        setServices(updatedServices);

        // Reload queues in case disabling the service also disabled its queues.
        await loadQueues();

        setEditingIndex(null);
        setEditName("");
        setEditDescription("");
    }

    // Clears the New Queue form and closes it without creating a queue
    function cancelNewQueue() {
        setNewQueueName("");
        setNewQueuePrefix("");
        setNewQueueDescription("");
        setNewQueueServiceId(null);
        setNewQueueActive(true);
        setShowNewQueue(false);
    }


    // Creates the queue in the database, then adds it to the page.
    async function createQueue() {
        if (!newQueueName.trim()) {
            alert("Enter a queue name before creating the queue.");
            return;
        }

        if (newQueueServiceId === null) {
            alert("Select a service before creating the queue.");
            return;
        }

        const selectedService = services.find(
            (service) => service.serviceId === newQueueServiceId
        );

        if (!selectedService) {
            alert("Selected service could not be found.");
            return;
        }

        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(
            `${apiBaseUrl}/database/queue/add_queue`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    queue_name: newQueueName.trim(),
                    prefix: newQueuePrefix.trim(),
                    description: newQueueDescription.trim(),

                    service_id: newQueueServiceId,



                    active: newQueueActive,
                }),
            }
        );

        if (!response.ok) {
            console.error("Could not create queue.");
            return;
        }

        const createdQueue = await response.json();

        setQueues([
            ...queues,
            {
                name: newQueueName.trim(),
                queueCode: createdQueue.queue_code,
                prefix: newQueuePrefix.trim(),
                description: newQueueDescription.trim(),
                serviceName: selectedService.name,
                serviceId: newQueueServiceId,


                active: newQueueActive,
                currentWait: 0,
                peopleWaiting: 0,
            }
        ]);

        setNewQueueName("");
        setNewQueuePrefix("");
        setNewQueueDescription("");
        setNewQueueServiceId(null);
        setNewQueueActive(true);
        setShowNewQueue(false);
    }

    // Saves the edited queue values and exits queue edit mode
    // Saves edited queue values to the database and then updates the page.
    async function saveQueueEdit() {
        if (editingQueueIndex === null || !editQueueName.trim()) {
            return;
        }

        if (editQueueServiceId === null) {
            alert("Select a service before saving the queue.");
            return;
        }

        const selectedService = services.find(
            (service) => service.serviceId === editQueueServiceId
        );

        if (!selectedService) {
            alert("Selected service could not be found.");
            return;
        }

        const queue = queues[editingQueueIndex];

        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(
            `${apiBaseUrl}/database/queue/update_queue`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    queue_code: queue.queueCode,
                    queue_name: editQueueName.trim(),
                    prefix: editQueuePrefix.trim(),
                    description: editQueueDescription.trim(),

                    service_id: editQueueServiceId,

                    active: editQueueActive,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Could not update queue:", error);
            alert(`Could not update queue: ${error}`);
            return;
        }

        const updatedQueues = [...queues];

        updatedQueues[editingQueueIndex] = {
            ...updatedQueues[editingQueueIndex],
            name: editQueueName.trim(),
            prefix: editQueuePrefix.trim(),
            description: editQueueDescription.trim(),
            serviceName: selectedService.name,
            serviceId: editQueueServiceId,
            active: editQueueActive,
        };

        setQueues(updatedQueues);

        setEditingQueueIndex(null);
        setEditQueuePrefix("");
        setEditQueueDescription("");
        setEditQueueName("");
        setEditQueueServiceId(null);
    }

    // Discards unsaved queue changes and exits edit mode
    function cancelQueueEdit() {
        setEditingQueueIndex(null);
        setEditQueueName("");
        setEditQueuePrefix("");
        setEditQueueDescription("");
        setEditQueueServiceId(null);
    }

    async function deleteQueue(queue: Queue) {
        const confirmed = window.confirm(
            `Delete queue "${queue.name}"?`
        );

        if (!confirmed) {
            return;
        }

        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(
            `${apiBaseUrl}/database/queue/delete_queue/${queue.queueCode}`,
            {
                method: "DELETE",
                credentials: "include",
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Could not delete queue:", error);
            alert("Could not delete queue.");
            return;
        }

        await loadQueues();
    }


    // Defines what this React component displays on the page
    return (
        // Main page container for the Services & Queues screen
        <div className="services-queues-page">
            {/* Reuses the shared website header */}
            <Header />

            {/* Contains the main content of this page */}
            <main className="services-queues-main">

                {/* Groups the main Services and Queues content together */}
                <section className="services-queues-content">
                    {/* Main title for this page */}
                    <h1 className="services-queues-title">Services & Queues</h1>
                    {/* Marks the beginning of the Services management area */}
                    <h2 className="services-and-queues-title">Services</h2>

                    {/* Opens the form used to create a new service */}
                    <button
                        className="services-button"
                        type="button"
                        onClick={() => {
                            setEditingIndex(null);
                            setShowNewService(true);
                        }}
                    >
                        + New Service
                    </button>

                    {/* Shows the New Service form only when showNewService is true */}
                    {showNewService && (
                        <div className="services-new-form">
                            <label htmlFor="service-name">Service Name</label>
                            {/* Stores the service name as the user types */}
                            <input
                                id="service-name"
                                type="text"
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                                placeholder="Enter service name"
                            />

                            {/* Stores a short description for the new service */}
                            <label htmlFor="service-description">Description</label>

                            <input
                                id="service-description"
                                type="text"
                                value={newServiceDescription}
                                onChange={(e) => setNewServiceDescription(e.target.value)}
                                placeholder="Enter service description"
                            />

                            {/* Keeps the Cancel and Create buttons together below the form */}
                            <div className="services-form-actions">
                                <button
                                    type="button"
                                    onClick={cancelNewService}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={createService}
                                >
                                    Create
                                </button>
                            </div>

                        </div>
                    )}

                    {/* ===== Edit Service Form ===== */}
                    {/* Shows only when a service has been selected for editing */}

                    {editingIndex !== null && (
                        <div className="services-edit-form-top">
                            <h3>Edit Service</h3>

                            {/* Lets the service name be changed */}
                            <label>Service Name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />

                            {/* Lets the service description be changed */}
                            <label>Description</label>
                            <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                            />

                            <label>Status</label>

                            <select
                                value={editActive ? "active" : "disabled"}
                                onChange={(e) =>
                                    setEditActive(e.target.value === "active")
                                }
                            >
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </select>

                            {/* Shows which queues currently use this service */}
                            <div className="service-used-queues">
                                <p><strong>Used in Queues</strong></p>

                                {queues
                                    .filter((queue) =>
                                        queue.serviceId === services[editingIndex].serviceId
                                    )
                                    .map((queue, index) => (
                                        <p key={index}>{queue.name}</p>
                                    ))}
                            </div>

                            <div className="services-form-actions">
                                <button
                                    type="button"
                                    onClick={() => setEditingIndex(null)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={saveEdit}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== End Edit Service Form ===== */}

                    {/* Displays all created services */}
                    <div className="services-list">
                        {/* Creates one row for each service stored in the services array */}
                        {services.map((service, index) => (
                            <div className="services-row" key={index}>
                                {/* Shows the saved service information */}
                                <div className="services-summary">
                                    <span>{service.name}</span>

                                    <span>
                                        {service.active ? "Active" : "Inactive"}
                                    </span>

                                    <span>
                                        Current Wait: {service.currentWait} min
                                    </span>
                                </div>

                                {/* Loads this service's values into the Edit Service form above */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewService(false);
                                        setEditingIndex(index);
                                        setEditName(service.name);
                                        setEditDescription(service.description);
                                        setEditActive(service.active);
                                        setEditDuration(service.estimatedDuration);
                                    }}
                                >
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>


                    {/* ===== Queues Section ===== */}
                    <div className="queues-content">
                        {/* Marks the beginning of the Queue management area */}
                        <h2 className="services-and-queues-title">Queues</h2>

                        {/* Opens Create Queue mode and closes any queue currently being edited */}
                        <button
                            className="queues-button"
                            type="button"
                            onClick={() => {
                                if (services.length === 0) {
                                    alert("Create at least one service before creating a queue.");
                                    return;
                                }

                                setEditingQueueIndex(null);
                                setShowNewQueue(true);
                            }}
                        >
                            + New Queue
                        </button>

                        {/* Shows the Create Queue form only when showNewQueue is true */}
                        {showNewQueue && (
                            // Collects all values needed to create a new queue
                            <div className="queues-new-form">
                                <h3>Create Queue</h3>
                                {/*Fill in info for new service*/}
                                <label htmlFor="queue-name">Queue Name</label>

                                {/* Stores the queue name as the user types */}
                                <input
                                    id="queue-name"
                                    type="text"
                                    value={newQueueName}
                                    onChange={(e) => setNewQueueName(e.target.value)}
                                    placeholder="Enter queue name"
                                />

                                {/* Stores the short prefix used to identify this queue */}
                                <label htmlFor="queue-prefix">Prefix</label>
                                <input
                                    id="queue-prefix"
                                    type="text"
                                    value={newQueuePrefix}
                                    onChange={(e) => setNewQueuePrefix(e.target.value)}
                                    placeholder="Enter prefix"
                                />

                                {/* Stores a short description explaining the purpose of this queue */}
                                <label htmlFor="queue-description">Description</label>
                                <input
                                    id="queue-description"
                                    type="text"
                                    value={newQueueDescription}
                                    onChange={(e) => setNewQueueDescription(e.target.value)}
                                    placeholder="Enter description"
                                />

                                {/* Sets whether the new queue starts as active or disabled */}
                                <label htmlFor="queue-status">Status</label>
                                <select
                                    id="queue-status"
                                    value={newQueueActive ? "active" : "disabled"}
                                    onChange={(e) => setNewQueueActive(e.target.value === "active")}
                                >
                                    <option value="active">Active</option>
                                    <option value="disabled">Disabled</option>
                                </select>

                                {/* Lists existing services so multiple ones can be assigned to this queue */}

                                <div className="queue-services-selection">
                                    <p>Services in Queue</p>

                                    <label htmlFor="queue-service">Service</label>

                                    <select
                                        id="queue-service"
                                        value={newQueueServiceId ?? ""}
                                        onChange={(e) =>
                                            setNewQueueServiceId(
                                                e.target.value ? Number(e.target.value) : null
                                            )
                                        }
                                    >
                                        <option value="">Select a service</option>

                                        {services.map((service) => (
                                            <option
                                                key={service.serviceId}
                                                value={service.serviceId}
                                            >
                                                {service.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                                <div className="queues-form-actions">
                                    {/* Clears the Create Queue form and closes it without saving a new queue */}
                                    <button
                                        type="button"
                                        onClick={cancelNewQueue}
                                    >
                                        Cancel
                                    </button>

                                    {/* Creates the queue using the current form values */}
                                    <button
                                        type="button"
                                        onClick={createQueue}
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Shows the Edit Queue form only when a queue has been selected */}

                        {editingQueueIndex !== null && (

                            // Uses temporary edit values so changes are not saved until Save is pressed
                            <div className="queues-edit-form">
                                <h3>Edit Queue</h3>

                                {/* Lets the selected queue name be changed while editing */}
                                <label>Queue Name</label>
                                <input
                                    type="text"
                                    value={editQueueName}
                                    onChange={(e) => setEditQueueName(e.target.value)}
                                />

                                {/* Lets the queue prefix be changed while editing */}
                                <label>Prefix</label>
                                <input
                                    type="text"
                                    value={editQueuePrefix}
                                    onChange={(e) => setEditQueuePrefix(e.target.value)}
                                />

                                {/* Lets the queue description be changed while editing */}
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={editQueueDescription}
                                    onChange={(e) => setEditQueueDescription(e.target.value)}
                                />

                                {/* Changes whether the selected queue is active or disabled */}
                                <label>Status</label>
                                <select
                                    value={editQueueActive ? "active" : "disabled"}
                                    onChange={(e) =>
                                        setEditQueueActive(e.target.value === "active")
                                    }
                                >
                                    <option value="active">Active</option>
                                    <option value="disabled">Disabled</option>
                                </select>

                                {/* Shows the services currently available to assign to this queue */}

                                <div className="queue-services-selection">
                                    <p>Services in Queue</p>

                                    <label htmlFor="edit-queue-service">Service</label>

                                    <select
                                        id="edit-queue-service"
                                        value={editQueueServiceId ?? ""}
                                        onChange={(e) =>
                                            setEditQueueServiceId(
                                                e.target.value ? Number(e.target.value) : null
                                            )
                                        }
                                    >
                                        <option value="">Select a service</option>

                                        {services.map((service) => (
                                            <option
                                                key={service.serviceId}
                                                value={service.serviceId}
                                            >
                                                {service.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* ===== End Services assigned to queue ===== */}

                                <div className="queues-form-actions">
                                    {/* Discards the temporary edit values and closes Edit Queue mode */}
                                    <button type="button" onClick={cancelQueueEdit}>
                                        Cancel
                                    </button>
                                    {/* Saves the temporary edit values back into the selected queue */}
                                    <button type="button" onClick={saveQueueEdit}>
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Displays all queues that have been created */}
                        <div className="queues-list">
                            {/* Creates one row for each queue stored in the queues array */}
                            {queues.map((queue, index) => (
                                <div className="queues-row" key={index}>
                                    {/* Shows the saved queue name */}
                                    <span>{queue.name}</span>

                                    <span>
                                        Code: {queue.queueCode}
                                    </span>

                                    {/* Shows the queue's current status */}
                                    <span>
                                        {queue.active ? "Active" : "Disabled"}
                                    </span>

                                    <button
                                        // Loads this queue's saved values into the Edit Queue form above
                                        type="button"
                                        onClick={() => {
                                            setShowNewQueue(false);
                                            setEditingQueueIndex(index);
                                            setEditQueueName(queue.name);
                                            setEditQueueActive(queue.active);
                                            setEditQueuePrefix(queue.prefix);
                                            setEditQueueDescription(queue.description);
                                            setEditQueueServiceId(queue.serviceId);
                                        }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => deleteQueue(queue)}
                                    >
                                        Delete
                                    </button>

                                </div>
                            ))}
                        </div> {/* End queues-list */}

                    </div> {/* End queues-content */}

                </section> {/* End services-queues-content */}

            </main> {/* End main page content */}

        </div> // End services-queues-page
    );
}

export default Services_Queues;