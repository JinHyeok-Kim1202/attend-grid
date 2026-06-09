import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type EmployeePayload = {
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
};

function normalizeEmployeePayload(payload: EmployeePayload) {
  const name = payload.name?.trim();
  const phone = payload.phone?.trim();
  const department = payload.department?.trim();
  const position = payload.position?.trim();

  if (!name || !phone || !department || !position) {
    return null;
  }

  return {
    fullName: name,
    phone,
    department,
    position,
  };
}

function toEmployeeRow(employee: {
  id: string;
  employeeCode: string;
  fullName: string;
  phone: string;
  department: string;
  position: string;
  createdAt: Date;
}) {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    name: employee.fullName,
    phone: employee.phone,
    department: employee.department,
    position: employee.position,
    createdAt: employee.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        phone: true,
        department: true,
        position: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      employees: employees.map(toEmployeeRow),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "직원 목록을 불러오지 못했습니다.",
      },
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

    const payload = (await request.json()) as EmployeePayload;
    const employeeData = normalizeEmployeePayload(payload);

    if (!employeeData) {
      return NextResponse.json({ error: "모든 필드를 입력해 주세요." }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: employeeData,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        phone: true,
        department: true,
        position: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ employee: toEmployeeRow(employee) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "직원 추가에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
