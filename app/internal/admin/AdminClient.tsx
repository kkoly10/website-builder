"use client";

import type { AdminProjectData } from "@/lib/adminProjectData";
import AdminPipelineClient from "./AdminPipelineClient";

export default function AdminClient({
  initialProjects,
}: {
  initialProjects: AdminProjectData[];
}) {
  return <AdminPipelineClient initialProjects={initialProjects} />;
}
