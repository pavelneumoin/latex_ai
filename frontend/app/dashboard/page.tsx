import { redirect } from "next/navigation";

// Legacy route: the teacher now has one personal home instead of two competing dashboards.
export default function DashboardRedirect() {
  redirect("/cabinet");
}
