"use client";

import { useTranslations } from "next-intl";

export default function BuildLoading() {
  const t = useTranslations("build");
  return (
    <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
      {t("heroLoading")}
    </div>
  );
}
