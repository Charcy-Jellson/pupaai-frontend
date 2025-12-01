import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirect to image tools by default
  redirect("/dashboard/image-tools");
}



