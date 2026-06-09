"use client";

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

import { agGridModules } from "@/lib/ag-grid";
import { formatAttendanceWorkUnits } from "@/lib/attendance";

export type DashboardEmployeeRow = {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  position: string;
  phone: string;
  todayWorkUnits: string;
  monthlyWorkUnits: number;
};

type AttendanceGridProps = {
  rows: DashboardEmployeeRow[];
};

export function AttendanceGrid({ rows }: AttendanceGridProps) {
  const columnDefs = useMemo<ColDef<DashboardEmployeeRow>[]>(
    () => [
      { field: "name", headerName: "직원명", minWidth: 150, pinned: "left" },
      { field: "department", headerName: "부서", minWidth: 120 },
      { field: "position", headerName: "직책", minWidth: 110 },
      { field: "phone", headerName: "전화번호", minWidth: 150 },
      { field: "employeeCode", headerName: "직원 코드", minWidth: 120 },
      { field: "todayWorkUnits", headerName: "오늘 공수", minWidth: 110 },
      {
        field: "monthlyWorkUnits",
        headerName: "이번 달 누적 공수",
        minWidth: 130,
        valueFormatter: ({ value }) => {
          const formatted = formatAttendanceWorkUnits(typeof value === "number" ? value : 0);

          return formatted ? `${formatted}일` : "0일";
        },
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<DashboardEmployeeRow>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 110,
      flex: 1,
    }),
    []
  );

  return (
    <div className="erp-grid ag-theme-quartz h-[460px] w-full">
      <AgGridReact<DashboardEmployeeRow>
        modules={agGridModules}
        animateRows
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination
        paginationPageSize={10}
        rowHeight={48}
        headerHeight={44}
        overlayNoRowsTemplate={
          '<div style="padding:24px;text-align:center;color:#64748b;">등록된 직원이 없습니다.</div>'
        }
      />
    </div>
  );
}
