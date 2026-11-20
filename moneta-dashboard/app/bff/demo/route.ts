import { NextRequest, NextResponse } from "next/server";
import { getDemoMode } from "@/lib/server/demo-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secFetchSite = request.headers
    .get("sec-fetch-site")
    ?.trim()
    .toLowerCase();
  if (secFetchSite === "cross-site") {
    return NextResponse.json(
      { message: "Acesso cross-site não permitido" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { mode: getDemoMode() },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

