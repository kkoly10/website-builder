import DashboardShell from "@/components/dashboard/DashboardShell";
import { getMockProject } from "@/lib/mockProject";

export default function DashboardPage() {
  const project = getMockProject();
  return <DashboardShell project={project} />;
}
