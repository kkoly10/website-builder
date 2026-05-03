export type Segment = { text: string; bold: boolean };

export type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullet"; text: string }
  | { type: "paragraph"; segments: Segment[] }
  | { type: "blank" };

function parseInline(line: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > last) {
      segments.push({ text: line.slice(last, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < line.length) {
    segments.push({ text: line.slice(last), bold: false });
  }
  return segments.length ? segments : [{ text: line, bold: false }];
}

export function parseAgreementText(raw: string): Block[] {
  return raw.split("\n").map((line): Block => {
    if (line.startsWith("### ")) return { type: "h3", text: line.slice(4) };
    if (line.startsWith("## ")) return { type: "h2", text: line.slice(3) };
    if (line.startsWith("# ")) return { type: "h1", text: line.slice(2) };
    if (line.startsWith("- ")) return { type: "bullet", text: line.slice(2) };
    if (line.trim() === "") return { type: "blank" };
    return { type: "paragraph", segments: parseInline(line) };
  });
}
