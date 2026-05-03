import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import "@/lib/certificates/fonts";
import { parseAgreementText } from "@/lib/certificates/markdownParser";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1a1a1a",
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 52,
  },
  h1: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 18,
    marginTop: 14,
    marginBottom: 6,
    color: "#1a1a1a",
  },
  h2: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
    color: "#1a1a1a",
  },
  h3: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginTop: 10,
    marginBottom: 3,
    color: "#1a1a1a",
  },
  paragraph: {
    marginBottom: 4,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 12,
  },
  bulletDot: {
    width: 12,
    color: "#555",
  },
  bulletText: {
    flex: 1,
  },
  blank: {
    height: 6,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  normal: {
    fontFamily: "Helvetica",
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    color: "#aaa",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 11,
    color: "#555",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerName: {
    fontFamily: "Playfair Display",
    fontWeight: 400,
    fontSize: 9,
    color: "#888",
    marginTop: 2,
  },
});

type Props = { text: string; leadName: string };

export function AgreementDocument({ text, leadName }: Props) {
  const blocks = parseAgreementText(text);
  return (
    <Document title="Project Agreement">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>Project Agreement</Text>
          <Text style={styles.headerName}>{leadName}</Text>
        </View>

        {blocks.map((block, i) => {
          if (block.type === "h1") {
            return <Text key={i} style={styles.h1}>{block.text}</Text>;
          }
          if (block.type === "h2") {
            return <Text key={i} style={styles.h2}>{block.text}</Text>;
          }
          if (block.type === "h3") {
            return <Text key={i} style={styles.h3}>{block.text}</Text>;
          }
          if (block.type === "bullet") {
            return (
              <View key={i} style={styles.bullet} wrap={false}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{block.text}</Text>
              </View>
            );
          }
          if (block.type === "blank") {
            return <View key={i} style={styles.blank} />;
          }
          // paragraph with inline bold
          return (
            <Text key={i} style={styles.paragraph}>
              {block.segments.map((seg, j) => (
                <Text key={j} style={seg.bold ? styles.bold : styles.normal}>
                  {seg.text}
                </Text>
              ))}
            </Text>
          );
        })}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
