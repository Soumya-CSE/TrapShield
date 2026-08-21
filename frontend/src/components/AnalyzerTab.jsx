import { useState } from "react";
import RiskTimeline from "./RiskTimeline.jsx";

const SAMPLE = `Jordan: hey! i saw your comment on that art page, you're really talented
You: oh thank you!
Jordan: seriously, you're way more mature than most people your age
Jordan: i feel like nobody gets me the way you do
You: haha same honestly
Jordan: whats your snapchat? this app is kind of annoying to type on
You: um sure its just my name
Jordan: don't tell your parents we talk on here btw, they wouldn't get it
Jordan: whats your instagram, you're so pretty
You: lol thanks
Jordan: send me a pic of you rn
You: i mean i already sent one earlier
Jordan: i want a different one, come on
Jordan: why aren't you answering me
Jordan: if you really liked me you'd just send it
Jordan: i still have the one you sent earlier you know
Jordan: dont make this weird, everyone will see it if you dont`;

function parseConversation(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { sender: "unknown", text: line };
      return { sender: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() };
    })
    .filter((m) => m.text.length > 0);
}

const RISK_LABEL = {
  none: "No signal",
  low: "Low risk",
  elevated: "Elevated risk",
  high: "High risk",
  critical: "Critical",
};

const TREND_LABEL = {
  escalating: "▲ escalating over time",
  steady: "→ steady",
  "de-escalating": "▼ de-escalating",
  insufficient_data: "conversation too short to trend",
};

export default function AnalyzerTab() {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function analyze(text) {
    const messages = parseConversation(text);
    if (messages.length === 0) {
      setError("Paste a conversation first — one message per line, like 'Name: message'.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(e.message || "Something went wrong reaching the analysis engine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="p-6 mb-6" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <div
          className="font-mono text-[11px] uppercase tracking-wider mb-4 pb-2"
          style={{ color: "var(--muted)", borderBottom: "1px solid var(--line)" }}
        >
          Conversation input
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"Jordan: hey! saw your comment...\nYou: oh thanks!"}
          className="w-full min-h-[160px] bg-white text-sm leading-relaxed p-3.5 resize-y focus:outline-none"
          style={{ border: "1px solid var(--line)", color: "var(--ink)", fontFamily: "JetBrains Mono, monospace" }}
        />
        <p className="text-xs mt-2.5 mb-3.5 leading-relaxed" style={{ color: "var(--muted)" }}>
          One message per line, formatted as{" "}
          <code style={{ background: "var(--line)", color: "var(--ink)", padding: "1px 5px" }}>
            Sender: message
          </code>
          . Nothing is stored — this runs once, on demand.
        </p>
        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={() => analyze(raw)}
            className="font-semibold text-sm px-5 py-2.5 disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--paper)", border: "1px solid var(--ink)" }}
          >
            {loading ? "Analyzing…" : "Analyze conversation"}
          </button>
          <button
            onClick={() => setRaw(SAMPLE)}
            className="font-semibold text-sm px-5 py-2.5"
            style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" }}
          >
            Load sample conversation
          </button>
        </div>
        {error && (
          <p className="text-sm mt-3" style={{ color: "var(--accent)" }}>
            {error}
          </p>
        )}
      </div>

      {result && <Results result={result} />}
    </>
  );
}

function Results({ result }) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center"
        style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
      >
        <div
          className="w-[118px] h-[118px] rounded-full flex flex-col items-center justify-center mx-auto sm:mx-0"
          style={{ border: "3px solid var(--accent)", transform: "rotate(-6deg)" }}
        >
          <span
            className="font-display font-semibold text-sm uppercase tracking-wide"
            style={{ color: "var(--accent)" }}
          >
            {RISK_LABEL[result.overallRisk]}
          </span>
          <span className="font-mono text-[10.5px] mt-1" style={{ color: "var(--accent)" }}>
            score {result.totalScore}
          </span>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="font-display font-semibold text-xl mb-2">Manipulation Journey summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {result.messageCount} messages examined · {result.flaggedMessages.length} entries flagged for at least
            one pattern.
          </p>
          <span
            className="inline-block font-mono text-xs px-2.5 py-1 mt-2.5"
            style={{ color: "var(--gold)", background: "var(--gold-bg)", border: "1px solid var(--gold)" }}
          >
            {TREND_LABEL[result.trend]}
          </span>
        </div>
      </div>

      <div className="p-6" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <div
          className="font-mono text-[11px] uppercase tracking-wider mb-4 pb-2"
          style={{ color: "var(--muted)", borderBottom: "1px solid var(--line)" }}
        >
          Manipulation journey
        </div>
        <RiskTimeline messages={result.messages} />
      </div>

      {Object.keys(result.categoryTally).length > 0 && (
        <div className="p-6" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
          <div
            className="font-mono text-[11px] uppercase tracking-wider mb-4 pb-2"
            style={{ color: "var(--muted)", borderBottom: "1px solid var(--line)" }}
          >
            Patterns detected
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {Object.entries(result.categoryTally).map(([key, cat]) => (
              <div
                key={key}
                className="p-3.5 relative"
                style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{ width: "3px", background: "var(--accent)" }}
                />
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-display font-semibold text-sm">{cat.label}</span>
                  <span className="font-mono text-[10.5px]" style={{ color: "var(--faint)" }}>
                    ×{cat.count}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {cat.explain}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <div
          className="font-mono text-[11px] uppercase tracking-wider mb-4 pb-2"
          style={{ color: "var(--muted)", borderBottom: "1px solid var(--line)" }}
        >
          Annotated conversation
        </div>
        <div>
          {result.messages.map((m) => {
            const flagged = m.flags.length > 0;
            return (
              <div
                key={m.index}
                className="grid grid-cols-[90px_1fr] gap-4 py-3"
                style={{
                  borderBottom: "1px solid var(--line)",
                  background: flagged ? "var(--accent-bg)" : "transparent",
                  margin: flagged ? "0 -16px" : undefined,
                  padding: flagged ? "13px 16px" : "13px 0",
                }}
              >
                <div
                  className="font-mono text-[11px] uppercase pt-0.5"
                  style={{ color: flagged ? "var(--accent)" : "var(--muted)" }}
                >
                  {m.sender}
                </div>
                <div>
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  {flagged && (
                    <div className="mt-1.5">
                      {m.flags.map((f, i) => (
                        <span
                          key={i}
                          className="font-mono text-[10px] px-1.5 py-0.5 mr-1.5"
                          style={{ color: "var(--accent)", border: "1px solid var(--accent)" }}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6" style={{ background: "var(--paper)", border: "1px solid var(--gold)" }}>
        <div
          className="font-mono text-[11px] uppercase tracking-wider mb-4 pb-2"
          style={{ color: "var(--muted)", borderBottom: "1px solid var(--line)" }}
        >
          Safety guidance
        </div>
        <ul className="flex flex-col gap-2.5">
          {result.guidance.map((tip, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span style={{ color: "var(--gold)", fontWeight: 700 }}>§</span>
              {tip}
            </li>
          ))}
        </ul>
        <p
          className="text-xs leading-relaxed mt-4 pt-3.5"
          style={{ color: "var(--muted)", borderTop: "1px solid var(--line)" }}
        >
          If a conversation reaches this point, it's okay to stop responding, block the person, and tell a trusted
          adult. In India, teens can also contact Childline at 1098 for free, confidential support.
        </p>
      </div>
    </div>
  );
}