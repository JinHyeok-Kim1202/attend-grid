import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Role = "ADMIN" | "MANAGER" | "USER";

type UserPayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
};

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

function isRole(value: string): value is Role {
  return value === "ADMIN" || value === "MANAGER" || value === "USER";
}

function normalizeUserPayload(payload: UserPayload) {
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const role = payload.role?.trim().toUpperCase() ?? "USER";
  const name = payload.name?.trim() || null;

  if (!email || !password || !isRole(role)) {
    return null;
  }

  return {
    name,
    email,
    password,
    role,
  };
}

function toUserResponse(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const users: UserRecord[] = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ users: users.map(toUserResponse) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "사용자 목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const payload = (await request.json()) as UserPayload;
    const normalized = normalizeUserPayload(payload);

    if (!normalized) {
      return NextResponse.json({ error: "name, email, password, role 값을 확인해 주세요." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(normalized.password, 10);

    const user = await prisma.user.create({
      data: {
        name: normalized.name,
        email: normalized.email,
        passwordHash,
        role: normalized.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: toUserResponse(user) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "사용자 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
