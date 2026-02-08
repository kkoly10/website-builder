import DashboardShell from "@/components/dashbord/DashboardShell";
import { getMockProject } from "@/lib/mockProject";

export default function DashboardPage() {
  const project = getMockProject();
  return <DashboardShell project={project} />;
}