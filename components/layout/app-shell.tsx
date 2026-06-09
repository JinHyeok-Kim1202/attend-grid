import type { ReactNode } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Command,
  LayoutGrid,
  LogOut,
  Menu,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { signOut } from "@/auth";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: string;
};

export type CurrentUser = {
  name?: string | null;
  email?: string | null;
  role: string;
};

type AppShellProps = {
  currentUser: CurrentUser;
  currentPath: string;
  eyebrow: string;
  title: string;
  titleBadge?: ReactNode;
  children: ReactNode;
};

const primaryNav: NavItem[] = [
  { label: "통합 현황", icon: LayoutGrid, href: "/" },
  { label: "직원 관리", icon: UsersRound, href: "/employees" },
  { label: "근태 관리", icon: ClipboardCheck, href: "/attendance" },
];

function getInitials(name?: string | null, email?: string | null) {
  const base = name?.trim() || email?.split("@")[0] || "AG";

  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    ADMIN: "관리자",
    MANAGER: "매니저",
    USER: "일반 사용자",
  };

  return labels[role] ?? role;
}

function isActivePath(currentPath: string, href?: string) {
  if (!href) {
    return false;
  }

  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath.startsWith(href);
}

function SidebarSection({ title, items, currentPath }: { title: string; items: NavItem[]; currentPath: string }) {
  return (
    <div className="space-y-3">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(currentPath, item.href);
          const className = cn(
            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          );
          const content = (
            <>
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {item.label}
              </span>
              {item.badge ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "border-current/15 bg-white/10 text-current",
                    !active && "bg-background text-muted-foreground"
                  )}
                >
                  {item.badge}
                </Badge>
              ) : null}
            </>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button key={item.label} type="button" className={className}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContent({ currentUser, currentPath }: { currentUser: CurrentUser; currentPath: string }) {
  return (
    <div className="flex h-full flex-col bg-sidebar px-4 py-5 text-sidebar-foreground">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Command className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.08em]">AttendGrid</p>
          <p className="text-xs text-muted-foreground">인력 운영 ERP 대시보드</p>
        </div>
      </div>

      <Separator className="my-5 bg-sidebar-border" />

      <div className="flex-1 space-y-6">
        <SidebarSection title="개요" items={primaryNav} currentPath={currentPath} />
      </div>

      <Card className="border-none bg-slate-900 text-slate-50 ring-0">
        <CardHeader>
          <CardTitle className="text-sm">세션 상태</CardTitle>
          <CardDescription className="text-slate-300">
            {getRoleLabel(currentUser.role)} 계정으로 로그인됨 · {currentUser.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-white/8 px-3 py-2">
            <span>권한 수준</span>
            <Badge className="bg-emerald-400/20 text-emerald-200">{getRoleLabel(currentUser.role)}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/8 px-3 py-2">
            <span>사용자</span>
            <span className="font-medium">{currentUser.name ?? currentUser.email ?? "미지정"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AppShell({
  currentUser,
  currentPath,
  eyebrow,
  title,
  titleBadge,
  children,
}: AppShellProps) {
  const initials = getInitials(currentUser.name, currentUser.email);

  async function handleSignOut() {
    "use server";

    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px]">
        <aside className="hidden w-[288px] shrink-0 border-r border-border/80 lg:flex">
          <SidebarContent currentUser={currentUser} currentPath={currentPath} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
            <div className="flex h-20 items-center gap-4 px-4 sm:px-6">
              <Sheet>
                <SheetTrigger
                  render={<button className={cn(buttonVariants({ variant: "outline", size: "icon" }), "lg:hidden")} />}
                >
                  <Menu className="size-4" />
                  <span className="sr-only">메뉴 열기</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-[290px] p-0" showCloseButton={false}>
                  <SheetHeader className="sr-only">
                    <SheetTitle>AttendGrid 내비게이션</SheetTitle>
                    <SheetDescription>운영 모듈과 관리 메뉴에 접근합니다.</SheetDescription>
                  </SheetHeader>
                  <SidebarContent currentUser={currentUser} currentPath={currentPath} />
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {eyebrow}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                  {titleBadge}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <form action={handleSignOut}>
                  <button type="submit" className={buttonVariants({ variant: "outline" })}>
                    <LogOut className="size-4" />
                    로그아웃
                  </button>
                </form>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/90 px-3 py-2 shadow-sm">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                    <AvatarBadge className="bg-emerald-500" />
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{currentUser.name ?? "AttendGrid User"}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
