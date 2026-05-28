// Public testimonials backing the AggregateRating + Review schema on
// LocalBusiness. When this array is non-empty, the structured data
// pipeline:
//   1. Emits each entry as a schema.org Review node
//   2. Computes an AggregateRating (ratingValue = mean, reviewCount
//      = entries.length) and attaches it to the LocalBusiness node
//   3. Makes the studio eligible for star-rating SERP rich results
//      — usually the single highest-CTR organic improvement
//      available without buying ads
//
// Rules for what belongs here:
//   - REAL client testimonials only. Google detects fake ratings via
//     pattern analysis and can manual-penalty the entire domain.
//   - With written permission. Schema.org publishes the author's
//     name in machine-readable form (and Google may surface it in
//     SERPs); make sure the client agreed to that.
//   - Tied to a real, completed engagement. Project that never
//     shipped isn't a real review.
//   - The text must be substantively the client's words. Light
//     editing for grammar is fine; ghost-writing a review is not.
//
// When empty (current state on launch), no AggregateRating or Review
// nodes are emitted. The LocalBusiness ranks on its other signals
// (address, geo, areaServed, sameAs, knowsAbout). Adding even 5
// real reviews is a meaningful unlock.

export type Testimonial = {
  // The person or company that wrote the review.
  authorName: string;
  // Optional org affiliation for the Person; renders in SERPs as
  // "John Smith, Acme Co" when set.
  authorOrg?: string;
  // 1-5 integer. Most testimonials are 5; rate honestly.
  rating: 1 | 2 | 3 | 4 | 5;
  // ISO date the review was given. Drives Review.datePublished. If
  // it was on a specific platform (Google Business, LinkedIn), use
  // the date it was posted there.
  datePublished: string;
  // The review body. Plain text; don't pre-format.
  text: string;
  // Optional source URL (LinkedIn post, GBP review, email screenshot
  // hosted publicly). Helps Google verify authenticity.
  sourceUrl?: string;
};

export const TESTIMONIALS: Testimonial[] = [
  // Add real testimonials here. Example shape (commented out):
  //
  // {
  //   authorName: "Jane Doe",
  //   authorOrg: "Acme Corp",
  //   rating: 5,
  //   datePublished: "2026-03-14",
  //   text: "Komlan scoped our AI integration honestly, shipped on time, and the result is in production six months later with zero incidents.",
  //   sourceUrl: "https://www.linkedin.com/posts/...",
  // },
];

// Computed at module load. Tied to TESTIMONIALS.length so reading
// this from the LocalBusiness builder doesn't cost anything on
// every request.
export function aggregateRating(): {
  ratingValue: number;
  reviewCount: number;
} | null {
  if (TESTIMONIALS.length === 0) return null;
  const sum = TESTIMONIALS.reduce((acc, t) => acc + t.rating, 0);
  const mean = sum / TESTIMONIALS.length;
  return {
    // Round to 1 decimal — Google displays "4.9" not "4.857..."
    ratingValue: Math.round(mean * 10) / 10,
    reviewCount: TESTIMONIALS.length,
  };
}
