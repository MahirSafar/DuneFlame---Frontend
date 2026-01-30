import { redirect } from "next/navigation";

export default function Page() {
  // Consolidate to the single canonical login page
  redirect("/auth/login");
}
