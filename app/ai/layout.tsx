import type { ReactNode } from "react";

export default function AiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="authenticatedTheme productAppTheme">
      {children}
    </div>
  );
}
