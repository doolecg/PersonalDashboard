import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useAuth } from "@/app/auth/useAuth";
import { runCommand, type TermLine } from "./commands";
import "./terminal.css";

type Block = { id: number; lines: TermLine[]; command?: string };

const PROMPT = "AURA>";
const MAX_BLOCKS = 80;

const banner: TermLine[] = [
  { text: "AURA TERMINAL — type 'help' for commands", tone: "dim" }
];

let blockId = 0;

// Command history is intentionally local-only (sessionStorage would also be
// fine): syncing keystroke history across devices adds noise without value.
export function TerminalPanel() {
  const auth = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([{ id: blockId++, lines: banner }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyPosRef = useRef(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [blocks]);

  const submit = useCallback(async () => {
    const command = input.trim();
    if (!command || busy) return;
    setInput("");
    historyRef.current = [command, ...historyRef.current.filter((item) => item !== command)].slice(0, 50);
    historyPosRef.current = -1;

    if (command.toLowerCase() === "clear") {
      setBlocks([{ id: blockId++, lines: banner }]);
      return;
    }

    setBusy(true);
    let lines: TermLine[];
    try {
      lines = await runCommand(command);
    } catch (error) {
      lines = [{ text: error instanceof Error ? error.message : "Command failed.", tone: "err" }];
    }
    setBusy(false);
    setBlocks((prev) => [...prev, { id: blockId++, command, lines }].slice(-MAX_BLOCKS));
  }, [input, busy]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const history = historyRef.current;
      if (!history.length) return;
      const next =
        event.key === "ArrowUp"
          ? Math.min(historyPosRef.current + 1, history.length - 1)
          : Math.max(historyPosRef.current - 1, -1);
      historyPosRef.current = next;
      setInput(next === -1 ? "" : history[next]);
    }
  };

  return (
    <div className="aterm" onClick={() => inputRef.current?.focus()}>
      <div className="aterm-scroll" ref={scrollRef} role="log" aria-label="Terminal output" aria-live="polite">
        {blocks.map((block) => (
          <div className="aterm-block" key={block.id}>
            {block.command ? (
              <div className="aterm-cmd">
                <span className="aterm-prompt">{PROMPT}</span> {block.command}
              </div>
            ) : null}
            {block.lines.map((entry, index) => (
              <div key={index} className={`aterm-line${entry.tone ? ` aterm-${entry.tone}` : ""}`}>
                {entry.text}
              </div>
            ))}
          </div>
        ))}
        {busy ? <div className="aterm-line aterm-dim">…</div> : null}
      </div>
      <div className="aterm-input-row">
        <span className="aterm-prompt">{auth.email ? `AURA:${auth.email.split("@")[0].toUpperCase()}>` : PROMPT}</span>
        <input
          ref={inputRef}
          className="aterm-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label="Terminal command input"
          disabled={busy}
        />
        <span className="aterm-cursor" aria-hidden />
      </div>
    </div>
  );
}
