import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import { AppShell, type CurrentUser } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

export default async function AttendancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentUser: CurrentUser = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  return (
    <AppShell
      currentUser={currentUser}
      currentPath="/attendance"
      eyebrow="근태 운영"
      title="근태 관리"
      titleBadge={<Badge className="bg-emerald-50 text-emerald-700">엔터프라이즈 시트</Badge>}
    >
      <AttendanceSheet />
    </AppShell>
  );
}
