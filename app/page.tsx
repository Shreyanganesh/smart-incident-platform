
"use client";

import { useEffect, useState } from "react";

type Incident = {
  incident_id: number;
  title: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  created_at: string;
  category_name: string;
  department_name: string;
  reported_by: string;
};

const initialForm = {
  title: "",
  description: "",
  category_id: "1",
  location: "",
  priority: "medium",
};

const allowedStatuses = [
  "pending",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  async function loadIncidents() {
    try {
      const response = await fetch("/api/incidents");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Unable to load incidents.");
      }

      setIncidents(data.incidents);
      setError("");
    } catch {
      setError("Could not load incidents. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadIncidents();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
          reported_by: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to report incident."
        );
      }

      setMessage("Incident reported successfully!");
      setForm(initialForm);
      setShowForm(false);
      await loadIncidents();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateIncidentStatus(
    incidentId: number,
    newStatus: string
  ) {
    if (!allowedStatuses.includes(newStatus)) {
      setMessage("Invalid status selected.");
      return;
    }

    const previousIncident = incidents.find(
      (incident) => incident.incident_id === incidentId
    );

    if (!previousIncident) return;
    if (previousIncident.status === newStatus) return;

    setUpdatingIds((current) => [...current, incidentId]);
    setMessage("");

    try {
      const response = await fetch(
        `/api/incidents/status?id=${incidentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update incident status."
        );
      }

      setIncidents((current) =>
        current.map((incident) =>
          incident.incident_id === incidentId
            ? { ...incident, status: newStatus }
            : incident
        )
      );

      setMessage(
        `Incident INC-${String(incidentId).padStart(4, "0")} status updated to ${newStatus.replace("_", " ")}.`
      );

      await loadIncidents();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Status update failed."
      );
    } finally {
      setUpdatingIds((current) =>
        current.filter((id) => id !== incidentId)
      );
    }
  }

  const query = search.toLowerCase();

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch = [
      incident.title,
      incident.location,
      incident.category_name,
      incident.department_name,
      incident.reported_by,
    ].some((value) =>
      value.toLowerCase().includes(query)
    );

    return (
      matchesSearch &&
      (statusFilter === "all" ||
        incident.status === statusFilter)
    );
  });

  const openCount = incidents.filter(
    (incident) =>
      !["resolved", "rejected"].includes(incident.status)
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === "resolved"
  ).length;

  const highPriorityCount = incidents.filter(
    (incident) =>
      ["high", "critical"].includes(incident.priority)
  ).length;

  const statusClass: Record<string, string> = {
    pending: "status-pending",
    assigned: "status-assigned",
    in_progress: "status-progress",
    resolved: "status-resolved",
    rejected: "status-rejected",
  };

  const priorityClass: Record<string, string> = {
    low: "priority-low",
    medium: "priority-medium",
    high: "priority-high",
    critical: "priority-critical",
  };

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">S</span>
          <span>
            Smart<span className="brand-light">Civic</span>
          </span>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <a href="/" className="nav-item active">
  <span>▦</span> Overview
</a>
        <a href="/incidents" className="nav-item">
  <span>◎</span> Incidents
</a>
        <a href="/departments" className="nav-item">
  <span>⊕</span> Departments
</a>
        <a href="/activity-history" className="nav-item">
  <span>◷</span> Activity history
</a>
        <div className="sidebar-bottom">
          <div className="avatar">SA</div>
          <div>
            <strong>System Admin</strong>
            <p>Administrator</p>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CIVIC MANAGEMENT</p>
            <h1>Incident Overview</h1>
          </div>

          <div className="topbar-right">
            <span className="live-dot" />
            <span>Database connected</span>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="welcome-label">
              SMART INCIDENT REPORTING PLATFORM
            </p>
            <h2>
              Making our city better, one report at a time.
            </h2>
            <p>
              Monitor complaints, track progress, and improve
              civic services.
            </p>
          </div>
          <div className="welcome-symbol">⌖</div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total incidents</span>
              <span className="stat-icon blue">▤</span>
            </div>
            <strong>{incidents.length}</strong>
            <p>All reported incidents</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Open incidents</span>
              <span className="stat-icon orange">◷</span>
            </div>
            <strong>{openCount}</strong>
            <p>Awaiting resolution</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>High priority</span>
              <span className="stat-icon red">!</span>
            </div>
            <strong>{highPriorityCount}</strong>
            <p>High or critical priority</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Resolved</span>
              <span className="stat-icon green">✓</span>
            </div>
            <strong>{resolvedCount}</strong>
            <p>Successfully completed</p>
          </article>
        </section>

        <section className="incidents-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent incidents</h2>
              <p>Live records retrieved from PostgreSQL</p>
            </div>

            <button
              className="report-button"
              onClick={() => {
                setShowForm(!showForm);
                setMessage("");
              }}
            >
              {showForm ? "Cancel" : "+ Report incident"}
            </button>
          </div>

          {message && (
            <p className="message" role="status">
              {message}
            </p>
          )}

          {showForm && (
            <form
              className="incident-form"
              onSubmit={handleSubmit}
            >
              <h3>Report a civic incident</h3>

              <label htmlFor="title">Incident title</label>
              <input
                id="title"
                required
                maxLength={200}
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="e.g. Pothole near the bus stop"
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                required
                maxLength={5000}
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the issue..."
              />

              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={form.category_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value,
                  })
                }
              >
                <option value="1">Pothole</option>
                <option value="2">Garbage Overflow</option>
                <option value="3">Water Leakage</option>
                <option value="4">Street Light Failure</option>
              </select>

              <label htmlFor="location">Location</label>
              <input
                id="location"
                required
                maxLength={300}
                value={form.location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    location: e.target.value,
                  })
                }
                placeholder="Street, area, city"
              />

              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value,
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <button
                className="report-button"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit incident"}
              </button>
            </form>
          )}

          <div className="panel-heading">
            <div>
              <h2>Incident records</h2>
              <p>Search, filter, and update incident status</p>
            </div>
            <span className="record-count">
              {filteredIncidents.length} records
            </span>
          </div>

          <div className="filters">
            <input
              type="search"
              placeholder="Search title, location, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <p className="message">Loading incidents...</p>
          ) : error ? (
            <p className="message error">{error}</p>
          ) : filteredIncidents.length === 0 ? (
            <p className="message">
              No incidents match your search.
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>INCIDENT</th>
                    <th>CATEGORY</th>
                    <th>DEPARTMENT</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>LOCATION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredIncidents.map((incident) => (
                    <tr key={incident.incident_id}>
                      <td>
                        <div className="incident-title">
                          {incident.title}
                        </div>
                        <div className="incident-meta">
                          INC-
                          {String(incident.incident_id).padStart(
                            4,
                            "0"
                          )}
                          {" · "}
                          {incident.reported_by}
                        </div>
                      </td>

                      <td>{incident.category_name}</td>
                      <td>{incident.department_name}</td>

                      <td>
                        <span
                          className={`pill ${
                            priorityClass[incident.priority] ?? ""
                          }`}
                        >
                          {incident.priority}
                        </span>
                      </td>

                      <td>
                        <div className="status-control">
                          <span
                            className={`pill ${
                              statusClass[incident.status] ?? ""
                            }`}
                          >
                            {incident.status.replace("_", " ")}
                          </span>

                          <select
                            aria-label={`Update status for incident ${incident.incident_id}`}
                            value={incident.status}
                            disabled={updatingIds.includes(
                              incident.incident_id
                            )}
                            onChange={(e) =>
                              void updateIncidentStatus(
                                incident.incident_id,
                                e.target.value
                              )
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">
                              In progress
                            </option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </td>

                      <td>{incident.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer>
          SmartCivic · Incident Management System
          <span>Powered by Next.js & PostgreSQL</span>
        </footer>
      </section>
    </main>
  );
}
