import { NextResponse } from "next/server";
import { getMachineState } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getMachineState());
}
