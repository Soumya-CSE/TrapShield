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
Jordan: whats your ins	agram, you're so pretty
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
      return {
        sender: line.slice(0, idx).trim(),
        text: line.slice(idx + 1).trim(),
      };
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
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong reaching the analysis engine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <div className="brand-mark" />
          <div className="brand-name">TrapShield</div>
        </div>
        <p className="tagline">
          Don't wait until it's too late. TrapShield reads the shape of a conversation, not just one message.
        </p>
      </header>

      <section className="panel">
        <h3 className="panel-title">Conversation input</h3>
        <p className="panel-hint">
          Paste a conversation, one message per line as <code>Sender: message</code>. Nothing is stored — this runs
          once, on demand.
        </p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"Jordan: hey! saw your comment...\nYou: oh thanks!"}
        />
        <div className="action-row">
          <button className="btn btn-primary" disabled={loading} onClick={() => analyze(raw)}>
            {loading ? "Analyzing…" : "Analyze conversation"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setRaw(SAMPLE);
            }}
          >
            Load sample conversation
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </section>

      {result && <Results result={result} />}
    </div>
  );
}

function Results({ result }) {
  const badgeColor = `var(--risk-${result.overallRisk})`;

  return (
    <section className="results">
      <div className="panel summary-row">
        <div className="risk-badge" style={{ "--badge-color": badgeColor }}>
          <span className="risk-word">{RISK_LABEL[result.overallRisk]}</span>
          <span className="risk-score">score {result.totalScore}</span>
        </div>
        <div className="summary-text">
          <h2>Manipulation Journey summary</h2>
          <p>
            {result.messageCount} messages analyzed · {result.flaggedMessages.length} flagged for at least one
            pattern.
          </p>
          <span className="trend-tag">{TREND_LABEL[result.trend]}</span>
        </div>
      </div>

      <div className="panel journey-panel">
        <h3 className="panel-title">Manipulation journey</h3>
        <RiskTimeline messages={result.messages} />
      </div>

      {Object.keys(result.categoryTally).length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Patterns detected</h3>
          <div className="category-grid">
            {Object.entries(result.categoryTally).map(([key, cat]) => (
              <div className="category-card" key={key}>
                <div className="cat-head">
                  <span className="cat-label">{cat.label}</span>
                  <span className="cat-count">×{cat.count}</span>
                </div>
                <p className="cat-explain">{cat.explain}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h3 className="panel-title">Annotated conversation</h3>
        <div className="message-list">
          {result.messages.map((m) => {
            const color = `var(--risk-${m.riskLevel})`;
            return (
              <div
                key={m.index}
                className={`message-row ${m.flags.length ? "flagged" : ""}`}
                style={{ "--row-color": color }}
              >
                <div className="message-sender">{m.sender}</div>
                <div className="message-body">
                  <p className="text">{m.text}</p>
                  {m.flags.length > 0 && (
                    <div className="message-flags">
                      {m.flags.map((f, i) => (
                        <span className="flag-chip" key={i}>
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

      <div className="panel guidance-panel">
        <h3 className="panel-title">Safety guidance</h3>
        <ul className="guidance-list">
          {result.guidance.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
        <p className="helpline-note">
          If a conversation reaches this point, it's okay to stop responding, block the person, and tell a trusted
          adult. In India, teens can also contact Childline at 1098 for free, confidential support.
        </p>
      </div>
    </section>
  );
}
