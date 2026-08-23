import { useState } from "react";
import AnalyzerTab from "./components/AnalyzerTab.jsx";
import ChatTab from "./components/ChatTab.jsx";

export default function App() {
  const [tab, setTab] = useState("analyze");

  return (
    <div className="min-h-screen" style={{ color: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto px-10 py-16">
        <header className="flex justify-between items-center mb-9">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--sage), var(--gold))" }}
            />
            <span className="font-display font-bold text-3xl">TrapShield</span>
          </div>
          <p className="text-sm max-w-sm text-right leading-relaxed hidden sm:block" style={{ color: "var(--muted)" }}>
            Don't wait until it's too late — read the shape of a conversation, not just one message.
          </p>
        </header>

        <div
          className="inline-flex gap-1 p-1.5 mb-10"
          style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, boxShadow: "0 1px 2px rgba(51,49,45,0.03)" }}
        >
          <TabButton label="Analyze a conversation" active={tab === "analyze"} onClick={() => setTab("analyze")} />
          <TabButton label="Talk to someone" active={tab === "chat"} onClick={() => setTab("chat")} />
        </div>

        {tab === "analyze" ? <AnalyzerTab /> : <ChatTab />}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className="px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
      style={{
        borderRadius: 999,
        color: active ? "var(--sage)" : "var(--muted)",
        background: active ? "var(--sage-bg)" : "transparent",
      }}
    >
      {label}
    </div>
  );
}
