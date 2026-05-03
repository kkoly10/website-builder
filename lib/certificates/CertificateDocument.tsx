import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Link } from "@react-pdf/renderer";
import "@/lib/certificates/fonts";

const BRAND = "#1a1a1a";
const MUTED = "#666666";
const RULE = "#e0e0e0";
const SUCCESS = "#1a7a4a";
const MONO = "Courier";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BRAND,
    paddingTop: 44,
    paddingBottom: 48,
    paddingHorizontal: 52,
    backgroundColor: "#ffffff",
  },
  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  studioName: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 20,
    color: BRAND,
    letterSpacing: 0.5,
  },
  studioTagline: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  certHeading: {
    fontFamily: "Playfair Display",
    fontWeight: 400,
    fontSize: 13,
    color: MUTED,
    textAlign: "right",
  },
  rule: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    marginBottom: 18,
  },
  // Certificate ID
  certIdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    padding: "8 12",
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: RULE,
  },
  certIdLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginRight: 8,
    width: 90,
  },
  certIdValue: {
    fontFamily: MONO,
    fontSize: 9,
    color: BRAND,
  },
  // Section label
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  // Parties
  partiesRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 18,
  },
  partyBox: {
    flex: 1,
    padding: "10 12",
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 4,
  },
  partyRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  partyName: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 12,
    color: BRAND,
    marginBottom: 2,
  },
  partyEmail: {
    fontFamily: MONO,
    fontSize: 9,
    color: MUTED,
  },
  // Hash
  hashBox: {
    marginBottom: 18,
    padding: "8 12",
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 4,
  },
  hashValue: {
    fontFamily: MONO,
    fontSize: 8,
    color: MUTED,
    wordBreak: "break-all",
  },
  // Audit table
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    padding: "6 10",
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 10",
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  tableRowLast: {
    flexDirection: "row",
    padding: "7 10",
  },
  colEvent: { width: "30%" },
  colDetail: { width: "40%" },
  colTime: { width: "30%" },
  thText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tdText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: BRAND,
  },
  tdMono: {
    fontFamily: MONO,
    fontSize: 8,
    color: MUTED,
  },
  // Acceptance badge
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    padding: "8 12",
    backgroundColor: "#f0faf4",
    borderWidth: 1,
    borderColor: "#b2dfcc",
    borderRadius: 4,
  },
  acceptedText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: SUCCESS,
  },
  // Bottom section
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
  verifyBox: {
    flex: 1,
    marginRight: 16,
  },
  verifyLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  verifyUrl: {
    fontFamily: MONO,
    fontSize: 8,
    color: BRAND,
  },
  qrImage: {
    width: 76,
    height: 76,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
  },
  footerRule: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginBottom: 6,
  },
  footerText: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 1.4,
  },
});

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export type CertificateDocumentProps = {
  certificateId: string;
  leadName: string;
  leadEmail: string;
  acceptedAt: string;
  acceptedByEmail: string | null;
  acceptedFromIp: string | null;
  agreementHash: string | null;
  publishedAt: string;
  verificationUrl: string;
  qrDataUrl: string;
};

export function CertificateDocument(props: CertificateDocumentProps) {
  const {
    certificateId,
    leadName,
    leadEmail,
    acceptedAt,
    acceptedByEmail,
    acceptedFromIp,
    agreementHash,
    publishedAt,
    verificationUrl,
    qrDataUrl,
  } = props;

  return (
    <Document title="Certificate of Completion">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.studioName}>CrecyStudio</Text>
            <Text style={styles.studioTagline}>Web Design & Development</Text>
          </View>
          <Text style={styles.certHeading}>Certificate of Completion</Text>
        </View>
        <View style={styles.rule} />

        {/* Certificate ID */}
        <View style={styles.certIdRow}>
          <Text style={styles.certIdLabel}>Certificate ID</Text>
          <Text style={styles.certIdValue}>{certificateId}</Text>
        </View>

        {/* Parties */}
        <Text style={styles.sectionLabel}>Parties</Text>
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyRole}>From (Studio)</Text>
            <Text style={styles.partyName}>CrecyStudio</Text>
            <Text style={styles.partyEmail}>hello@crecystudio.com</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyRole}>To (Client)</Text>
            <Text style={styles.partyName}>{leadName}</Text>
            <Text style={styles.partyEmail}>{leadEmail}</Text>
          </View>
        </View>

        {/* Acceptance badge */}
        <View style={styles.acceptedBadge}>
          <Text style={styles.acceptedText}>✓  Agreement electronically accepted</Text>
        </View>

        {/* Audit timeline */}
        <Text style={styles.sectionLabel}>Audit Trail</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colEvent}><Text style={styles.thText}>Event</Text></View>
            <View style={styles.colDetail}><Text style={styles.thText}>Detail</Text></View>
            <View style={styles.colTime}><Text style={styles.thText}>Timestamp (UTC)</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.colEvent}><Text style={styles.tdText}>Agreement published</Text></View>
            <View style={styles.colDetail}><Text style={styles.tdMono}>—</Text></View>
            <View style={styles.colTime}><Text style={styles.tdMono}>{fmt(publishedAt)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.colEvent}><Text style={styles.tdText}>Agreement accepted</Text></View>
            <View style={styles.colDetail}><Text style={styles.tdMono}>{acceptedByEmail ?? leadEmail}</Text></View>
            <View style={styles.colTime}><Text style={styles.tdMono}>{fmt(acceptedAt)}</Text></View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={styles.colEvent}><Text style={styles.tdText}>IP address</Text></View>
            <View style={styles.colDetail}><Text style={styles.tdMono}>{acceptedFromIp ?? "Not recorded"}</Text></View>
            <View style={styles.colTime}><Text style={styles.tdMono}>—</Text></View>
          </View>
        </View>

        {/* Document fingerprint */}
        <Text style={styles.sectionLabel}>Document Fingerprint (SHA-256)</Text>
        <View style={styles.hashBox}>
          <Text style={styles.hashValue}>{agreementHash ?? "Not available"}</Text>
        </View>

        {/* Verify + QR */}
        <View style={styles.bottomRow}>
          <View style={styles.verifyBox}>
            <Text style={styles.verifyLabel}>Verify this certificate</Text>
            <Text style={styles.verifyUrl}>{verificationUrl}</Text>
          </View>
          <Image src={qrDataUrl} style={styles.qrImage} />
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerRule} />
          <Text style={styles.footerText}>
            This document constitutes a valid electronic record under the US ESIGN Act (15 U.S.C. § 7001 et seq.) and the EU eIDAS Regulation (No 910/2014) as a Simple Electronic Signature.{"\n"}
            Certificate ID: {certificateId}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
