import { useState } from "react";
import AnalyzerTab from "./components/AnalyzerTab.jsx";
import ChatTab from "./components/ChatTab.jsx";

export default function App() {
  const [tab, setTab] = useState("analyze");

  return (
    <div className="min-h-screen" style={{ color: "var(--ink)" }}>
      <div className="max-w-3xl mx-auto px-7 py-14">
        <header className="flex justify-between items-end pb-4 mb-1.5" style={{ borderBottom: "3px solid var(--ink)" }}>
          <h1 className="font-display font-semibold text-[34px] tracking-tight m-0">TrapShield</h1>
          <div className="font-mono text-[10.5px] text-right leading-relaxed" style={{ color: "var(--muted)" }}>
            CASE FILE
            <br />
            REF #0192 · FILED TODAY
          </div>
        </header>
        <div className="mb-7" style={{ borderBottom: "1px solid var(--ink)" }} />

        <div className="flex mb-7" style={{ borderBottom: "1px solid var(--line)" }}>
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
      className="pb-2.5 mr-7 font-mono text-[11.5px] uppercase tracking-wider cursor-pointer"
      style={{
        color: active ? "var(--ink)" : "var(--faint)",
        borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
      }}
    >
      {label}
    </div>
  );
}