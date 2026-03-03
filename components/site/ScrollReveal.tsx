// components/site/ScrollReveal.tsx
"use client";

import { useEffect } from "react";

/**
 * Attaches an IntersectionObserver that adds .inView
 * to any element with .fadeUp, .heroFadeUp, or .scaleIn
 * when it enters the viewport.
 *
 * Mount this once in your layout or homepage.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll(".fadeUp, .heroFadeUp, .scaleIn");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("inView");
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
