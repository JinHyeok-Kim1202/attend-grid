"use client";

import { useEffect, useMemo, useState } from "react";
import type { CellValueChangedEvent, ColDef, ExcelStyle, GridApi } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Download, Grip, LoaderCircle } from "lucide-react";

import {
  getCurrentMonthValue,
  getDayField,
  getKoreanMonthLabel,
  parseAttendanceWorkUnitsInput,
  parseMonthValue,
} from "@/lib/attendance";
import { agGridModules } from "@/lib/ag-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AttendanceRow = {
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  position: string;
} & Record<string, string>;

type AttendanceResponse = {
  month: string;
  daysInMonth: number;
  rows: AttendanceRow[];
};

const excelStyles: ExcelStyle[] = [
  { id: "excel-header", font: { bold: true, color: "#233347" }, interior: { color: "#e9f0f8", pattern: "Solid" } },
  { id: "work-full-day", interior: { color: "#dcfce7", pattern: "Solid" } },
  { id: "work-partial-day", interior: { color: "#fef3c7", pattern: "Solid" } },
  { id: "inactive-day", interior: { color: "#f8fafc", pattern: "Solid" }, font: { color: "#94a3b8" } },
];

function getWorkUnitsClass(value: string) {
  const parsed = parseAttendanceWorkUnitsInput(value);

  if (!parsed.isValid || parsed.workUnits == null) {
    return "";
  }

  return parsed.workUnits >= 1 ? "work-full-day" : "work-partial-day";
}

