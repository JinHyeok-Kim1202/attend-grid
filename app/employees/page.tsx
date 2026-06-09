import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmployeeManagement } from "@/components/employees/employee-management";
import { AppShell, type CurrentUser } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

export default async function EmployeesPage() {
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
      currentPath="/employees"
      eyebrow="기준 정보 관리"
      title="직원 관리"
      titleBadge={<Badge className="bg-sky-50 text-sky-700">AG Grid CRUD</Badge>}
    >
      <EmployeeManagement />
    </AppShell>
  );
}
