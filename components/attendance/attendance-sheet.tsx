"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColDef, ExcelStyle, GridApi, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Download, LoaderCircle } from "lucide-react";

import {
  formatAttendanceWorkUnits,
  getCurrentMonthValue,
  getDayField,
  getKoreanMonthLabel,
  parseAttendanceWorkUnitsInput,
  parseMonthValue,
} from "@/lib/attendance";
import { agGridModules } from "@/lib/ag-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AttendanceRow = {
  employeeId: string;
  employeeCode: string;
  name: string;
  phone: string;
  department: string;
  position: string;
} & Record<string, string>;

type AttendanceGridRow = AttendanceRow & {
  rowNumber: string;
};

type AttendanceResponse = {
  month: string;
  daysInMonth: number;
  rows: AttendanceRow[];
};

type AttendanceSnapshot = Record<string, string>;
type SavingCellMap = Record<string, true>;
type InputMode = "input" | "click";

const ALL_DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

const excelStyles: ExcelStyle[] = [
  { id: "excel-header", font: { bold: true, color: "#2c2c2a" }, interior: { color: "#f1f5f9", pattern: "Solid" } },
  { id: "work-full-day", interior: { color: "#dcfce7", pattern: "Solid" } },
  { id: "work-partial-day", interior: { color: "#fef3c7", pattern: "Solid" } },
  { id: "work-overtime-day", interior: { color: "#dbeafe", pattern: "Solid" } },
  { id: "inactive-day", interior: { color: "#f8fafc", pattern: "Solid" }, font: { color: "#94a3b8" } },
];

function buildCellKey(employeeId: string, dayField: string) {
  return `${employeeId}:${dayField}`;
}

function buildSnapshot(rows: AttendanceRow[]) {
  return rows.reduce<AttendanceSnapshot>((snapshot, row) => {
    ALL_DAYS.forEach((day) => {
      const field = getDayField(day);
      snapshot[buildCellKey(row.employeeId, field)] = row[field] ?? "";
    });

    return snapshot;
  }, {});
}

function summarizeAttendance(row: AttendanceRow) {
  let totalWorkUnits = 0;
  let totalWorkedDays = 0;

  ALL_DAYS.forEach((day) => {
    const parsed = parseAttendanceWorkUnitsInput(row[getDayField(day)] ?? "");

    if (parsed.isValid && parsed.workUnits != null) {
      totalWorkUnits += parsed.workUnits;
      totalWorkedDays += 1;
    }
  });

  return {
    totalWorkUnits: formatAttendanceWorkUnits(totalWorkUnits) || "-",
    totalWorkedDays: totalWorkedDays > 0 ? String(totalWorkedDays) : "-",
  };
}

function getWorkUnitsClass(value: string) {
  const parsed = parseAttendanceWorkUnitsInput(value);

  if (!parsed.isValid || parsed.workUnits == null) {
    return "";
  }

  if (parsed.workUnits > 1) {
    return "work-overtime-day";
  }

  return parsed.workUnits === 1 ? "work-full-day" : "work-partial-day";
}

function getNextClickValue(value: string) {
  const normalized = parseAttendanceWorkUnitsInput(value).normalizedValue;

  if (!normalized) {
    return "1";
  }

  if (normalized === "1") {
    return "0.5";
  }

  if (normalized === "0.5") {
    return "1.5";
  }

  if (normalized === "1.5") {
    return "";
  }

  return "";
}

function TwoLineCell({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="attendance-two-line-cell">
      <div>{top}</div>
      <div>{bottom}</div>
    </div>
  );
}

function EmployeeMetaCell({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="attendance-meta-cell">
      <span>{top || "-"}</span>
      <span>{bottom || "-"}</span>
    </div>
  );
}

