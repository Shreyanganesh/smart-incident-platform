
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT
         sh.history_id,
         sh.incident_id,
         i.title AS incident_title,
         sh.old_status,
         sh.new_status,
         sh.changed_by,
         u.full_name AS changed_by_name,
         sh.remarks,
         sh.changed_at
       FROM status_history sh
       JOIN incidents i
         ON sh.incident_id = i.incident_id
       LEFT JOIN users u
         ON sh.changed_by = u.user_id
       ORDER BY sh.changed_at DESC, sh.history_id DESC`
    );

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      history: result.rows,
    });
  } catch (error) {
    console.error("Activity History API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
