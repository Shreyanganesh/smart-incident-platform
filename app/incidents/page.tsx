
"use client";

import { useEffect, useState } from "react";
type Officer = {
  user_id: number;
  full_name: string;
  department_id: number;
  department_name: string;
};

type Incident = {
  incident_id: number;
  title: string;
  description?: string;
  category_name?: string;
  department_name?: string;
  location?: string;
  priority?: string;
  status: string;
  reported_by_name?: string;
  created_at?: string;
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [officerId, setOfficerId] = useState("2");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedIncident, setSelectedIncident] = useState("");
  const [assignMessage, setAssignMessage] = useState("");

useEffect(() => {
  async function loadOfficers() {
    try {
      const response = await fetch("/api/officers");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load officers.");
      }

      setOfficers(data.officers);

      if (data.officers.length > 0) {
        setOfficerId(String(data.officers[0].user_id));
      }
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  }

  loadOfficers();
}, []);


async function assignOfficer() {
  if (!selectedIncident) {
    setAssignMessage("Please select an incident first.");
    return;
  }

  try {
    setAssignMessage("Assigning officer...");

    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incident_id: Number(selectedIncident),
        officer_id: Number(officerId),
        assigned_by: 3,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Assignment failed.");
    }

    setAssignMessage(
      `Successfully assigned to ${data.officer.full_name}.`
    );

    const refresh = await fetch("/api/incidents");
    const refreshedData = await refresh.json();

    const rows = Array.isArray(refreshedData)
      ? refreshedData
      : refreshedData.incidents ?? refreshedData.data ?? [];

    setIncidents(rows);
  } catch (err) {
    setAssignMessage(
      err instanceof Error ? err.message : "Assignment failed."
    );
  }
}


  useEffect(() => {
    async function loadIncidents() {
      try {
        const response = await fetch("/api/incidents");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load incidents.");
        }

        const rows = Array.isArray(data)
          ? data
          : data.incidents ?? data.data ?? [];

        setIncidents(rows);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        <a href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Overview
        </a>

        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold">Incident Management</h1>
          <p className="mt-2 text-gray-600">
            View and track reported civic incidents.
          </p>
        </div>

<div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold">Assign Incident to Officer</h2>
  <p className="mt-1 text-sm text-gray-600">
    Select an incident and assign it to a department officer.
  </p>

  <div className="mt-4 grid gap-4 md:grid-cols-3">
    <div>
      <label className="mb-2 block text-sm font-medium">
        Select Incident
      </label>
      <select
        value={selectedIncident}
        onChange={(e) => setSelectedIncident(e.target.value)}
        className="w-full rounded-lg border p-3"
      >
        <option value="">Choose an incident</option>
        {incidents.map((incident) => (
          <option
            key={incident.incident_id}
            value={incident.incident_id}
          >
            #{incident.incident_id} — {incident.title}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium">
        Select Officer
      </label>
      <select
        value={officerId}
        onChange={(e) => setOfficerId(e.target.value)}
        className="w-full rounded-lg border p-3"
      >
        <option value="">Choose an officer</option>
{officers.map((officer) => (
  <option key={officer.user_id} value={String(officer.user_id)}>
    {officer.full_name} — {officer.department_name}
  </option>
))}
      </select>
    </div>

    <div className="flex items-end">
      <button
        onClick={assignOfficer}
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Assign Officer
      </button>
    </div>
  </div>

  {assignMessage && (
    <p className="mt-4 text-sm font-medium" role="status">
      {assignMessage}
    </p>
  )}
</div>


        <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total incidents</p>
          <p className="mt-2 text-3xl font-bold">{incidents.length}</p>
        </div>

        {loading ? (
          <p>Loading incidents...</p>
        ) : error ? (
          <p className="rounded-lg bg-red-50 p-4 text-red-700">
            Error: {error}
          </p>
        ) : incidents.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-gray-600">
            No incidents found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Incident</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr
                    key={incident.incident_id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4">{incident.incident_id}</td>
                    <td className="p-4 font-medium">{incident.title}</td>
                    <td className="p-4">
                      {incident.category_name || "—"}
                    </td>
                    <td className="p-4">
                      {incident.department_name || "—"}
                    </td>
                    <td className="p-4">{incident.location || "—"}</td>
                    <td className="p-4 capitalize">
                      {incident.priority || "—"}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                        {incident.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
