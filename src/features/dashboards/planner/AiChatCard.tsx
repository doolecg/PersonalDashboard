import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { sendAssistantMessage, type AssistantChatMessage } from "@/app/apiClient";
import { usePreferences } from "@/app/preferences/usePreferences";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import { Card } from "./ui";

const suggestions = [
  "What's the weather looking like today?",
  "Summarise what's on my plate.",
  "What should I wear for the evening?"
];

export function AiChatCard() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const preferences = usePreferences();
  const { data: weather } = useWeatherData();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Give the assistant the user's location and current conditions so it can
  // answer location-aware questions without needing a tool call.
  function buildContext(): Record<string, unknown> {
    const location = preferences.location
      ? { name: preferences.location.name, latitude: preferences.location.latitude, longitude: preferences.location.longitude }
      : weather
        ? { name: weather.current.location, latitude: weather.current.latitude, longitude: weather.current.longitude }
        : undefined;

    return {
      location,
      weather: weather
        ? {
            temperatureC: Math.round(weather.current.temperatureC),
            feelsLikeC: typeof weather.current.feelsLikeC === "number" ? Math.round(weather.current.feelsLikeC) : undefined,
            condition: weather.current.conditionLabel,
            highC: weather.current.highC,
            lowC: weather.current.lowC
          }
        : undefined,
      localTime: new Date().toLocaleString()
    };
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: AssistantChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      const result = await sendAssistantMessage(next, buildContext());
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (error) {
      setMessages([...next, { role: "assistant", content: error instanceof Error ? error.message : "Sorry, I couldn't reach the assistant." }]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <Card className="w-ai fill">
      <div className="ai-head">
        <span className="ai-orb">
          <Sparkles size={16} />
        </span>
        <span className="ai-title">Ask Aura</span>
        <span className="ai-badge">AI</span>
      </div>

      {messages.length === 0 ? (
        <div className="chat-empty">
          <ul className="ai-list">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => void send(suggestion)}
                  style={{ background: "none", border: "none", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer", padding: 0 }}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="chat-scroll" ref={scrollRef}>
          {messages.map((message, index) => (
            <div className={`chat-msg ${message.role}`} key={index}>
              {message.content}
            </div>
          ))}
          {busy ? <div className="chat-msg assistant">…</div> : null}
        </div>
      )}

      <form className="ai-ask glass" onSubmit={handleSubmit}>
        <Sparkles size={15} style={{ opacity: 0.6, flex: "none" }} />
        <input
          value={draft}
          placeholder="Ask Aura anything…"
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Message Aura"
        />
        <button type="submit" className="ai-send" disabled={busy || !draft.trim()} aria-label="Send">
          <Send size={15} />
        </button>
      </form>
    </Card>
  );
}
