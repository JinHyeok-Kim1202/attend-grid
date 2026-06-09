"use client";

import { useActionState } from "react";

import { authenticate } from "@/app/login/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState = {
  error: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <Card className="border border-border/70 bg-white/95 shadow-xl shadow-slate-200/60">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
            Auth.js
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
            역할 기반 접근
          </Badge>
        </div>
        <div>
          <CardTitle className="text-2xl font-semibold tracking-tight">로그인</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">
            이메일과 비밀번호로 로그인하고 보호된 대시보드에 접근하세요.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              이메일
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@attendgrid.local"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              비밀번호
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {state.error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </div>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
