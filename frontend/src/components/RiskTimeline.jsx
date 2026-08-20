import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  CartesianGrid,
} from "recharts";

const RISK_COLORS = {
  none: "#3b4854",
  low: "#4fd1c5",
  elevated: "#f2b84b",
  high: "#ef8354",
  critical: "#e8555a",
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#161f28",
        border: "1px solid #212c37",
        borderRadius: 8,
        padding: "10px 12px",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 12,
        maxWidth: 260,
      }}
    >
      <div style={{ color: "#8593a1", marginBottom: 4 }}>
        msg #{d.index + 1} · {d.sender}
      </div>
      <div style={{ color: "#e7edf3", marginBottom: d.flags.length ? 6 : 0 }}>
        cumulative risk: {d.cumulative}
      </div>
      {d.flags.map((f, i) => (
        <div key={i} style={{ color: RISK_COLORS[d.riskLevel] || "#f2b84b" }}>
          ▸ {f.label}
        </div>
      ))}
    </div>
  );
}

export default function RiskTimeline({ messages }) {
  const markers = messages.filter((m) => m.flags.length > 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={messages} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="#1a232c" vertical={false} />
        <XAxis
          dataKey="index"
          tickFormatter={(i) => `#${i + 1}`}
          stroke="#56636f"
          fontSize={11}
          fontFamily="JetBrains Mono, monospace"
          tickLine={false}
        />
        <YAxis stroke="#56636f" fontSize={11} fontFamily="JetBrains Mono, monospace" tickLine={false} width={36} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="#4fd1c5"
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
        {markers.map((m) => (
          <ReferenceDot
            key={m.index}
            x={m.index}
            y={m.cumulative}
            r={5}
            fill={RISK_COLORS[m.riskLevel] || "#f2b84b"}
            stroke="#0a0e13"
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
