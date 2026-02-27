"use client";

import AdminPipelineClient, { PipelineRow } from "./AdminPipelineClient";

export default function AdminClient({ initialRows }: { initialRows: PipelineRow[] }) {
  return <AdminPipelineClient initialRows={initialRows} />;
}