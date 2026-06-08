import { useState } from "react";

// Tiny safe arithmetic evaluator (shunting-yard → RPN). No eval/Function.
function evaluate(expr: string): string {
  const tokens = expr.match(/(\d+\.?\d*|[+\-*/])/g);
  if (!tokens) return "0";
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const output: string[] = [];
  const ops: string[] = [];
  for (const token of tokens) {
    if (/\d/.test(token)) {
      output.push(token);
    } else {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[token]) output.push(ops.pop()!);
      ops.push(token);
    }
  }
  while (ops.length) output.push(ops.pop()!);

  const stack: number[] = [];
  for (const token of output) {
    if (/\d/.test(token)) {
      stack.push(parseFloat(token));
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return "Error";
      if (token === "+") stack.push(a + b);
      else if (token === "-") stack.push(a - b);
      else if (token === "*") stack.push(a * b);
      else if (token === "/") stack.push(b === 0 ? NaN : a / b);
    }
  }
  const result = stack.pop();
  if (result === undefined || Number.isNaN(result)) return "Error";
  return String(Math.round(result * 1e9) / 1e9);
}

const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];

export function CalculatorApp() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("0");

  function press(key: string) {
    if (key === "=") {
      setResult(evaluate(expr || "0"));
      return;
    }
    setExpr((prev) => prev + key);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <div
        style={{
          borderRadius: 12,
          background: "rgba(0,0,0,0.25)",
          padding: "12px 14px",
          textAlign: "right",
          flex: "none"
        }}
      >
        <div style={{ fontSize: 12, color: "var(--ink-faint)", minHeight: 16, wordBreak: "break-all" }}>
          {expr || " "}
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{result}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, flex: 1, minHeight: 0 }}>
        <button type="button" onClick={() => { setExpr(""); setResult("0"); }} className="calc-key calc-key-fn" style={{ gridColumn: "span 4" }}>
          Clear
        </button>
        {keys.map((key) => (
          <button
            type="button"
            key={key}
            onClick={() => press(key)}
            className={`calc-key${"+-*/=".includes(key) ? " calc-key-op" : ""}`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
