import type { Module } from "ag-grid-community";
import { AllEnterpriseModule, LicenseManager } from "ag-grid-enterprise";

const licenseKey = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY;

if (licenseKey) {
  LicenseManager.setLicenseKey(licenseKey);
}

export const agGridModules: Module[] = [AllEnterpriseModule];
