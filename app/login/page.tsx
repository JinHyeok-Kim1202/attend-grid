import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck, Workflow } from "lucide-react";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    icon: ShieldCheck,
    title: "보호된 라우트",
    description: "인증되지 않은 사용자는 자동으로 /login으로 이동합니다.",
  },
  {
    icon: Workflow,
    title: "역할 기반 세션",
    description: "ADMIN, MANAGER, USER 역할 정보가 세션에 포함됩니다.",
  },
  {
    icon: LockKeyhole,
    title: "PostgreSQL 연동",
    description: "사용자 정보는 Prisma를 통해 PostgreSQL 테이블에 저장됩니다.",
  },
];

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
        <section className="hidden rounded-[28px] border border-border/70 bg-slate-950 p-8 text-slate-50 shadow-2xl shadow-slate-900/20 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <Badge className="w-fit bg-white/10 text-slate-100">AttendGrid Secure Access</Badge>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
                출입, 근태, 승인 흐름을 한 화면에서 관리하는 ERP 인증 게이트
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                운영 대시보드 진입 전에 역할 기반 인증과 세션 검증을 수행하도록 구성했습니다.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="border-white/10 bg-white/6 text-slate-50 ring-0">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full">
            <div className="mb-5 lg:hidden">
              <Badge className="bg-slate-900 text-slate-50">AttendGrid Secure Access</Badge>
            </div>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
