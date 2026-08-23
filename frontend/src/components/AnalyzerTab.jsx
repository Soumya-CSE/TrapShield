import { useState } from "react";
import RiskTimeline from "./RiskTimeline.jsx";
import FeatureDock from "./FeatureDock.jsx";
import FeatureDrawer from "./FeatureDrawer.jsx";
import { generateReport } from "../lib/reportGenerator.js";

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

function relativeTime(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

const HISTORY_KEY = "trapshield-history";
const MAX_HISTORY = 12;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // drop any entries saved before "result" was stored on the entry itself
    // (older versions of this app only stored a risk summary, not the full result)
    return Array.isArray(parsed) ? parsed.filter((e) => e && e.result && e.result.overallRisk) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // storage full or unavailable — fail silently, history just won't persist
  }
}

const RISK_LABEL = {
  none: "No signal",
  low: "Low risk",
  elevated: "Elevated risk",
  high: "High risk",
  critical: "Critical risk",
};

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
  const [history, setHistory] = useState(() => loadHistory());
  const [activeDock, setActiveDock] = useState(null); // null | "history" | "sensitivity"

  async function analyze(text, sens = sensitivity, { record = true } = {}) {
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
      const data = await res.json();
      setResult(data);

      if (record) {
        const entry = {
          id: `${Date.now()}`,
          savedAt: Date.now(),
          raw: text,
          sensitivity: sens,
          preview: messages[0]?.text?.slice(0, 60) || "Untitled conversation",
          result: data,
        };
        setHistory((prev) => {
          const next = [entry, ...prev].slice(0, MAX_HISTORY);
          saveHistory(next);
          return next;
        });
      }
    } catch (e) {
      setError(e.message || "Something went wrong reaching the analysis engine.");
    } finally {
      setLoading(false);
    }
  }

  function handleSensitivityChange(newVal) {
    setSensitivity(newVal);
    if (result) analyze(raw, newVal, { record: false });
  }

  function openHistoryEntry(entry) {
    setRaw(entry.raw);
    setSensitivity(entry.sensitivity);
    setResult(entry.result);
  }

  function deleteHistoryEntry(id) {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }

  function downloadHistoryEntry(entry) {
    generateReport(entry);
  }

  const dockItems = [
    { id: "history", icon: "🕘", label: "History", badge: history.length > 0 },
    { id: "sensitivity", icon: "🎚️", label: "Sensitivity", divider: true },
  ];

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
          . Nothing is stored on a server — history is saved to this browser only.
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
      </div>
      
      {result ? <Results result={result} /> : <EmptyState />}

      <FeatureDock items={dockItems} activeId={activeDock} onSelect={setActiveDock} />

      {activeDock === "history" && (
        <FeatureDrawer
          title="History"
          subtitle="Your last 12 analyzed conversations, saved on this device."
          onClose={() => setActiveDock(null)}
        >
          {history.length === 0 && (
            <p className="text-xs" style={{ color: "var(--faint)" }}>
              Nothing analyzed yet — run an analysis to see it show up here.
            </p>
          )}
          <div className="flex flex-col gap-2.5">
            {history.map((entry) => {
              const c = RISK_COLOR[entry.result.overallRisk] || RISK_COLOR.none;
              return (
                <div key={entry.id} className="p-3.5 rounded-2xl" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span
                      className="font-mono text-[9px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ color: c.text, background: c.bg }}
                    >
                      {entry.result.overallRisk}
                    </span>
                    <span className="font-mono text-[9.5px]" style={{ color: "var(--faint)" }}>
                      {relativeTime(entry.savedAt)}
                    </span>
                  </div>
                  <p className="text-xs leading-snug mb-2.5" style={{ color: "var(--ink)" }}>
                    {entry.preview}…
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openHistoryEntry(entry)}
                      className="flex-1 text-[10.5px] font-semibold py-1.5 rounded-full"
                      style={{ background: "var(--sage-bg)", color: "var(--sage)", border: "none", cursor: "pointer" }}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => downloadHistoryEntry(entry)}
                      className="flex-1 text-[10.5px] font-semibold py-1.5 rounded-full"
                      style={{ background: "var(--card)", color: "var(--muted)", border: "1px solid var(--line)", cursor: "pointer" }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => deleteHistoryEntry(entry.id)}
                      title="Delete this entry"
                      className="text-[10.5px] font-semibold py-1.5 px-2.5 rounded-full"
                      style={{ background: "var(--card)", color: "var(--coral)", border: "1px solid var(--line)", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </FeatureDrawer>
      )}

      {activeDock === "sensitivity" && (
        <FeatureDrawer title="Sensitivity" onClose={() => setActiveDock(null)}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Level
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
          <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: "var(--faint)" }}>
            Lower flags only strong signals; higher flags earlier, weaker ones too — useful for tuning false
            positives. Adjusting this re-scores the conversation currently on screen.
          </p>
        </FeatureDrawer>
      )}
    </>
  );
}

const PATTERN_PREVIEW = [
  { icon: "🚪", label: "Isolation", desc: "Cutting a teen off from parents or friends who could help." },
  { icon: "🤐", label: "Secrecy", desc: "Asking to delete messages or hide the conversation." },
  { icon: "💫", label: "Love-bombing", desc: "Intense, fast affection used to build trust quickly." },
  { icon: "📲", label: "Off-platform push", desc: "Moving the chat somewhere less monitored." },
  { icon: "📷", label: "Photo requests", desc: "Asking for private or explicit images." },
  { icon: "💰", label: "Financial asks", desc: "Requests for money or gift cards." },
  { icon: "⚠️", label: "Threats / coercion", desc: "Blackmail or threats to share private content." },
  { icon: "⏱️", label: "Urgency pressure", desc: "Guilt or time pressure to stop careful thinking." },
  { icon: "📍", label: "Meet-up pressure", desc: "Pushing toward an in-person, unsupervised meeting." },
];

function EmptyState() {
  return (
    <div className="p-8" style={cardStyle}>
      <div className="font-mono text-[10.5px] uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
        What this looks for
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Paste a conversation above and TrapShield scores it against nine explainable manipulation patterns —
        nothing is a black box, every flag traces back to the exact phrase that triggered it.
      </p>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {PATTERN_PREVIEW.map((p) => (
          <div key={p.label} className="p-4 rounded-2xl" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <span className="font-display font-semibold text-[13px]">{p.label}</span>
            </div>
            <p className="text-xs leading-relaxed m-0" style={{ color: "var(--muted)" }}>
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
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
          <span className="font-display font-bold text-[14.5px] text-center leading-tight" style={{ color: riskColor.text }}>
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
              <div key={key} className="p-4 rounded-2xl" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
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
              <span className="flex-shrink-0 mt-1.5" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }} />
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
