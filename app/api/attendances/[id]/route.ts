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

    const attendance = await prisma.attendance.findUnique({
      where: { id },
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

    if (!attendance) {
      return NextResponse.json({ error: "근태 데이터를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ attendance: toAttendanceResponse(attendance as AttendanceRecord) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "근태 조회에 실패했습니다." },
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
    const payload = (await request.json()) as AttendancePayload;
    const updateData: {
      employeeId?: string;
      date?: Date;
      status?: AttendanceStatusValue;
    } = {};

    if (typeof payload.employeeId === "string" && payload.employeeId.trim()) {
      updateData.employeeId = payload.employeeId.trim();
    }

    if (typeof payload.date === "string") {
      const date = parseDate(payload.date);

      if (!date) {
        return NextResponse.json({ error: "date 값이 올바르지 않습니다." }, { status: 400 });
      }

      updateData.date = date;
    }

    if (typeof payload.status === "string") {
      const status = payload.status.trim().toUpperCase();

      if (!isAttendanceStatusValue(status)) {
        return NextResponse.json({ error: "status 값이 올바르지 않습니다." }, { status: 400 });
      }

      updateData.status = status;
    }

    const data = {
      ...(updateData.employeeId
        ? {
            employee: {
              connect: { id: updateData.employeeId },
            },
          }
        : {}),
      ...(updateData.date ? { date: updateData.date } : {}),
      ...(updateData.status ? { status: updateData.status } : {}),
    };

    const attendance = await prisma.attendance.update({
      where: { id },
      data,
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

    return NextResponse.json({ attendance: toAttendanceResponse(attendance as AttendanceRecord) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "근태 수정에 실패했습니다." },
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

    await prisma.attendance.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "근태 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
