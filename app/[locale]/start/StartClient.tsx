"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const PROJECT_TYPE_KEYS = [
  "website",
  "ecommerce",
  "custom_app",
  "portal",
  "automation",
  "rescue",
  "not_sure",
] as const;
type ProjectType = (typeof PROJECT_TYPE_KEYS)[number];

type SlotDay = { date: string; label: string; times: string[] };

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

const PILL_STYLE_BASE: React.CSSProperties = {
  padding: "0.4rem 0.9rem",
  border: "1px solid",
  font: "500 12px/1 var(--font-mono)",
  letterSpacing: "0.05em",
  cursor: "pointer",
  borderRadius: 2,
  transition: "border-color 0.12s, background 0.12s, color 0.12s",
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    ...PILL_STYLE_BASE,
    borderColor: active ? "var(--ink)" : "var(--rule)",
    background: active ? "var(--ink)" : "transparent",
    color: active ? "var(--paper)" : "var(--ink)",
  };
}

export default function StartClient() {
  const t = useTranslations("start");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [projectType, setProjectType] = useState<ProjectType | "">("");
  const [availability, setAvailability] = useState(""); // fallback textarea

  // Slot picker state
  const [slots, setSlots] = useState<SlotDay[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [noCalendar, setNoCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slotLabel, setSlotLabel] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/book-discovery-call/slots")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok || json.noCalendar) {
          setNoCalendar(true);
        } else {
          setSlots(json.slots ?? []);
          if (json.slots?.length > 0) setSelectedDate(json.slots[0].date);
        }
      })
      .catch(() => setNoCalendar(true))
      .finally(() => setSlotsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError(t("errorNameRequired")); return; }
    if (!email.trim() || !email.includes("@")) { setError(t("errorInvalidEmail")); return; }
    if (!noCalendar && (!selectedDate || !selectedTime)) {
      setError(t("slotRequired"));
      return;
    }

    const humanLabel = !noCalendar && selectedDate && selectedTime
      ? `${slots?.find((d) => d.date === selectedDate)?.label ?? selectedDate} at ${formatTimeLabel(selectedTime)} ET`
      : "";

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim() || undefined,
        projectType: projectType || undefined,
        locale,
      };

      if (!noCalendar && selectedDate && selectedTime) {
        body.selectedSlot = `${selectedDate}T${selectedTime}:00`;
        body.slotTimezone = "America/New_York";
        body.slotLabel = humanLabel;
      } else {
        body.availabilityNote = availability.trim() || undefined;
      }

      const res = await fetch("/api/book-discovery-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t("errorGeneric"));
      setSlotLabel(humanLabel);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 560, paddingTop: "1rem" }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--ink)", color: "var(--paper)", fontSize: "1.2rem", marginBottom: "1.25rem",
          }}
          aria-hidden
        >
          ✓
        </div>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", letterSpacing: "-0.03em" }}>
          {t("successTitle")}
        </h2>
        <p style={{ margin: "0 0 0.6rem", color: "var(--muted)", lineHeight: 1.65 }}>
          {slotLabel ? t("successBodyScheduled") : t("successBody")}
        </p>
        <p style={{ margin: "0 0 1.5rem", color: "var(--muted)", lineHeight: 1.65 }}>
          {t("successDetail")}
        </p>
        <Link href="/process" className="btn btnPrimary">
          {t("successCta")} <span className="btnArrow">→</span>
        </Link>
      </div>
    );
  }

  const selectedDaySlots = slots?.find((d) => d.date === selectedDate)?.times ?? [];

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 560 }} noValidate>
      {/* Name */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="dc-name" className="fieldLabel">{t("nameLabel")} *</label>
        <input id="dc-name" className="input" value={name}
          onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} autoComplete="name" />
      </div>

      {/* Email */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="dc-email" className="fieldLabel">{t("emailLabel")} *</label>
        <input id="dc-email" type="email" className="input" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} autoComplete="email" />
      </div>

      {/* Company */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="dc-company" className="fieldLabel">{t("companyLabel")}</label>
        <input id="dc-company" className="input" value={company}
          onChange={(e) => setCompany(e.target.value)} placeholder={t("companyPlaceholder")} autoComplete="organization" />
      </div>

      {/* Project type */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fieldLabel" style={{ margin: "0 0 0.5rem" }}>{t("projectTypeLabel")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {PROJECT_TYPE_KEYS.map((key) => (
            <button key={key} type="button"
              onClick={() => setProjectType(projectType === key ? "" : key)}
              style={pillStyle(projectType === key)}>
              {t(`projectTypes.${key}` as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Slot picker or availability textarea */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className="fieldLabel" style={{ margin: "0 0 0.6rem" }}>{t("slotPickerLabel")}</p>

        {noCalendar ? (
          <textarea id="dc-avail" className="textarea" rows={3}
            value={availability} onChange={(e) => setAvailability(e.target.value)}
            placeholder={t("availabilityPlaceholder")} />
        ) : slotsLoading ? (
          <p style={{ margin: 0, fontSize: ".875rem", color: "var(--muted)" }}>{t("slotPickerLoading")}</p>
        ) : !slots || slots.length === 0 ? (
          <p style={{ margin: 0, fontSize: ".875rem", color: "var(--muted)" }}>{t("slotPickerNoSlots")}</p>
        ) : (
          <>
            {/* Day pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: ".85rem" }}>
              {slots.map((day) => (
                <button key={day.date} type="button"
                  onClick={() => { setSelectedDate(day.date); setSelectedTime(""); }}
                  style={pillStyle(selectedDate === day.date)}>
                  {day.label}
                </button>
              ))}
            </div>

            {/* Time grid */}
            {selectedDate && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: ".4rem" }}>
                {selectedDaySlots.map((time) => (
                  <button key={time} type="button"
                    onClick={() => setSelectedTime(time)}
                    style={pillStyle(selectedTime === time)}>
                    {formatTimeLabel(time)}
                  </button>
                ))}
              </div>
            )}

            <p style={{ margin: ".6rem 0 0", fontSize: ".78rem", color: "var(--muted)" }}>
              {t("slotPickerTimezone")}
            </p>
          </>
        )}
      </div>

      {error && (
        <div role="alert" style={{
          marginBottom: "1rem", padding: "0.75rem 1rem", border: "1px solid currentColor",
          color: "var(--accent-2, #c0392b)", fontSize: "0.875rem", lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn btnPrimary" disabled={loading}>
        {loading ? t("submitting") : t("submit")}{" "}
        {!loading && <span className="btnArrow">→</span>}
      </button>
    </form>
  );
}
