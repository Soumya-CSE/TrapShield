import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = ["He asked for my Snapchat", "I feel like I can't tell my parents", "Is this actually a big deal?"];

const OPENING_MESSAGE = {
  role: "assistant",
  content: "Hey, I'm here if you want to talk something through. What's going on?",
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
      // Don't send the hardcoded opening greeting to the API — Claude requires
      // the first message in a conversation to have role "user".
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
    <div className="p-6" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="flex gap-3.5 items-start mb-5 pb-4.5" style={{ borderBottom: "1px solid var(--line)" }}>
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-display font-semibold text-[15px]"
          style={{ border: "2px solid var(--accent)", color: "var(--accent)" }}
        >
          ◈
        </div>
        <div>
          <p className="font-display font-semibold text-[15px] mb-0.5">The Guide</p>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
            A private space to talk through something that's been bothering you online. Nothing typed here is saved
            or shared.
          </p>
        </div>
      </div>

      <div ref={threadRef} className="flex flex-col gap-3.5 mb-4 max-h-[420px] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className="grid gap-4" style={{ gridTemplateColumns: "90px 1fr" }}>
            <div
              className="font-mono text-[10.5px] uppercase pt-0.5"
              style={{ color: m.role === "assistant" ? "var(--accent)" : "var(--muted)" }}
            >
              {m.role === "assistant" ? "Guide" : "You"}
            </div>
            <div
              className={m.role === "assistant" ? "font-display font-medium text-[14.5px]" : "text-[13.5px]"}
              style={{ lineHeight: 1.65 }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "90px 1fr" }}>
            <div className="font-mono text-[10.5px] uppercase pt-0.5" style={{ color: "var(--accent)" }}>
              Guide
            </div>
            <div className="font-display text-[14.5px]" style={{ color: "var(--faint)" }}>
              …
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--accent)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4.5" style={{ marginBottom: 18 }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="font-mono text-[11px] px-3 py-1.5"
            style={{ color: "var(--muted)", border: "1px solid var(--line)", background: "transparent" }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type what's on your mind…"
          className="flex-1 text-sm px-3.5 py-2.5 focus:outline-none"
          style={{ background: "#fff", border: "1px solid var(--line)", color: "var(--ink)" }}
        />
        <button
          onClick={() => send()}
          disabled={loading}
          className="font-semibold text-sm px-5 disabled:opacity-50"
          style={{ background: "var(--ink)", color: "var(--paper)", border: "1px solid var(--ink)" }}
        >
          Send
        </button>
      </div>

      <p className="text-[11px] leading-relaxed mt-4 pt-3.5" style={{ color: "var(--faint)", borderTop: "1px solid var(--line)" }}>
        This isn't a substitute for a trusted adult or professional. If you're ever in immediate danger, contact
        local emergency services or Childline India at 1098.
      </p>
    </div>
  );
}