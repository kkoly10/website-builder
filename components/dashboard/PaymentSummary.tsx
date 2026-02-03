import { PaymentPlan } from "@/lib/projectTypes";

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function PaymentSummary({ payment }: { payment: PaymentPlan }) {
  const remaining = Math.max(0, payment.totalPrice - payment.amountPaid);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 16 }}>Payment Summary</h3>

      <div style={{ display: "grid", gap: 8 }}>
        <Row label="Total project price" value={money(payment.totalPrice)} />
        <Row label="Amount paid" value={money(payment.amountPaid)} />
        <Row label="Remaining" value={money(remaining)} />
        <Row label="Next payment due" value={payment.nextPaymentDueLabel} />
      </div>

      <p style={{ margin: 0, marginTop: 12, color: "#6B7280", fontSize: 13 }}>
        Payments are tied to milestones to keep the process clear and fair.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
      <div style={{ color: "#6B7280", fontSize: 13 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{value}</div>
    </div>
  );
}