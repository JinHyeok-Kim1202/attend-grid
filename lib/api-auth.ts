import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function requireApiSession() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  return null;
}