function CalendarCell(
  params: ICellRendererParams<AttendanceGridRow> & {
    daysInMonth: number;
    inputMode: InputMode;
    savingCells: SavingCellMap;
    onCommit: (employeeId: string, day: number, value: string) => void;
  }
) {
  const row = params.data;

  if (!row) {
    return null;
  }

  const renderDay = (day: number | null) => {
    if (!day || day > params.daysInMonth) {
      return <div className="attendance-day-cell attendance-day-empty" />;
    }

    const field = getDayField(day);
    const value = row[field] ?? "";
    const statusClass = getWorkUnitsClass(value);
    const cellKey = buildCellKey(row.employeeId, field);
    const saving = params.savingCells[cellKey];

    return (
      <div className={`attendance-day-cell ${statusClass}`} data-day={day}>
        <span className="attendance-day-number">{day}</span>
        {params.inputMode === "click" ? (
          <button
            className="attendance-day-button"
            type="button"
            onClick={() => params.onCommit(row.employeeId, day, getNextClickValue(value))}
          >
            {saving ? "..." : value}
          </button>
        ) : (
          <input
            className="attendance-day-input"
            defaultValue={value}
            inputMode="decimal"
            maxLength={4}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={(event) => params.onCommit(row.employeeId, day, event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="attendance-calendar-cell">
      <div className="attendance-calendar-row">
        {Array.from({ length: 16 }, (_, index) => renderDay(index < 15 ? index + 1 : null))}
      </div>
      <div className="attendance-calendar-row">
        {Array.from({ length: 16 }, (_, index) => renderDay(index + 16))}
      </div>
    </div>
  );
}

export function AttendanceSheet() {
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [daysInMonth, setDaysInMonth] = useState(parseMonthValue(month).daysInMonth);
  const [loading, setLoading] = useState(true);
  const [savingCells, setSavingCells] = useState<SavingCellMap>({});
  const [error, setError] = useState("");
  const [gridApi, setGridApi] = useState<GridApi<AttendanceGridRow> | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("input");
  const rowsRef = useRef<AttendanceRow[]>([]);
  const committedSnapshotRef = useRef<AttendanceSnapshot>({});

  const monthInfo = useMemo(() => parseMonthValue(month), [month]);
  const saving = Object.keys(savingCells).length > 0;
  const rowData = useMemo<AttendanceGridRow[]>(
    () => rows.map((row, index) => ({ ...row, rowNumber: String(index + 1) })),
    [rows]
  );

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

        const nextRows = data.rows ?? [];

        rowsRef.current = nextRows;
        committedSnapshotRef.current = buildSnapshot(nextRows);
        setRows(nextRows);
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

  function updateRowValue(employeeId: string, dayField: string, value: string) {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row) => (row.employeeId === employeeId ? { ...row, [dayField]: value } : row));

      rowsRef.current = nextRows;
      return nextRows;
    });
  }

  function setCellSaving(cellKey: string, active: boolean) {
    setSavingCells((current) => {
      if (active) {
        return { ...current, [cellKey]: true };
      }

      const next = { ...current };
      delete next[cellKey];
      return next;
    });
  }

  const commitAttendanceValue = useCallback(
    async (employeeId: string, day: number, rawValue: string) => {
      if (day < 1 || day > daysInMonth) {
        return;
      }

      const dayField = getDayField(day);
      const parsed = parseAttendanceWorkUnitsInput(rawValue);

      if (!parsed.isValid) {
        setError(parsed.error ?? "근무량 형식이 올바르지 않습니다.");
        gridApi?.refreshCells({ force: true });
        return;
      }

      const nextValue = parsed.normalizedValue;
      const cellKey = buildCellKey(employeeId, dayField);
      const previousValue = committedSnapshotRef.current[cellKey] ?? "";

      if (nextValue === previousValue) {
        updateRowValue(employeeId, dayField, nextValue);
        setError("");
        return;
      }

      updateRowValue(employeeId, dayField, nextValue);
      setCellSaving(cellKey, true);
      setError("");

      try {
        const response = await fetch("/api/attendance", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId,
            month,
            day,
            value: nextValue,
          }),
        });

        const data = (await response.json()) as { error?: string; value?: string };

        if (!response.ok) {
          throw new Error(data.error || "근태 저장에 실패했습니다.");
        }

        const savedValue = typeof data.value === "string" ? data.value : nextValue;

        committedSnapshotRef.current[cellKey] = savedValue;

        if (savedValue !== nextValue) {
          updateRowValue(employeeId, dayField, savedValue);
        }
      } catch (saveError) {
        updateRowValue(employeeId, dayField, previousValue);
        setError(saveError instanceof Error ? saveError.message : "근태 저장에 실패했습니다.");
      } finally {
        setCellSaving(cellKey, false);
      }
    },
    [daysInMonth, gridApi, month]
  );

  const columnDefs = useMemo<ColDef<AttendanceGridRow>[]>(
    () => [
      {
        pinned: "left",
        field: "rowNumber",
        headerName: "No",
        width: 58,
        cellClass: "attendance-cell attendance-cell-center attendance-cell-muted",
      },
      {
        pinned: "left",
        field: "name",
        headerName: "성명",
        width: 122,
        cellClass: "attendance-cell attendance-cell-strong",
      },
      {
        pinned: "left",
        headerName: "사번 / 부서",
        width: 156,
        cellRenderer: ({ data }: ICellRendererParams<AttendanceGridRow>) =>
          data ? <EmployeeMetaCell top={data.employeeCode} bottom={data.department} /> : null,
        cellClass: "attendance-cell",
      },
      {
        pinned: "left",
        headerName: "연락처 / 직책",
        width: 168,
        cellRenderer: ({ data }: ICellRendererParams<AttendanceGridRow>) =>
          data ? <EmployeeMetaCell top={data.phone} bottom={data.position} /> : null,
        cellClass: "attendance-cell",
      },
      {
        headerName: `${getKoreanMonthLabel(month)} 출근현황`,
        width: 532,
        minWidth: 532,
        sortable: false,
        suppressSizeToFit: true,
        cellRenderer: (params: ICellRendererParams<AttendanceGridRow>) => (
          <CalendarCell
            {...params}
            daysInMonth={daysInMonth}
            inputMode={inputMode}
            savingCells={savingCells}
            onCommit={commitAttendanceValue}
          />
        ),
        cellClass: "attendance-cell attendance-cell-calendar",
      },
      {
        headerName: "총공수 / 총일수",
        width: 104,
        cellRenderer: ({ data }: ICellRendererParams<AttendanceGridRow>) => {
          if (!data) {
            return null;
          }

          const summary = summarizeAttendance(data);

          return <TwoLineCell top={summary.totalWorkUnits} bottom={summary.totalWorkedDays} />;
        },
        cellClass: "attendance-cell attendance-cell-numeric",
      },
    ],
    [commitAttendanceValue, daysInMonth, inputMode, month, savingCells]
  );

  const defaultColDef = useMemo<ColDef<AttendanceGridRow>>(
    () => ({
      sortable: false,
      filter: false,
      resizable: true,
      suppressMovable: true,
      headerClass: "attendance-header",
      cellClass: "attendance-cell",
    }),
    []
  );

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 bg-white/92 shadow-sm">
        <CardHeader className="gap-4 md:flex md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>직원 근태 관리</CardTitle>
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
                className="h-10 w-[180px] rounded-md border-border/80 bg-white shadow-sm"
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="attendance-mode-switch" aria-label="근태 입력 방식">
                <button
                  className={inputMode === "input" ? "active" : ""}
                  type="button"
                  onClick={() => setInputMode("input")}
                >
                  직접입력
                </button>
                <button
                  className={inputMode === "click" ? "active" : ""}
                  type="button"
                  onClick={() => setInputMode("click")}
                >
                  클릭
                </button>
              </div>
              <div className="attendance-legend">
                <span>
                  <i className="legend-full" />1일
                </span>
                <span>
                  <i className="legend-partial" />0.5일
                </span>
                <span>
                  <i className="legend-overtime" />1.5일
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="attendance-sheet-grid ag-theme-quartz h-[720px] w-full">
            <AgGridReact<AttendanceGridRow>
              modules={agGridModules}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              getRowId={({ data }) => data.employeeId}
              animateRows
              loading={loading}
              rowHeight={68}
              headerHeight={46}
              suppressRowTransform
              stopEditingWhenCellsLoseFocus
              excelStyles={excelStyles}
              onGridReady={({ api }) => setGridApi(api)}
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
