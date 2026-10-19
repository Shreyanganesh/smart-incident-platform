
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT
         d.department_id,
         d.department_name,
         COUNT(DISTINCT i.incident_id)::int AS total_incidents,
         COUNT(DISTINCT i.incident_id)
           FILTER (
             WHERE i.status NOT IN ('resolved', 'rejected')
           )::int AS open_incidents,
         COUNT(DISTINCT i.incident_id)
           FILTER (
             WHERE i.status = 'resolved'
           )::int AS resolved_incidents
       FROM departments d
       LEFT JOIN categories c
         ON c.department_id = d.department_id
       LEFT JOIN incidents i
         ON i.category_id = c.category_id
       GROUP BY
         d.department_id,
         d.department_name
       ORDER BY d.department_id`
    );

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      departments: result.rows,
    });
  } catch (error) {
    console.error("Departments API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch departments.",
      },
      { status: 500 }
    );
  }
}
