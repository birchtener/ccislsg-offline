import { redirect } from "next/navigation";

export default function PaymentsPage() {
  return redirect("/dashboard/payments/items");
}
