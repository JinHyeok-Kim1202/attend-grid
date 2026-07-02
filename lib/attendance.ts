export const ATTENDANCE_STATUS_OPTIONS = [
  "PRESENT",
  "PAID_LEAVE",
  "HALF_DAY",
  "SICK_LEAVE",
  "ABSENT",
  "OFFICIAL_LEAVE",
] as const;

export type AttendanceStatusValue = (typeof ATTENDANCE_STATUS_OPTIONS)[number];

export const ATTENDANCE_FULL_DAY_UNITS = 1;
export const ATTENDANCE_HALF_DAY_UNITS = 0.5;
export const ATTENDANCE_MAX_WORK_UNITS = 1.5;

export function isAttendanceStatusValue(value: string): value is AttendanceStatusValue {
  return ATTENDANCE_STATUS_OPTIONS.includes(value as AttendanceStatusValue);
}

export function deriveAttendanceWorkUnits(status?: string | null) {
  switch (status) {
    case "PRESENT":
      return ATTENDANCE_FULL_DAY_UNITS;
    case "HALF_DAY":
      return ATTENDANCE_HALF_DAY_UNITS;
    default:
      return null;
  }
}

export function getAttendanceStatusFromWorkUnits(workUnits: number): AttendanceStatusValue {
  return workUnits < ATTENDANCE_FULL_DAY_UNITS ? "HALF_DAY" : "PRESENT";
}

export function formatAttendanceWorkUnits(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return "";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

export function parseAttendanceWorkUnitsInput(value: unknown) {
  const rawValue = typeof value === "string" ? value.trim() : String(value ?? "").trim();

  if (!rawValue) {
    return {
      isValid: true,
      workUnits: null,
      normalizedValue: "",
    };
  }

  if (!/^\d+(\.\d+)?$/.test(rawValue)) {
    return {
      isValid: false,
      workUnits: null,
      normalizedValue: "",
      error: "근무량은 비우거나 0.5, 1처럼 숫자로 입력해 주세요.",
    };
  }

  const workUnits = Number(rawValue);

  if (!Number.isFinite(workUnits)) {
    return {
      isValid: false,
      workUnits: null,
      normalizedValue: "",
      error: "근무량은 숫자로만 입력할 수 있습니다.",
    };
  }

  if (workUnits === 0) {
    return {
      isValid: true,
      workUnits: null,
      normalizedValue: "",
    };
  }

  if (workUnits < 0 || workUnits > ATTENDANCE_MAX_WORK_UNITS) {
    return {
      isValid: false,
      workUnits: null,
      normalizedValue: "",
      error: `근무량은 0보다 크고 ${ATTENDANCE_MAX_WORK_UNITS} 이하여야 합니다.`,
    };
  }

  return {
    isValid: true,
    workUnits,
    normalizedValue: formatAttendanceWorkUnits(workUnits),
  };
}

export function parseMonthValue(month: string | null) {
  const normalized = month && /^\d{4}-\d{2}$/.test(month) ? month : getCurrentMonthValue();
  const [year, monthPart] = normalized.split("-").map(Number);
  const monthIndex = monthPart - 1;

  return {
    value: normalized,
    year,
    monthIndex,
    daysInMonth: new Date(year, monthPart, 0).getDate(),
  };
}

export function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function getMonthDate(month: string, day: number) {
  const { year, monthIndex } = parseMonthValue(month);

  return new Date(Date.UTC(year, monthIndex, day));
}

export function getDayField(day: number) {
  return `day${day}`;
}

export function getKoreanMonthLabel(month: string) {
  const { year, monthIndex } = parseMonthValue(month);

  return `${year}년 ${monthIndex + 1}월`;
}
