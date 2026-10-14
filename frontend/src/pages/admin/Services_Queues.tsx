import "./Services_Queues.css";
import Header from "../../components/Header/Header";
import { useState } from "react";

// Describes what information every Service object should contain
type Service = {
    name: string;
    description: string;
    active: boolean;
    estimatedDuration: number;
    currentWait: number;
};

type Queue = {
    name: string;
    prefix: string;
    description: string;
    services: string[];
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
    const [newQueueServices, setNewQueueServices] = useState<string[]>([]);
    const [newQueueActive, setNewQueueActive] = useState(true);
    const [queues, setQueues] = useState<Queue[]>([]);

    const [editingQueueIndex, setEditingQueueIndex] = useState<number | null>(null);
    const [editQueueName, setEditQueueName] = useState("");
    const [editQueueActive, setEditQueueActive] = useState(true);
    const [editQueuePrefix, setEditQueuePrefix] = useState("");
    const [editQueueDescription, setEditQueueDescription] = useState("");
    const [editQueueServices, setEditQueueServices] = useState<string[]>([]);

    // Clears the New Service form and closes it without creating anything
    function cancelNewService() {
        setNewServiceName("");
        setNewServiceDescription("");
        setShowNewService(false);
    }

    // Checks the service name, creates the new service, then resets the form
    function createService() {
        if (!newServiceName.trim()) {
            return;
        }

        setServices([
            ...services,
            {
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

    // Saves changes made to the selected service and exits edit mode
    function saveEdit() {
        if (editingIndex === null || !editName.trim()) {
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
        setEditingIndex(null);
        setEditName("");
        setEditDescription("");
    }

    // Clears the New Queue form and closes it without creating a queue
    function cancelNewQueue() {
        setNewQueueName("");
        setNewQueuePrefix("");
        setNewQueueDescription("");
        setNewQueueServices([]);
        setNewQueueActive(true);
        setShowNewQueue(false);
    }

    // Creates a queue from the form values, then resets and closes the form
    function createQueue() {
        if (!newQueueName.trim()) {
            return;
        }

        setQueues([
            ...queues,
            {
                name: newQueueName.trim(),
                prefix: newQueuePrefix.trim(),
                description: newQueueDescription.trim(),
                services: newQueueServices,
                active: newQueueActive,
                currentWait: 0,
                peopleWaiting: 0,
            }
        ]);

        setNewQueueName("");
        setNewQueuePrefix("");
        setNewQueueDescription("");
        setNewQueueServices([]);
        setNewQueueActive(true);
        setShowNewQueue(false);
    }

    // Saves the edited queue values and exits queue edit mode
    function saveQueueEdit() {
        if (editingQueueIndex === null || !editQueueName.trim()) {
            return;
        }

        const updatedQueues = [...queues];

        updatedQueues[editingQueueIndex] = {
            ...updatedQueues[editingQueueIndex],
            name: editQueueName.trim(),
            prefix: editQueuePrefix.trim(),
            description: editQueueDescription.trim(),
            services: editQueueServices,
            active: editQueueActive,
        };

        setQueues(updatedQueues);
        setEditingQueueIndex(null);
        setEditQueuePrefix("");
        setEditQueueDescription("");
        setEditQueueName("");
        setEditQueueServices([]);
    }

    // Discards unsaved queue changes and exits edit mode
    function cancelQueueEdit() {
        setEditingQueueIndex(null);
        setEditQueueName("");
        setEditQueuePrefix("");
        setEditQueueDescription("");
        setEditQueueServices([]);
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

                            {/* Shows which queues currently use this service */}
                            <div className="service-used-queues">
                                <p><strong>Used in Queues</strong></p>

                                {queues
                                    .filter((queue) =>
                                        queue.services.includes(services[editingIndex].name)
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

                                    {/* Creates one checkbox for each service currently stored */}
                                    {services.map((service, index) => (
                                        <label key={index}>
                                            <input
                                                type="checkbox"
                                                checked={newQueueServices.includes(service.name)}

                                                // Adds the service when checked and removes it when unchecked
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewQueueServices([
                                                            ...newQueueServices,
                                                            service.name,
                                                        ]);
                                                    } else {
                                                        setNewQueueServices(
                                                            newQueueServices.filter(
                                                                (name) => name !== service.name
                                                            )
                                                        );
                                                    }
                                                }}
                                            />

                                            {service.name}
                                        </label>
                                    ))}
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

                                    {/* Creates one checkbox for each service and keeps existing selections checked */}
                                    {services.map((service, index) => (
                                        <label key={index}>

                                            {/* Updates the temporary service selection until Save is pressed */}
                                            <input
                                                type="checkbox"
                                                checked={editQueueServices.includes(service.name)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEditQueueServices([
                                                            ...editQueueServices,
                                                            service.name,
                                                        ]);
                                                    } else {
                                                        setEditQueueServices(
                                                            editQueueServices.filter(
                                                                (name) => name !== service.name
                                                            )
                                                        );
                                                    }
                                                }}
                                            />

                                            {service.name}
                                        </label>
                                    ))}
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
                                            setEditQueueServices(queue.services);
                                        }}
                                    >
                                        Edit
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