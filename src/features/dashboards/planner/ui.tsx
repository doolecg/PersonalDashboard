import type { CSSProperties, ReactNode } from "react";

export function Card({ className = "", children, pad = true, style }: { className?: string; children: ReactNode; pad?: boolean; style?: CSSProperties }) {
  return <div className={`glass ${pad ? "glass-pad " : ""}${className}`} style={style}>{children}</div>;
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
