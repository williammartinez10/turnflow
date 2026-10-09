import "./Services_Queues.css";
import Header from "../../components/Header/Header";
import { useState } from "react";

// Define expected values
type Service = {
    name: string;
    active: boolean;
    estimatedDuration: number;
    currentWait: number;
};

type Queue = {
    name: string;
    active: boolean;
    currentWait: number;
    peopleWaiting: number;
};

function Services_Queues() {
    // Services variables
    const [showNewService, setShowNewService] = useState(false);
    const [newServiceName, setNewServiceName] = useState("");
    const [services, setServices] = useState<Service[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editActive, setEditActive] = useState(true);
    const [editDuration, setEditDuration] = useState(0);

    // Queues variables
    const [showNewQueue, setShowNewQueue] = useState(false);
    const [newQueueName, setNewQueueName] = useState("");
    const [queues, setQueues] = useState<Queue[]>([]);
    const [editingQueueIndex, setEditingQueueIndex] = useState<number | null>(null);
    const [editQueueName, setEditQueueName] = useState("");
    const [editQueueActive, setEditQueueActive] = useState(true);

    // Cancel button
    function cancelNewService() {
        setNewServiceName("");
        setShowNewService(false);
    }

    // New service button
    function createService() {
        if (!newServiceName.trim()) {
            return;
        }

        setServices([
            ...services,
            {
                name: newServiceName.trim(),
                active: true,
                estimatedDuration: 0,
                currentWait: 0,
            },
        ]);
        setNewServiceName("");
        setShowNewService(false);
    }

    // Save button after making new service
    function saveEdit() {
        if (editingIndex === null || !editName.trim()) {
            return;
        }

        const updatedServices = [...services];
        updatedServices[editingIndex] = {
            ...updatedServices[editingIndex],
            name: editName.trim(),
            active: editActive,
            estimatedDuration: editDuration,
        };

        setServices(updatedServices);
        setEditingIndex(null);
        setEditName("");
    }

    // Cancel button
    function cancelNewQueue() {
        setNewQueueName("");
        setShowNewQueue(false);
    }

    // New queue button
    function createQueue() {
        if (!newQueueName.trim()) {
            return;
        }

        setQueues([
            ...queues,
            {
                name: newQueueName.trim(),
                active: true,
                currentWait: 0,
                peopleWaiting: 0,
            },
        ]);

        setNewQueueName("");
        setShowNewQueue(false);
    }

    // Save button after making new queue
    function saveQueueEdit() {
        if (editingQueueIndex === null || !editQueueName.trim()) {
            return;
        }

        const updatedQueues = [...queues];

        updatedQueues[editingQueueIndex] = {
            ...updatedQueues[editingQueueIndex],
            name: editQueueName.trim(),
            active: editQueueActive,
        };

        setQueues(updatedQueues);
        setEditingQueueIndex(null);
        setEditQueueName("");
    }

    return (
        <div className="services-queues-page">
            <Header />

            <main className="services-queues-main">
                <section className="services-queues-content">
                    {/*Title*/}
                    <h1 className="services-queues-title">Services & Queues</h1>
                    {/*Sub_Title*/}
                    <h2>Services</h2>
                    {/*Services section*/}
                    {/*New service button*/}
                    <button
                        className="services-button"
                        type="button"
                        onClick={() => setShowNewService(true)}
                    >
                        + New Service
                    </button>

                    {showNewService && (
                        <div className="services-new-form">
                            <label htmlFor="service-name">Service Name</label>
                            {/*Fill in info for new service*/}
                            <input
                                id="service-name"
                                type="text"
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                                placeholder="Enter service name"
                            />
                            {/*Cancel button*/}
                            <button
                                type="button"
                                onClick={cancelNewService}
                            >
                                Cancel
                            </button>

                            {/*Create a new service confirmation button*/}
                            <button
                                type="button"
                                onClick={createService}
                            >
                                Create
                            </button>
                        </div>
                    )}
                    {/*Services form a list*/}
                    <div className="services-list">
                        {services.map((service, index) => (
                            <div className="services-row" key={index}>

                                {editingIndex === index ? (
                                    <div className="services-edit-form">
                                        {/*Edit Name of service*/}
                                        <label>
                                            Name
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                            />
                                        </label>

                                        {/*Edit availability of service*/}
                                        <label>
                                            Status
                                            <select
                                                value={editActive ? "active" : "inactive"}
                                                onChange={(e) =>
                                                    setEditActive(e.target.value === "active")
                                                }
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </label>

                                        {/*Duration that impacts the current wait time*/}
                                        <label>
                                            Estimated Duration
                                            <input
                                                type="number"
                                                min="0"
                                                value={editDuration}
                                                onChange={(e) =>
                                                    setEditDuration(Number(e.target.value))
                                                }
                                            />
                                            <span> minutes</span>
                                        </label>
                                    </div>
                                ) : (
                                    // Preview of services created
                                    <div className="services-summary">
                                        <span>{service.name}</span>

                                        <span>
                                            {service.active ? "Active" : "Inactive"}
                                        </span>

                                        <span>
                                            Current Wait: {service.currentWait} min
                                        </span>

                                    </div>
                                )}
                                {/*Save edits button*/}
                                {editingIndex === index ? (
                                    <button
                                        type="button"
                                        onClick={saveEdit}
                                    >
                                        Save
                                    </button>
                                ) : (
                                    // Edit button for each service
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingIndex(index);
                                            setEditName(service.name);
                                            setEditActive(service.active);
                                            setEditDuration(service.estimatedDuration);
                                        }}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {/*Queues Section*/}
                    <div className="queues-content">
                        {/*Sub_Title*/}
                        <h2>Queues</h2>
                        {/*New queue button*/}
                        <button
                            className="queues-button"
                            type="button"
                            onClick={() => setShowNewQueue(true)}
                        >
                            + New Queue
                        </button>

                        {showNewQueue && (
                            <div className="queues-new-form">
                                {/*Fill in info for new service*/}
                                <label htmlFor="queue-name">Queue Name</label>
                                {/*Edit the name of the queue*/}
                                <input
                                    id="queue-name"
                                    type="text"
                                    value={newQueueName}
                                    onChange={(e) => setNewQueueName(e.target.value)}
                                    placeholder="Enter queue name"
                                />
                                {/*Cancel button*/}
                                <button
                                    type="button"
                                    onClick={cancelNewQueue}
                                >
                                    Cancel
                                </button>

                                {/*Create confirmation button*/}
                                <button
                                    type="button"
                                    onClick={createQueue}
                                >
                                    Create
                                </button>
                            </div>
                        )}
                        {/*Queues form a list*/}
                        <div className="queues-list">
                            {queues.map((queue, index) => (
                                <div className="queues-row" key={index}>
                                    {editingQueueIndex === index ? (
                                        <>
                                            {/*Name of queue*/}
                                            <input
                                                type="text"
                                                value={editQueueName}
                                                onChange={(e) => setEditQueueName(e.target.value)}
                                            />
                                            {/*Queue availability*/}
                                            <select
                                                value={editQueueActive ? "active" : "disabled"}
                                                onChange={(e) =>
                                                    setEditQueueActive(e.target.value === "active")
                                                }
                                            >
                                                <option value="active">Active</option>
                                                <option value="disabled">Disabled</option>
                                            </select>

                                            {/*Save edits for queue*/}
                                            <button
                                                type="button"
                                                onClick={saveQueueEdit}
                                            >
                                                Save
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/*Preview of queue info*/}
                                            <span>{queue.name}</span>

                                            <span>
                                                {queue.active ? "Active" : "Disabled"}
                                            </span>

                                            {/*Edit button*/}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingQueueIndex(index);
                                                    setEditQueueName(queue.name);
                                                    setEditQueueActive(queue.active);
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </section>
            </main>
        </div>
    );
}

export default Services_Queues;