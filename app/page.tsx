import { redirect } from "next/navigation";
import { Building2, CalendarClock, CheckCircle2, ClipboardList } from "lucide-react";

import { auth } from "@/auth";
import { AttendanceGrid } from "@/components/dashboard/attendance-grid";
import { AppShell, type CurrentUser } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deriveAttendanceWorkUnits,
  formatAttendanceWorkUnits,
  getCurrentMonthValue,
  getMonthDate,
  parseMonthValue,
} from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type DashboardEmployeeRecord = {
  id: string;
  employeeCode: string;
  fullName: string;
  phone: string;
  department: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  attendances: Array<{
    date: Date;
    status: string;
    workUnits: number | null;
  }>;
};

type AttendanceBucketRecord = {
  label: string;
  count: number;
};

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentUser: CurrentUser = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  const currentMonth = getCurrentMonthValue();
  const monthInfo = parseMonthValue(currentMonth);
  const monthStart = getMonthDate(currentMonth, 1);
  const monthEnd = new Date(Date.UTC(monthInfo.year, monthInfo.monthIndex + 1, 1));
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const tomorrowStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

  const [employees, totalEmployees, activeEmployees, departmentGroups] = await Promise.all([
      prisma.employee.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          phone: true,
          department: true,
          position: true,
          isActive: true,
          createdAt: true,
          attendances: {
            where: {
              date: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
            select: {
              date: true,
              status: true,
              workUnits: true,
            },
          },
        },
      }),
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.employee.groupBy({ by: ["department"] }),
    ]);

  const typedEmployees = employees as DashboardEmployeeRecord[];

  function getAttendanceWorkUnits(attendance: DashboardEmployeeRecord["attendances"][number]) {
    return attendance.workUnits ?? deriveAttendanceWorkUnits(attendance.status);
  }

  const overviewRows = typedEmployees.map((employee: DashboardEmployeeRecord) => {
    const todayRecord = employee.attendances.find(
      (attendance: DashboardEmployeeRecord["attendances"][number]) =>
        attendance.date.getTime() >= todayStart.getTime() && attendance.date.getTime() < tomorrowStart.getTime()
    );

    const todayWorkUnits = todayRecord ? getAttendanceWorkUnits(todayRecord) : null;
    const monthlyWorkUnits = employee.attendances.reduce((sum, attendance) => sum + (getAttendanceWorkUnits(attendance) ?? 0), 0);

    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.fullName,
      department: employee.department,
      position: employee.position,
      phone: employee.phone,
      todayWorkUnits: todayWorkUnits != null ? `${formatAttendanceWorkUnits(todayWorkUnits)}일` : "미입력",
      monthlyWorkUnits,
    };
  });

  const monthlyWorkUnitsTotal = overviewRows.reduce((sum, row) => sum + row.monthlyWorkUnits, 0);
  const todayWorkedCount = overviewRows.filter((row) => row.todayWorkUnits !== "미입력").length;
  const workUnitSummaryMap = typedEmployees.reduce((summaryMap, employee) => {
    employee.attendances.forEach((attendance) => {
      const workUnits = getAttendanceWorkUnits(attendance);
      const label = formatAttendanceWorkUnits(workUnits);

      if (!label) {
        return;
      }

      summaryMap.set(label, (summaryMap.get(label) ?? 0) + 1);
    });

    return summaryMap;
  }, new Map<string, number>());

  const workUnitSummary: AttendanceBucketRecord[] = Array.from(workUnitSummaryMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => Number(right.label) - Number(left.label));

  const kpis = [
    {
      label: "등록 직원 수",
      value: `${totalEmployees}명`,
      change: `활성 직원 ${activeEmployees}명`,
      tone: "bg-sky-50 text-sky-700 ring-sky-100",
      icon: Building2,
    },
    {
      label: "운영 부서 수",
      value: `${departmentGroups.length}개`,
      change: `${new Set(typedEmployees.map((employee: DashboardEmployeeRecord) => employee.position)).size}개 직책 사용 중`,
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      icon: CheckCircle2,
    },
    {
      label: "이번 달 누적 공수",
      value: `${formatAttendanceWorkUnits(monthlyWorkUnitsTotal) || "0"}일`,
      change: `${monthInfo.year}년 ${monthInfo.monthIndex + 1}월 기준`,
      tone: "bg-amber-50 text-amber-700 ring-amber-100",
      icon: ClipboardList,
    },
    {
      label: "오늘 입력 완료",
      value: `${todayWorkedCount}명`,
      change: `미입력 ${Math.max(totalEmployees - todayWorkedCount, 0)}명`,
      tone: "bg-slate-100 text-slate-700 ring-slate-200",
      icon: CalendarClock,
    },
  ];

  return (
    <AppShell
      currentUser={currentUser}
      currentPath="/"
      eyebrow="인력 운영 통합 관리"
      title="운영 대시보드"
      titleBadge={<Badge className="bg-sky-50 text-sky-700">실제 데이터 기반 현황</Badge>}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="border border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardDescription className="text-[12px] uppercase tracking-[0.18em]">
                    {item.label}
                  </CardDescription>
                  <CardAction>
                    <Badge className={cn("ring-1", item.tone)}>{item.change}</Badge>
                  </CardAction>
                  <div className="flex items-end justify-between gap-3">
                    <CardTitle className="text-3xl font-semibold tracking-tight">{item.value}</CardTitle>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                      <Icon className="size-5" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
            <Card className="border border-border/70 bg-white/92 shadow-sm">
              <CardHeader>
                <CardTitle>직원 통합 현황</CardTitle>
                <CardDescription>
                  현재 DB에 등록된 직원 정보를 기준으로 오늘 공수와 이번 달 누적 공수를 함께 보여줍니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <AttendanceGrid rows={overviewRows} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/70 bg-white/92 shadow-sm">
              <CardHeader>
                <CardTitle>최근 등록 직원</CardTitle>
                <CardDescription>가장 최근에 등록된 직원 5명을 표시합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {typedEmployees.slice(0, 5).map((employee: DashboardEmployeeRecord) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{employee.fullName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {employee.department} · {employee.position}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-border/70 bg-background text-foreground">
                      {employee.employeeCode}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {workUnitSummary.length > 0 ? (
              <Card className="border border-border/70 bg-white/92 shadow-sm">
                <CardHeader>
                  <CardTitle>이번 달 공수 입력 요약</CardTitle>
                  <CardDescription>입력된 근무량을 값별로 집계한 결과입니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workUnitSummary.map((item: AttendanceBucketRecord) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
                    >
                      <span className="font-medium text-foreground">{item.label}일</span>
                      <Badge variant="outline" className="border-border/70 bg-background text-foreground">
                        {item.count}건
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-dashed border-border/80 bg-white/80 shadow-sm">
                <CardHeader>
                  <CardTitle>이번 달 공수 데이터 없음</CardTitle>
                  <CardDescription>
                    아직 입력된 공수 데이터가 없어 요약을 표시하지 않습니다. `근태 관리` 페이지에서 데이터를 입력하면 여기에 반영됩니다.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
