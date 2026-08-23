import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = ["He asked for my Snapchat", "I feel like I can't tell my parents", "Is this actually a big deal?"];

const OPENING_MESSAGE = {
  role: "assistant",
  content: "Hey, I'm here if you want to talk something through. What's going on?",
};

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--line)",
  borderRadius: 24,
  boxShadow: "0 4px 16px -8px rgba(51,49,45,0.06)",
};

export default function ChatTab() {
  const [messages, setMessages] = useState([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const threadRef = useRef(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const apiMessages = nextMessages.filter((m) => m !== OPENING_MESSAGE);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e.message || "Couldn't reach the Guide right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8" style={cardStyle}>
      <div className="flex gap-3.5 items-start mb-5 pb-5" style={{ borderBottom: "1px solid var(--line)" }}>
        <div
          className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-lg"
          style={{ background: "linear-gradient(135deg, var(--sage), var(--gold))" }}
        >
          ◈
        </div>
        <div>
          <p className="font-display font-bold text-[15px] mb-1">The Guide</p>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            A private space to talk through something that's been bothering you online. Nothing typed here is saved
            or shared.
          </p>
        </div>
      </div>

      <div ref={threadRef} className="flex flex-col gap-3.5 mb-4 max-h-[420px] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
            <div
              className="max-w-[76%] px-4 py-3 text-[13.5px] leading-relaxed"
              style={
                m.role === "assistant"
                  ? { background: "var(--sage-bg)", color: "var(--ink)", borderRadius: "18px 18px 18px 5px" }
                  : { background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "18px 18px 5px 18px" }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 text-[13.5px]"
              style={{ background: "var(--sage-bg)", color: "var(--muted)", borderRadius: "18px 18px 18px 5px" }}
            >
              …
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--coral)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="text-xs px-3.5 py-2"
            style={{ color: "var(--muted)", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 999 }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type what's on your mind…"
          className="flex-1 text-sm px-4.5 py-3 focus:outline-none"
          style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: 999 }}
        />
        <button
          onClick={() => send()}
          disabled={loading}
          className="font-display font-semibold text-sm px-6 disabled:opacity-50"
          style={{ background: "var(--sage)", color: "#fff", borderRadius: 999, border: "none", boxShadow: "0 8px 20px -8px rgba(122,155,126,0.5)" }}
        >
          Send
        </button>
      </div>

      <p className="text-[11.5px] leading-relaxed mt-4 pt-4" style={{ color: "var(--faint)", borderTop: "1px solid var(--line)" }}>
        This isn't a substitute for a trusted adult or professional. If you're ever in immediate danger, contact
        local emergency services or Childline India at 1098.
      </p>
    </div>
  );
}
