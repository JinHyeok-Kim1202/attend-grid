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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ user: toUserResponse(user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "사용자 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const { id } = await params;
    const payload = (await request.json()) as UserPayload;
    const updateData: {
      name?: string | null;
      email?: string;
      role?: Role;
      passwordHash?: string;
    } = {};

    if (typeof payload.name === "string") {
      updateData.name = payload.name.trim() || null;
    }

    if (typeof payload.email === "string") {
      const email = payload.email.trim().toLowerCase();

      if (!email) {
        return NextResponse.json({ error: "email 값이 올바르지 않습니다." }, { status: 400 });
      }

      updateData.email = email;
    }

    if (typeof payload.role === "string") {
      const role = payload.role.trim().toUpperCase();

      if (!isRole(role)) {
        return NextResponse.json({ error: "role 값이 올바르지 않습니다." }, { status: 400 });
      }

      updateData.role = role;
    }

    if (typeof payload.password === "string") {
      const password = payload.password.trim();

      if (!password) {
        return NextResponse.json({ error: "password 값이 올바르지 않습니다." }, { status: 400 });
      }

      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: toUserResponse(user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "사용자 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const { id } = await params;

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "사용자 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
