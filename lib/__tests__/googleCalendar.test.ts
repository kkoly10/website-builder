import { test } from "node:test";
import assert from "node:assert/strict";
import { parseServiceAccountCreds, describeServiceAccountKey } from "../googleCalendar";

// Helper: a synthetic PEM key shaped like what Google's service-account
// JSON files contain (BEGIN/END markers + base64 body with literal \n
// separators every 64 chars in the JSON-string form). Not a real key —
// just enough structure for the normalizer to chew on.
const FAKE_PEM_BODY = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcw";
const PEM_LITERAL_NL = `-----BEGIN PRIVATE KEY-----\\n${FAKE_PEM_BODY}\\n-----END PRIVATE KEY-----\\n`;
const PEM_REAL_NL = `-----BEGIN PRIVATE KEY-----\n${FAKE_PEM_BODY}\n-----END PRIVATE KEY-----\n`;

function envOnly(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

test("returns null when no credentials are configured", () => {
  assert.equal(parseServiceAccountCreds(envOnly({})), null);
});

test("returns null when only one of EMAIL+KEY is set", () => {
  assert.equal(
    parseServiceAccountCreds(envOnly({ GOOGLE_SERVICE_ACCOUNT_EMAIL: "a@b.c" })),
    null,
  );
  assert.equal(
    parseServiceAccountCreds(envOnly({ GOOGLE_SERVICE_ACCOUNT_KEY: PEM_LITERAL_NL })),
    null,
  );
});

test("EMAIL+KEY path: converts literal \\n escapes to real newlines", () => {
  const creds = parseServiceAccountCreds(envOnly({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "sa@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: PEM_LITERAL_NL,
  }));
  assert.ok(creds);
  assert.equal(creds!.email, "sa@project.iam.gserviceaccount.com");
  assert.ok(creds!.key.includes("\n"));
  assert.ok(!creds!.key.includes("\\n"));
  assert.ok(creds!.key.startsWith("-----BEGIN PRIVATE KEY-----"));
  assert.ok(creds!.key.endsWith("-----END PRIVATE KEY-----"));
});

test("EMAIL+KEY path: passes through real newlines unchanged", () => {
  const creds = parseServiceAccountCreds(envOnly({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "sa@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: PEM_REAL_NL,
  }));
  assert.ok(creds);
  // 3 lines after .trim() strips the trailing newline:
  // header / body / footer
  assert.equal(creds!.key.split("\n").length, 3);
});

test("EMAIL+KEY path: strips wrapping double quotes (paste-with-JSON-quotes mistake)", () => {
  const creds = parseServiceAccountCreds(envOnly({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "sa@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: `"${PEM_LITERAL_NL}"`,
  }));
  assert.ok(creds);
  assert.ok(creds!.key.startsWith("-----BEGIN PRIVATE KEY-----"));
});

test("JSON path: pulls client_email + private_key from full service-account JSON", () => {
  const json = JSON.stringify({
    type: "service_account",
    project_id: "proj",
    private_key: PEM_LITERAL_NL.replace(/\\n/g, "\n"),
    client_email: "sa-json@project.iam.gserviceaccount.com",
    client_id: "123",
  });
  const creds = parseServiceAccountCreds(envOnly({ GOOGLE_SERVICE_ACCOUNT_JSON: json }));
  assert.ok(creds);
  assert.equal(creds!.email, "sa-json@project.iam.gserviceaccount.com");
  assert.ok(creds!.key.includes("\n"));
});

test("JSON path wins when both JSON and EMAIL+KEY are set", () => {
  const json = JSON.stringify({
    client_email: "json-wins@project.iam.gserviceaccount.com",
    private_key: PEM_REAL_NL,
  });
  const creds = parseServiceAccountCreds(envOnly({
    GOOGLE_SERVICE_ACCOUNT_JSON: json,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "loser@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: PEM_LITERAL_NL,
  }));
  assert.ok(creds);
  assert.equal(creds!.email, "json-wins@project.iam.gserviceaccount.com");
});

test("JSON path falls through to EMAIL+KEY when JSON is malformed", () => {
  const creds = parseServiceAccountCreds(envOnly({
    GOOGLE_SERVICE_ACCOUNT_JSON: "{not json",
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "fallback@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: PEM_LITERAL_NL,
  }));
  assert.ok(creds);
  assert.equal(creds!.email, "fallback@project.iam.gserviceaccount.com");
});

test("JSON path falls through when JSON parses but lacks required fields", () => {
  const json = JSON.stringify({ project_id: "proj", type: "service_account" });
  const creds = parseServiceAccountCreds(envOnly({
    GOOGLE_SERVICE_ACCOUNT_JSON: json,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "fallback@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: PEM_LITERAL_NL,
  }));
  assert.ok(creds);
  assert.equal(creds!.email, "fallback@project.iam.gserviceaccount.com");
});

test("describeServiceAccountKey returns null when no creds configured", () => {
  assert.equal(describeServiceAccountKey(envOnly({})), null);
});

test("describeServiceAccountKey reports the markers + newline counts for a well-formed key", () => {
  const diag = describeServiceAccountKey(envOnly({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "sa@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: PEM_LITERAL_NL,
  }));
  assert.ok(diag);
  assert.equal(diag!.hasBeginMarker, true);
  assert.equal(diag!.hasEndMarker, true);
  assert.equal(diag!.literalEscapeCount, 0); // normalized away
  // 2 internal newlines after .trim(): one after the BEGIN line and
  // one after the body. The fixture's trailing \n is trimmed.
  assert.equal(diag!.realNewlineCount, 2);
  assert.equal(diag!.source, "email+key");
});

test("describeServiceAccountKey reports missing markers when the key body was pasted alone", () => {
  const diag = describeServiceAccountKey(envOnly({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "sa@project.iam.gserviceaccount.com",
    GOOGLE_SERVICE_ACCOUNT_KEY: FAKE_PEM_BODY, // headers stripped
  }));
  assert.ok(diag);
  assert.equal(diag!.hasBeginMarker, false);
  assert.equal(diag!.hasEndMarker, false);
});

test("describeServiceAccountKey reports source=json when JSON env var is in use", () => {
  const json = JSON.stringify({
    client_email: "sa@project.iam.gserviceaccount.com",
    private_key: PEM_REAL_NL,
  });
  const diag = describeServiceAccountKey(envOnly({ GOOGLE_SERVICE_ACCOUNT_JSON: json }));
  assert.ok(diag);
  assert.equal(diag!.source, "json");
});