export function AttendanceSheet() {
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [daysInMonth, setDaysInMonth] = useState(parseMonthValue(month).daysInMonth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [gridApi, setGridApi] = useState<GridApi<AttendanceRow> | null>(null);

  const monthInfo = useMemo(() => parseMonthValue(month), [month]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAttendance() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/attendance?month=${month}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = (await response.json()) as AttendanceResponse & { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "근태 데이터를 불러오지 못했습니다.");
        }

        setRows(data.rows ?? []);
        setDaysInMonth(data.daysInMonth ?? monthInfo.daysInMonth);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "근태 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void loadAttendance();

    return () => controller.abort();
  }, [month, monthInfo.daysInMonth]);

  const dayColumns = useMemo<ColDef<AttendanceRow>[]>(() => {
    return Array.from({ length: 31 }, (_, index) => {
      const day = index + 1;
      const field = getDayField(day);
      const inactive = day > daysInMonth;

      return {
        field,
        headerName: `${day}일`,
        minWidth: 92,
        maxWidth: 102,
        editable: !inactive,
        singleClickEdit: true,
        valueSetter: (params) => {
          const parsed = parseAttendanceWorkUnitsInput(params.newValue);

          if (!parsed.isValid || !params.data) {
            if (!parsed.isValid) {
              setError(parsed.error ?? "근무량 형식이 올바르지 않습니다.");
            }

            return false;
          }

          const nextValue = parsed.normalizedValue;

          if (params.data[field] === nextValue) {
            return false;
          }

          params.data[field] = nextValue;
          setError("");

          return true;
        },
        cellClass: ({ value }) => {
          const classes = ["attendance-cell"];

          if (inactive) {
            classes.push("attendance-cell-inactive", "inactive-day");
          }

          const statusClass = typeof value === "string" ? getWorkUnitsClass(value) : "";

          if (statusClass) {
            classes.push(statusClass);
          }

          return classes;
        },
        headerClass: inactive ? "attendance-header-inactive" : "attendance-header-day",
      } satisfies ColDef<AttendanceRow>;
    });
  }, [daysInMonth]);

  const columnDefs = useMemo<ColDef<AttendanceRow>[]>(
    () => [
      { field: "name", headerName: "이름", pinned: "left", minWidth: 150, maxWidth: 180 },
      { field: "department", headerName: "부서", pinned: "left", minWidth: 120, maxWidth: 140 },
      { field: "position", headerName: "직책", pinned: "left", minWidth: 120, maxWidth: 140 },
      ...dayColumns,
    ],
    [dayColumns]
  );

  const defaultColDef = useMemo<ColDef<AttendanceRow>>(
    () => ({
      sortable: false,
      filter: false,
      resizable: true,
      suppressMovable: true,
    }),
    []
  );

  async function persistCellChange(event: CellValueChangedEvent<AttendanceRow>) {
    const field = event.colDef.field;

    if (!field || !field.startsWith("day") || !event.data) {
      return;
    }

    const newValue = event.newValue;
    const oldValue = event.oldValue;

    const parsed = parseAttendanceWorkUnitsInput(newValue);

    if (!parsed.isValid || parsed.normalizedValue === oldValue) {
      return;
    }

    const day = Number(field.replace("day", ""));

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/attendance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: event.data.employeeId,
          month,
          day,
          value: parsed.normalizedValue,
        }),
      });

      const data = (await response.json()) as { error?: string; value?: string };

      if (!response.ok) {
        throw new Error(data.error || "근태 저장에 실패했습니다.");
      }

      if (typeof data.value === "string" && data.value !== parsed.normalizedValue) {
        event.node.setDataValue(field, data.value);
      }
    } catch (saveError) {
      event.node.setDataValue(field, oldValue ?? "");
      setError(saveError instanceof Error ? saveError.message : "근태 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 bg-white/92 shadow-sm">
        <CardHeader className="gap-4 md:flex md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>작업 공수 시트</CardTitle>
            <CardDescription>
              셀에 `1`, `0.5`처럼 숫자를 직접 입력해 월별 작업량을 관리합니다. 비워 두면 해당 날짜는 미작업으로 처리됩니다.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
              {getKoreanMonthLabel(month)}
            </Badge>
            <Button
              variant="outline"
              onClick={() => gridApi?.exportDataAsExcel({ fileName: `attendance-${month}.xlsx` })}
              disabled={!gridApi}
            >
              <Download className="size-4" />
              Excel 내보내기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="attendance-month">
                월 선택
              </label>
              <Input
                id="attendance-month"
                type="month"
                className="h-10 w-[180px] rounded-xl border-border/80 bg-white shadow-sm"
                value={month}
                onChange={(event) => setMonth(event.target.value || getCurrentMonthValue())}
              />
              {saving ? (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  <LoaderCircle className="size-3.5 animate-spin" />
                  저장 중
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: "비움", description: "미작업" },
                { label: "1", description: "하루 작업" },
                { label: "0.5", description: "반일 작업" },
              ].map((item) => (
                <Badge key={item.label} variant="outline" className="border-border/70 bg-background text-foreground">
                  {item.label} = {item.description}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-2">
                <Grip className="size-4" />
                드래그 채우기 지원
              </span>
              <span>`Ctrl/Cmd + C`, `Ctrl/Cmd + V` 복사/붙여넣기</span>
              <span>마우스 드래그로 다중 셀 선택</span>
              <span>입력값은 0보다 크고 1 이하여야 합니다</span>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="attendance-sheet-grid ag-theme-quartz h-[720px] w-full">
            <AgGridReact<AttendanceRow>
              modules={agGridModules}
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows
              loading={loading}
              cellSelection={{
                suppressMultiRanges: false,
                enableHeaderHighlight: true,
                handle: {
                  mode: "fill",
                  direction: "xy",
                },
              }}
              undoRedoCellEditing
              undoRedoCellEditingLimit={200}
              stopEditingWhenCellsLoseFocus
              excelStyles={excelStyles}
              onGridReady={({ api }) => setGridApi(api)}
              onCellValueChanged={(event) => void persistCellChange(event)}
              overlayNoRowsTemplate={
                '<div style="padding:24px;text-align:center;color:#64748b;">등록된 직원이 없습니다. 먼저 직원 정보를 추가해 주세요.</div>'
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
