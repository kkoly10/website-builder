import { test } from "node:test";
import assert from "node:assert/strict";
import { isEnglishOnlyPath } from "../seo/englishOnlyPaths";

// Why this is tested: the sitemap and the locale layout's page-level
// hreflang BOTH key off isEnglishOnlyPath. If the matcher silently
// regresses (e.g. someone tightens the comparison to an exact match
// only), one of the two surfaces could disagree with the other —
// reintroducing the Google Search Console "Not found (404)" reports
// for /fr/locations, /fr/blog, etc. that this PR is fixing.

test("English-only: exact-match prefixes", () => {
  assert.equal(isEnglishOnlyPath("/locations"), true);
  assert.equal(isEnglishOnlyPath("/blog"), true);
});

test("English-only: nested children under a prefix", () => {
  assert.equal(isEnglishOnlyPath("/locations/stafford-va"), true);
  assert.equal(isEnglishOnlyPath("/locations/richmond-va"), true);
  assert.equal(isEnglishOnlyPath("/blog/some-post-slug"), true);
});

test("NOT English-only: multi-locale pages", () => {
  assert.equal(isEnglishOnlyPath("/"), false);
  assert.equal(isEnglishOnlyPath("/saas"), false);
  assert.equal(isEnglishOnlyPath("/ai-integration"), false);
  assert.equal(isEnglishOnlyPath("/work"), false);
  assert.equal(isEnglishOnlyPath("/work/proveo"), false);
  assert.equal(isEnglishOnlyPath("/pricing"), false);
  assert.equal(isEnglishOnlyPath("/privacy"), false);
});

test("NOT English-only: false-positive guard (prefix substring without separator)", () => {
  // "/locationsx" must NOT match "/locations" — a naive startsWith
  // without the trailing slash would over-match and accidentally
  // strip alternates from unrelated future routes.
  assert.equal(isEnglishOnlyPath("/locationsx"), false);
  assert.equal(isEnglishOnlyPath("/blogsomething"), false);
});

test("NOT English-only: deeply nested unrelated paths", () => {
  assert.equal(isEnglishOnlyPath("/work/fleiko/case-study"), false);
  assert.equal(isEnglishOnlyPath("/ai-integration/details"), false);
});
