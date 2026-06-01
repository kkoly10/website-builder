-- Google Meet join URLs for discovery calls.
--
-- When a discovery call is booked and successfully creates a Google
-- Calendar event with conferenceData.createRequest, the API returns a
-- generated Meet URL in the event's conferenceData.entryPoints array.
-- We persist that URL alongside the call row so:
--   - the studio's admin tooling can surface it without re-fetching
--     the event from Google Calendar on every render
--   - the reminder cron (if/when added) can re-send the join link
--     without another Calendar API round-trip
--   - bookings made before the Meet integration shipped stay null,
--     and we can identify them for backfill if needed
--
-- Nullable on purpose: the same code path serves pending bookings
-- (no slot selected → no Meet link) and the rare async case where
-- the createRequest returned status.statusCode = "pending" with no
-- entry points populated.

ALTER TABLE discovery_calls
  ADD COLUMN IF NOT EXISTS meet_join_url text;
