import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({error:"accounts_issued_by_administrator"}, {status:403});
}
