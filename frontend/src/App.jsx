import { useState } from "react";
import RiskTimeline from "./components/RiskTimeline.jsx";

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

// Risk level -> actual color values (Tailwind can't do dynamic class names,
// so for anything driven by data we fall back to inline style with these).
const RISK_COLORS = {
  none: "#3b4854",
  low: "#4fd1c5",
  elevated: "#f2b84b",
  high: "#ef8354",
  critical: "#e8555a",
};

const RISK_LABEL = {
  none: "No signal",
  low: "Low risk",
  elevated: "Elevated risk",
  high: "High risk",
  critical: "Critical risk",
};

const TREND_LABEL = {
  escalating: "▲ escalating over time",
  steady: "→ steady",
  "de-escalating": "▼ de-escalating",
  insufficient_data: "conversation too short to trend",
};

export default function App() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="flex items-start justify-between gap-6 mb-10 pb-7 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 via-amber-400 to-red-400 flex-shrink-0" />
            <span className="font-bold text-xl tracking-tight">TrapShield</span>
          </div>
          <p className="text-sm text-slate-400 max-w-xs text-right leading-relaxed hidden sm:block">
            Don't wait until it's too late. TrapShield reads the shape of a conversation, not just one message.
          </p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-7">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Conversation input
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Paste a conversation, one message per line as <code className="text-slate-400">Sender: message</code>.
            Nothing is stored — this runs once, on demand.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"Jordan: hey! saw your comment...\nYou: oh thanks!"}
            className="w-full min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl text-slate-100
                       font-mono text-sm leading-relaxed p-4 resize-y
                       focus:outline-none focus:border-teal-400"
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              disabled={loading}
              onClick={() => analyze(raw)}
              className="font-semibold text-sm rounded-lg px-5 py-2.5 bg-teal-400 text-slate-950
                         hover:bg-teal-300 active:scale-[0.98] transition
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing…" : "Analyze conversation"}
            </button>
            <button
              onClick={() => setRaw(SAMPLE)}
              className="font-semibold text-sm rounded-lg px-5 py-2.5 border border-slate-700 text-slate-400
                         hover:text-slate-100 hover:border-slate-500 active:scale-[0.98] transition"
            >
              Load sample conversation
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </section>

        {result && <Results result={result} />}
      </div>
    </div>
  );
}

function Results({ result }) {
  const badgeColor = RISK_COLORS[result.overallRisk] || RISK_COLORS.none;

  return (
    <section className="flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
        <div
          className="w-32 h-32 rounded-full flex flex-col items-center justify-center border-[3px] mx-auto sm:mx-0"
          style={{
            borderColor: badgeColor,
            background: `radial-gradient(circle, ${badgeColor}1f, transparent 70%)`,
          }}
        >
          <span className="font-bold text-sm uppercase tracking-wide" style={{ color: badgeColor }}>
            {RISK_LABEL[result.overallRisk]}
          </span>
          <span className="font-mono text-xs text-slate-500 mt-1">score {result.totalScore}</span>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold mb-2">Manipulation Journey summary</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {result.messageCount} messages analyzed · {result.flaggedMessages.length} flagged for at least one
            pattern.
          </p>
          <span className="inline-block font-mono text-xs px-2 py-1 rounded-md border border-slate-700 text-slate-400 mt-2">
            {TREND_LABEL[result.trend]}
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Manipulation journey
        </h3>
        <RiskTimeline messages={result.messages} />
      </div>

      {Object.keys(result.categoryTally).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Patterns detected
          </h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {Object.entries(result.categoryTally).map(([key, cat]) => (
              <div key={key} className="bg-slate-800/60 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-semibold">{cat.label}</span>
                  <span className="font-mono text-xs text-slate-500">×{cat.count}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{cat.explain}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Annotated conversation
        </h3>
        <div className="flex flex-col gap-2.5">
          {result.messages.map((m) => {
            const color = RISK_COLORS[m.riskLevel] || RISK_COLORS.none;
            const flagged = m.flags.length > 0;
            return (
              <div
                key={m.index}
                className="grid grid-cols-[90px_1fr] gap-3.5 p-3.5 rounded-xl border"
                style={{
                  borderColor: "#212c37",
                  borderLeft: flagged ? `3px solid ${color}` : undefined,
                  background: flagged ? `${color}0f` : "#10161d",
                }}
              >
                <div className="font-mono text-[11px] uppercase tracking-wide text-slate-500 pt-0.5">
                  {m.sender}
                </div>
                <div>
                  <p className="text-sm leading-relaxed mb-1.5">{m.text}</p>
                  {flagged && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.flags.map((f, i) => (
                        <span
                          key={i}
                          className="font-mono text-[10.5px] px-2 py-0.5 rounded-md border"
                          style={{ color, borderColor: `${color}66`, background: `${color}33` }}
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

      <div className="bg-slate-900 border border-teal-400/60 rounded-2xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Safety guidance</h3>
        <ul className="list-disc pl-5 flex flex-col gap-2.5">
          {result.guidance.map((tip, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-800">
          If a conversation reaches this point, it's okay to stop responding, block the person, and tell a trusted
          adult. In India, teens can also contact Childline at 1098 for free, confidential support.
        </p>
      </div>
    </section>
  );
}