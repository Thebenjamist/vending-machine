import { NextResponse } from "next/server";
import { purchase } from "@/lib/store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: "INVALID_INPUT",
        message: "Expected JSON body.",
      },
      { status: 400 },
    );
  }

  const { customerId, pricePence, paidPence } = (body ?? {}) as {
    customerId?: string;
    pricePence?: number;
    paidPence?: number;
  };

  const result = purchase({
    customerId: customerId ?? "",
    pricePence: pricePence as number,
    paidPence: paidPence as number,
  });

  const status = result.ok
    ? 200
    : result.reason === "RATE_LIMITED"
      ? 429
      : result.reason === "INVALID_INPUT"
        ? 400
        : 409;

  return NextResponse.json(result, { status });
}
