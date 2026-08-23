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
  critical: "Critical risk",
};

// which accent color family a risk level maps to
const RISK_COLOR = {
  none: { text: "var(--muted)", bg: "var(--line)" },
  low: { text: "var(--sage)", bg: "var(--sage-bg)" },
  elevated: { text: "var(--gold)", bg: "var(--gold-bg)" },
  high: { text: "var(--coral)", bg: "var(--coral-bg)" },
  critical: { text: "var(--coral)", bg: "var(--coral-bg)" },
};

const TREND_LABEL = {
  escalating: "▲ escalating over time",
  steady: "→ steady",
  "de-escalating": "▼ de-escalating",
  insufficient_data: "conversation too short to trend",
};

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--line)",
  borderRadius: 24,
  boxShadow: "0 4px 16px -8px rgba(51,49,45,0.06)",
};

export default function AnalyzerTab() {
  const [raw, setRaw] = useState("");
  const [sensitivity, setSensitivity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function analyze(text, sens = sensitivity) {
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
        body: JSON.stringify({ messages, sensitivity: sens }),
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

  function handleSensitivityChange(newVal) {
    setSensitivity(newVal);
    if (result) analyze(raw, newVal);
  }

  return (
    <>
      <div className="p-8 mb-6" style={cardStyle}>
        <div className="font-mono text-[10.5px] uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>
          Conversation input
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"Jordan: hey! saw your comment...\nYou: oh thanks!"}
          className="w-full min-h-[160px] text-sm leading-relaxed p-4 resize-y focus:outline-none rounded-2xl"
          style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink)" }}
        />
        <p className="text-xs mt-3 mb-4 leading-relaxed" style={{ color: "var(--muted)" }}>
          One message per line, formatted as{" "}
          <code style={{ background: "var(--sage-bg)", color: "var(--ink)", padding: "1px 6px", borderRadius: 5 }}>
            Sender: message
          </code>
          . Nothing is stored — this runs once, on demand.
        </p>
        <div className="flex gap-2.5">
          <button
            disabled={loading}
            onClick={() => analyze(raw)}
            className="font-display font-semibold text-[13.5px] px-6 py-3 disabled:opacity-50"
            style={{ background: "var(--sage)", color: "#fff", borderRadius: 999, border: "none", boxShadow: "0 8px 20px -8px rgba(122,155,126,0.5)" }}
          >
            {loading ? "Analyzing…" : "Analyze conversation"}
          </button>
          <button
            onClick={() => setRaw(SAMPLE)}
            className="font-display font-semibold text-[13.5px] px-6 py-3"
            style={{ background: "transparent", color: "var(--muted)", borderRadius: 999, border: "1px solid var(--line)" }}
          >
            Load sample conversation
          </button>
        </div>
        {error && (
          <p className="text-sm mt-3" style={{ color: "var(--coral)" }}>
            {error}
          </p>
        )}

        <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Sensitivity
            </span>
            <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--sage)" }}>
              {sensitivity < 0.85 ? "Cautious" : sensitivity > 1.15 ? "Sensitive" : "Balanced"}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={sensitivity}
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--sage)" }}
          />
          <p className="text-[11.5px] mt-1.5 leading-relaxed" style={{ color: "var(--faint)" }}>
            Lower flags only strong signals; higher flags earlier, weaker ones too — useful for tuning false
            positives.
          </p>
        </div>
      </div>

      {result && <Results result={result} />}
    </>
  );
}

function Results({ result }) {
  const riskColor = RISK_COLOR[result.overallRisk] || RISK_COLOR.none;

  return (
    <div className="flex flex-col gap-5">
      <div className="p-8 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-7 items-center" style={cardStyle}>
        <div
          className="w-[120px] h-[120px] rounded-full flex flex-col items-center justify-center mx-auto sm:mx-0"
          style={{ background: riskColor.bg }}
        >
          <span
            className="font-display font-bold text-[14.5px] text-center leading-tight"
            style={{ color: riskColor.text }}
          >
            {RISK_LABEL[result.overallRisk]}
          </span>
          <span className="font-mono text-[11px] mt-1 opacity-80" style={{ color: riskColor.text }}>
            score {result.totalScore}
          </span>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="font-display font-bold text-xl mb-2">Manipulation Journey summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {result.messageCount} messages examined · {result.flaggedMessages.length} flagged for at least one
            pattern.
          </p>
          <span
            className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 mt-3"
            style={{ color: "var(--gold)", background: "var(--gold-bg)", borderRadius: 999 }}
          >
            {TREND_LABEL[result.trend]}
          </span>
        </div>
      </div>

      <div className="p-8" style={cardStyle}>
        <div className="font-mono text-[10.5px] uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>
          Manipulation journey
        </div>
        <RiskTimeline messages={result.messages} />
      </div>

      {Object.keys(result.categoryTally).length > 0 && (
        <div className="p-8" style={cardStyle}>
          <div className="font-mono text-[10.5px] uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>
            Patterns detected
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {Object.entries(result.categoryTally).map(([key, cat]) => (
              <div
                key={key}
                className="p-4 rounded-2xl"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                <div className="flex justify-between items-baseline mb-1.5">
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

      <div className="p-8" style={cardStyle}>
        <div className="font-mono text-[10.5px] uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>
          Annotated conversation
        </div>
        <div className="flex flex-col gap-1">
          {result.messages.map((m) => {
            const flagged = m.flags.length > 0;
            return (
              <div key={m.index} className="flex gap-3 py-3.5" style={{ borderTop: "1px solid var(--line)" }}>
                <div
                  className="w-[30px] h-[30px] rounded-full flex-shrink-0 flex items-center justify-center font-display font-bold text-[11px]"
                  style={{ background: flagged ? "var(--coral-bg)" : "var(--sage-bg)", color: flagged ? "var(--coral)" : "var(--sage)" }}
                >
                  {m.sender?.[0]?.toUpperCase() || "?"}
                </div>
                <div
                  className="flex-1 p-3.5 rounded-2xl"
                  style={{ background: flagged ? "var(--coral-bg)" : "var(--bg)", border: flagged ? "none" : "1px solid var(--line)" }}
                >
                  <p className="text-sm leading-relaxed m-0">{m.text}</p>
                  {flagged && (
                    <div className="mt-2">
                      {m.flags.map((f, i) => (
                        <span
                          key={i}
                          className="font-mono text-[10px] px-2.5 py-1 mr-1.5"
                          style={{ color: "var(--coral)", background: "#fff", border: "1px solid var(--coral)", borderRadius: 999 }}
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

      <div className="p-8" style={{ ...cardStyle, border: "1px solid var(--gold)" }}>
        <div className="font-mono text-[10.5px] uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>
          Safety guidance
        </div>
        <ul className="flex flex-col gap-3">
          {result.guidance.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span
                className="flex-shrink-0 mt-1.5"
                style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }}
              />
              {tip}
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed mt-4 pt-4" style={{ color: "var(--muted)", borderTop: "1px solid var(--line)" }}>
          If a conversation reaches this point, it's okay to stop responding, block the person, and tell a trusted
          adult. In India, teens can also contact Childline at 1098 for free, confidential support.
        </p>
      </div>
    </div>
  );
}
