
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    const incidentId = Number(body.incident_id);
    const officerId = Number(body.officer_id);
    const assignedBy = Number(body.assigned_by ?? 3);

    if (
      !Number.isInteger(incidentId) ||
      incidentId <= 0 ||
      !Number.isInteger(officerId) ||
      officerId <= 0 ||
      !Number.isInteger(assignedBy) ||
      assignedBy <= 0
    ) {
      return NextResponse.json(
        { success: false, message: "Valid incident and officer IDs are required." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const incident = await client.query(
      "SELECT incident_id, status FROM incidents WHERE incident_id = $1 FOR UPDATE",
      [incidentId]
    );

    if (incident.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, message: "Incident not found." },
        { status: 404 }
      );
    }

    const officer = await client.query(
      `SELECT user_id, full_name, department_id
       FROM users
       WHERE user_id = $1`,
      [officerId]
    );

    if (officer.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, message: "Officer not found." },
        { status: 404 }
      );
    }

   const assignment = await client.query(
  `INSERT INTO assignments (incident_id, officer_id, assigned_by)
   VALUES ($1, $2, $3)
   ON CONFLICT (incident_id, officer_id)
   DO UPDATE SET assigned_by = EXCLUDED.assigned_by
   RETURNING *`,
  [incidentId, officerId, assignedBy]
);
    const oldStatus = incident.rows[0].status;

    if (oldStatus !== "assigned") {
      await client.query(
        "UPDATE incidents SET status = 'assigned' WHERE incident_id = $1",
        [incidentId]
      );

      await client.query(
        `INSERT INTO status_history
          (incident_id, old_status, new_status, changed_by, remarks)
         VALUES ($1, $2, 'assigned', $3, $4)`,
        [
          incidentId,
          oldStatus,
          assignedBy,
          `Assigned to ${officer.rows[0].full_name}`,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Incident assigned successfully.",
      assignment: assignment.rows[0],
      officer: officer.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Assignment API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to assign incident.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
