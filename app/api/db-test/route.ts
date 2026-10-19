
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, version() AS version"
    );

    return NextResponse.json({
      success: true,
      message: "PostgreSQL connection successful",
      database: result.rows[0].database,
      version: result.rows[0].version,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "PostgreSQL connection failed",
      },
      { status: 500 }
    );
  }
}
