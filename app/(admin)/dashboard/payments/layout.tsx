import { ReactNode } from "react";
import { PaymentsGeofenceGuard } from "@/features/payments/components/payments-geofence-guard";

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return <PaymentsGeofenceGuard>{children}</PaymentsGeofenceGuard>;
}
