import { notFound, redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import { getAdminProjectDataByQuoteId } from "@/lib/adminProjectData";
import ProjectControlClient from "./ProjectControlClient";

export const dynamic = "force-dynamic";

type Params = {
  id: string;
};

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolved = await Promise.resolve(params);
  const quoteId = resolved.id;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/internal/admin/${quoteId}`)}`);
  }

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const initialData = await getAdminProjectDataByQuoteId(quoteId);
  if (!initialData) notFound();

  return <ProjectControlClient initialData={initialData} />;
}
