import type { ReactNode } from "react";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

// The outer wrapper every page uses (min-h-screen, page background, gap
// between top-level sections) — previously each page redeclared this
// shell by hand with slightly different gap/padding values.
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <main className={`min-h-screen bg-surface-page ${className}`}>
      <div className="mx-auto flex w-full flex-col gap-3">{children}</div>
    </main>
  );
}

export default PageContainer;
