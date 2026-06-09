import { NextResponse } from "next/server";

import { isAttendanceStatusValue, type AttendanceStatusValue } from "@/lib/attendance";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type AttendancePayload = {
  employeeId?: string;
  date?: string;
  status?: string;
};

type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: string;
    fullName: string;
    department: string;
    position: string;
  };
};

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toAttendanceResponse(attendance: AttendanceRecord) {
  return {
    id: attendance.id,
    employeeId: attendance.employeeId,
    date: attendance.date.toISOString(),
    status: attendance.status,
    employee: attendance.employee,
    createdAt: attendance.createdAt.toISOString(),
    updatedAt: attendance.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const attendances: AttendanceRecord[] = await prisma.attendance.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json({ attendances: attendances.map(toAttendanceResponse) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "근태 목록 조회에 실패했습니다." },
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

    const payload = (await request.json()) as AttendancePayload;
    const date = parseDate(payload.date);

    const status = payload.status?.trim().toUpperCase();

    if (!payload.employeeId || !date || !status || !isAttendanceStatusValue(status)) {
      return NextResponse.json(
        { error: "employeeId, date, status 값을 확인해 주세요." },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        employee: {
          connect: { id: payload.employeeId },
        },
        date,
        status: status as AttendanceStatusValue,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json({ attendance: toAttendanceResponse(attendance) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "근태 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
