import { redirect } from "next/navigation";

export default function PaymentsAuditLogsRedirect() {
  return redirect("/dashboard/payments/logs");
}
