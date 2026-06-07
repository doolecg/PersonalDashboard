import type { ReactNode } from "react";

export function Card({ className = "", children, pad = true }: { className?: string; children: ReactNode; pad?: boolean }) {
  return <div className={`glass ${pad ? "glass-pad " : ""}${className}`}>{children}</div>;
}

export function CardHead({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="card-head">
      <div className="card-head-l">
        <span className="card-icon">{icon}</span>
        <span className="card-title">{title}</span>
      </div>
      {action ?? null}
    </div>
  );
}
