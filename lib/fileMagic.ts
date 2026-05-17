// Minimal file-type detection by magic bytes. Used by upload routes to
// reject files whose content doesn't match the client-declared MIME type
// (the classic "rename .exe to .png" bypass). Intentionally inline — no
// `file-type` npm dependency — because we only need to cover the small
// allowlist that the asset / message upload routes actually accept.
//
// Returns true if the buffer's first few bytes are consistent with the
// declared MIME type. For declared types not in this table (e.g. text/
// plain, text/csv, application/zip) we return true — those declared
// types either have no reliable single magic signature or can legitimately
// contain arbitrary bytes. The MIME allowlist in each route is the
// primary gate; this helper is a defense-in-depth layer against the
// "lie about content-type" attack class.
//
// Coverage:
//   image/jpeg       — FFD8FFE0..FFD8FFE3 / FFD8FFDB / FFD8FFEE
//   image/png        — 89 50 4E 47 0D 0A 1A 0A
//   image/gif        — "GIF87a" or "GIF89a"
//   image/webp       — RIFF....WEBP
//   application/pdf  — %PDF-
//   video/mp4        — ftyp{isom,mp42,iso2,mp41,avc1,M4V } at offset 4
//   video/quicktime  — ftyp{qt  } at offset 4
//
// SVG is intentionally not handled here — it's been removed from the
// allowlists entirely because of the inline-script XSS risk.

export type MagicCheckResult = {
  ok: boolean;
  /** When ok=false, the type we actually detected (or "unknown"). */
  detected?: string;
};

function startsWith(buf: Buffer, sig: number[]): boolean {
  if (buf.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (buf[i] !== sig[i]) return false;
  return true;
}

function bytesAt(buf: Buffer, offset: number, ascii: string): boolean {
  if (buf.length < offset + ascii.length) return false;
  for (let i = 0; i < ascii.length; i++) {
    if (buf[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Verify that the buffer's magic bytes are consistent with the
 * client-declared MIME type. Returns ok=true when consistent OR when
 * we have no signature for the declared type (in which case the MIME
 * allowlist is the only gate).
 */
export function verifyFileMagic(
  buffer: Buffer,
  declaredType: string,
): MagicCheckResult {
  const mime = declaredType.toLowerCase().trim();

  switch (mime) {
    case "image/jpeg":
    case "image/jpg": {
      // JPEG: FFD8 FF then a marker byte (E0-EF for JFIF/Exif, DB for
      // older / minimal, EE for Adobe). The first two bytes are the
      // canonical SOI marker.
      const ok = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      return ok ? { ok } : { ok: false, detected: sniff(buffer) };
    }
    case "image/png": {
      const ok = startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      return ok ? { ok } : { ok: false, detected: sniff(buffer) };
    }
    case "image/gif": {
      const ok = bytesAt(buffer, 0, "GIF87a") || bytesAt(buffer, 0, "GIF89a");
      return ok ? { ok } : { ok: false, detected: sniff(buffer) };
    }
    case "image/webp": {
      // RIFF....WEBP
      const ok = bytesAt(buffer, 0, "RIFF") && bytesAt(buffer, 8, "WEBP");
      return ok ? { ok } : { ok: false, detected: sniff(buffer) };
    }
    case "application/pdf": {
      const ok = bytesAt(buffer, 0, "%PDF-");
      return ok ? { ok } : { ok: false, detected: sniff(buffer) };
    }
    case "video/mp4": {
      const ok =
        bytesAt(buffer, 4, "ftyp") &&
        (bytesAt(buffer, 8, "isom") ||
          bytesAt(buffer, 8, "mp42") ||
          bytesAt(buffer, 8, "iso2") ||
          bytesAt(buffer, 8, "mp41") ||
          bytesAt(buffer, 8, "avc1") ||
          bytesAt(buffer, 8, "M4V "));
      return ok ? { ok } : { ok: false, detected: sniff(buffer) };
    }
    case "video/quicktime": {
      const ok = bytesAt(buffer, 4, "ftyp") && bytesAt(buffer, 8, "qt  ");
      return ok ? { ok } : { ok: false, detected: sniff(buffer) };
    }
    // Types without a reliable single-signature check fall through to ok.
    // The route-level MIME allowlist is the primary gate; this helper
    // only blocks the magic-byte mismatch attacks for types we can verify.
    default:
      return { ok: true };
  }
}

// Best-effort sniff for the error message — helps the route return
// "you uploaded an exe declared as png" instead of just "rejected".
function sniff(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (bytesAt(buffer, 0, "GIF87a") || bytesAt(buffer, 0, "GIF89a")) return "image/gif";
  if (bytesAt(buffer, 0, "RIFF") && bytesAt(buffer, 8, "WEBP")) return "image/webp";
  if (bytesAt(buffer, 0, "%PDF-")) return "application/pdf";
  if (bytesAt(buffer, 0, "PK\x03\x04") || bytesAt(buffer, 0, "PK\x05\x06")) return "application/zip";
  // Windows executables — the most important "you've been tricked" case.
  if (startsWith(buffer, [0x4d, 0x5a])) return "application/x-msdownload";
  // ELF executables (Linux)
  if (startsWith(buffer, [0x7f, 0x45, 0x4c, 0x46])) return "application/x-elf";
  // Mach-O (macOS)
  if (
    startsWith(buffer, [0xca, 0xfe, 0xba, 0xbe]) ||
    startsWith(buffer, [0xfe, 0xed, 0xfa, 0xce]) ||
    startsWith(buffer, [0xfe, 0xed, 0xfa, 0xcf])
  ) return "application/x-mach-binary";
  // Shell script
  if (bytesAt(buffer, 0, "#!")) return "text/x-script";
  // SVG (text-based — checking for "<svg" or "<?xml" near the start)
  const head = buffer.slice(0, Math.min(buffer.length, 200)).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<?xml") && head.includes("<svg")) return "image/svg+xml";
  if (head.startsWith("<svg")) return "image/svg+xml";
  // HTML
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return "text/html";
  return "unknown";
}
