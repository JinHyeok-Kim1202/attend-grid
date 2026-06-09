"use client";

import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { PencilLine, Plus, Search, Trash2, UserRound } from "lucide-react";
import type { ColDef, GridApi, ICellRendererParams } from "ag-grid-community";

import { agGridModules } from "@/lib/ag-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmployeeRow = {
  id: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  employeeCode: string;
  createdAt: string;
};

type EmployeeForm = {
  name: string;
  phone: string;
  department: string;
  position: string;
};

type GridContext = {
  onEdit: (employee: EmployeeRow) => void;
  onDelete: (employee: EmployeeRow) => void;
};

const initialForm: EmployeeForm = {
  name: "",
  phone: "",
  department: "",
  position: "",
};

function ActionCellRenderer(params: ICellRendererParams<EmployeeRow>) {
  const employee = params.data;
  const context = params.context as GridContext;

  if (!employee) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-2 py-1">
      <Button variant="outline" size="sm" onClick={() => context.onEdit(employee)}>
        <PencilLine className="size-3.5" />
        수정
      </Button>
      <Button variant="destructive" size="sm" onClick={() => context.onDelete(employee)}>
        <Trash2 className="size-3.5" />
        삭제
      </Button>
    </div>
  );
}

export function EmployeeManagement() {
  const [gridApi, setGridApi] = useState<GridApi<EmployeeRow> | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [saving, setSaving] = useState(false);

  const loadEmployees = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/employees", {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        employees?: EmployeeRow[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "직원 목록을 불러오지 못했습니다.");
      }

      setEmployees(data.employees ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "직원 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption("quickFilterText", query);
    }
  }, [gridApi, query]);

  const columnDefs = useMemo<ColDef<EmployeeRow>[]>(
    () => [
      { field: "name", headerName: "이름", minWidth: 160, pinned: "left" },
      { field: "phone", headerName: "전화번호", minWidth: 150 },
      { field: "department", headerName: "부서", minWidth: 150 },
      { field: "position", headerName: "직책", minWidth: 150 },
      {
        field: "createdAt",
        headerName: "등록일",
        minWidth: 130,
        valueFormatter: ({ value }) =>
          typeof value === "string"
            ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value))
            : "-",
      },
      {
        field: "id",
        headerName: "관리",
        sortable: false,
        filter: false,
        minWidth: 190,
        maxWidth: 210,
        pinned: "right",
        cellRenderer: ActionCellRenderer,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<EmployeeRow>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
    }),
    []
  );

  const openCreateDialog = () => {
    setEditingEmployee(null);
    setForm(initialForm);
    setDialogOpen(true);
  };

  const openEditDialog = (employee: EmployeeRow) => {
    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (employee: EmployeeRow) => {
    const confirmed = window.confirm(`${employee.name} 직원을 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "직원 삭제에 실패했습니다.");
      }

      setEmployees((current) => current.filter((item) => item.id !== employee.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "직원을 삭제하지 못했습니다.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees", {
        method: editingEmployee ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as {
        employee?: EmployeeRow;
        error?: string;
      };

      if (!response.ok || !data.employee) {
        throw new Error(data.error || "직원 저장에 실패했습니다.");
      }

      const savedEmployee = data.employee;

      setEmployees((current) => {
        if (editingEmployee) {
          return current.map((item) => (item.id === savedEmployee.id ? savedEmployee : item));
        }

        return [savedEmployee, ...current];
      });

      setDialogOpen(false);
      setEditingEmployee(null);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "직원 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 bg-white/92 shadow-sm">
        <CardHeader className="gap-4 md:flex md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>
              직원 정보를 검색하고, 추가 및 수정하며, AG Grid로 빠르게 관리할 수 있습니다.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
              총 {employees.length}명
            </Badge>
            <Button onClick={openCreateDialog}>
              <Plus className="size-4" />
              직원 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 rounded-xl border-border/80 bg-white pl-9 shadow-sm"
                placeholder="이름, 전화번호, 부서, 직책 검색"
              />
            </div>
            <Button variant="outline" onClick={() => void loadEmployees()} disabled={loading}>
              새로고침
            </Button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="erp-grid ag-theme-quartz h-[620px] w-full">
            <AgGridReact<EmployeeRow>
              modules={agGridModules}
              animateRows
              rowData={employees}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination
              paginationPageSize={10}
              rowHeight={52}
              headerHeight={44}
              loading={loading}
              suppressCellFocus
              onGridReady={({ api }) => setGridApi(api)}
              context={{
                onEdit: openEditDialog,
                onDelete: handleDelete,
              }}
              overlayNoRowsTemplate={
                '<div style="padding:24px;text-align:center;color:#64748b;">등록된 직원이 없습니다. 첫 직원을 추가해 주세요.</div>'
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-white/92 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <UserRound className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">직원 데이터 운영 팁</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                이름, 부서, 직책 컬럼은 정렬과 필터를 동시에 사용할 수 있고, 검색창은 전체 컬럼에 빠르게 적용됩니다.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
            AG Grid Pagination 활성화
          </Badge>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "직원 정보 수정" : "직원 추가"}</DialogTitle>
            <DialogDescription>
              이름, 전화번호, 부서, 직책 정보를 입력해 직원 정보를 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="employee-name">이름</Label>
                <Input
                  id="employee-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="홍길동"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-phone">전화번호</Label>
                <Input
                  id="employee-phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="010-1234-5678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-department">부서</Label>
                <Input
                  id="employee-department"
                  value={form.department}
                  onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                  placeholder="인사팀"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="employee-position">직책</Label>
                <Input
                  id="employee-position"
                  value={form.position}
                  onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
                  placeholder="매니저"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "저장 중..." : editingEmployee ? "수정 저장" : "직원 추가"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
