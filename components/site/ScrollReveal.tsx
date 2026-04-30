"use client";

import { useEffect, ReactNode } from "react";

const SELECTOR = ".fadeUp, .heroFadeUp, .scaleIn";

export default function ScrollReveal({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("inView");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    function observe(root: Document | Element = document) {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains("inView")) io.observe(el);
      });
    }

    observe();

    // Watch for elements added after the initial render (e.g. multi-step forms
    // where each step conditionally renders new .fadeUp nodes).
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.matches(SELECTOR)) {
            if (!el.classList.contains("inView")) io.observe(el);
          }
          observe(el);
        });
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return children ? <>{children}</> : null;
}
