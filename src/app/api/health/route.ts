import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        frontend: "healthy",
        backend: data.status,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        frontend: "healthy",
        backend: "unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        frontend: "healthy",
        backend: "unreachable",
        error: "Backend connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}



