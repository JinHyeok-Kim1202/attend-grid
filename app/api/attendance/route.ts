import { NextResponse } from "next/server";

import {
  deriveAttendanceWorkUnits,
  formatAttendanceWorkUnits,
  getDayField,
  getAttendanceStatusFromWorkUnits,
  getMonthDate,
  parseAttendanceWorkUnitsInput,
  parseMonthValue,
} from "@/lib/attendance";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type AttendanceRow = {
  employeeId: string;
  employeeCode: string;
  name: string;
  phone: string;
  department: string;
  position: string;
} & Record<string, string>;

type AttendancePatchPayload = {
  employeeId?: string;
  month?: string;
  day?: number;
  value?: string;
};

type EmployeeRecord = {
  id: string;
  employeeCode: string;
  fullName: string;
  phone: string;
  department: string;
  position: string;
};

type AttendanceRecord = {
  employeeId: string;
  date: Date;
  status: string;
  workUnits: number | null;
};

export async function GET(request: Request) {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const { searchParams } = new URL(request.url);
    const monthInfo = parseMonthValue(searchParams.get("month"));

    const employees: EmployeeRecord[] = await prisma.employee.findMany({
      orderBy: [{ fullName: "asc" }],
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        phone: true,
        department: true,
        position: true,
      },
    });

    const startDate = getMonthDate(monthInfo.value, 1);
    const endDate = new Date(Date.UTC(monthInfo.year, monthInfo.monthIndex + 1, 1));

    const attendanceRecords: AttendanceRecord[] = await prisma.attendance.findMany({
      where: {
        employeeId: {
          in: employees.map((employee: EmployeeRecord) => employee.id),
        },
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        employeeId: true,
        date: true,
        status: true,
        workUnits: true,
      },
    });

    const recordMap = new Map<string, string>();

    attendanceRecords.forEach((record: AttendanceRecord) => {
      const day = new Date(record.date).getUTCDate();
      const field = `${record.employeeId}:${getDayField(day)}`;
      const workUnits = record.workUnits ?? deriveAttendanceWorkUnits(record.status);

      recordMap.set(field, formatAttendanceWorkUnits(workUnits));
    });

    const rows: AttendanceRow[] = employees.map((employee: EmployeeRecord) => {
      const baseRow: AttendanceRow = {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.fullName,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
      };

      for (let day = 1; day <= 31; day += 1) {
        const field = getDayField(day);
        baseRow[field] = recordMap.get(`${employee.id}:${field}`) ?? "";
      }

      return baseRow;
    });

    return NextResponse.json({
      month: monthInfo.value,
      daysInMonth: monthInfo.daysInMonth,
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "근태 데이터를 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const unauthorized = await requireApiSession();

    if (unauthorized) {
      return unauthorized;
    }

    const payload = (await request.json()) as AttendancePatchPayload;

    if (!payload.employeeId || !payload.month || !payload.day || payload.value == null) {
      return NextResponse.json({ error: "employeeId, month, day, value가 필요합니다." }, { status: 400 });
    }

    if (payload.day < 1 || payload.day > 31) {
      return NextResponse.json({ error: "일자 범위가 올바르지 않습니다." }, { status: 400 });
    }

    const monthInfo = parseMonthValue(payload.month);

    if (payload.day > monthInfo.daysInMonth) {
      return NextResponse.json({ error: "선택한 월에 없는 날짜입니다." }, { status: 400 });
    }

    const date = getMonthDate(monthInfo.value, payload.day);
    const parsed = parseAttendanceWorkUnitsInput(payload.value);

    if (!parsed.isValid) {
      return NextResponse.json({ error: parsed.error || "허용되지 않은 근무량입니다." }, { status: 400 });
    }

    if (parsed.workUnits == null) {
      await prisma.attendance.deleteMany({
        where: {
          employeeId: payload.employeeId,
          date,
        },
      });

      return NextResponse.json({
        employeeId: payload.employeeId,
        day: payload.day,
        value: "",
      });
    }

    const status = getAttendanceStatusFromWorkUnits(parsed.workUnits);

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: payload.employeeId,
          date,
        },
      },
        create: {
          employeeId: payload.employeeId,
          date,
          status,
          workUnits: parsed.workUnits,
        },
        update: {
          status,
          workUnits: parsed.workUnits,
        },
      select: {
        employeeId: true,
        date: true,
        status: true,
        workUnits: true,
      },
    });

    return NextResponse.json({
      employeeId: record.employeeId,
      day: new Date(record.date).getUTCDate(),
      value: formatAttendanceWorkUnits(record.workUnits ?? deriveAttendanceWorkUnits(record.status)),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "근태 저장에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
