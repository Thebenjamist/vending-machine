import { NextResponse } from "next/server";
import { parseSupply } from "@/lib/parseSupply";
import { resetStore } from "@/lib/store";

/**
 * Alias of /api/machine/reset for E2E helpers.
 * Kept so existing test docs/scripts keep working.
 */
export async function POST(request: Request) {
  let body: { supply?: unknown; cashBoxPence?: number } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supply = parseSupply(body.supply);
  if (body.supply !== undefined && !supply) {
    return NextResponse.json(
      { ok: false, message: "Invalid supply payload." },
      { status: 400 },
    );
  }

  const state = resetStore({
    supply,
    cashBoxPence: body.cashBoxPence,
  });

  return NextResponse.json({ ok: true, ...state });
}
