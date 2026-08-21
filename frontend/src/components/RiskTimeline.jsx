import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#FBF9F4",
        border: "1px solid #D8D2C2",
        padding: "10px 12px",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 12,
        maxWidth: 260,
        color: "#1A1815",
      }}
    >
      <div style={{ color: "#7A7468", marginBottom: 4 }}>
        msg #{d.index + 1} · {d.sender}
      </div>
      <div style={{ marginBottom: d.flags.length ? 6 : 0 }}>cumulative risk: {d.cumulative}</div>
      {d.flags.map((f, i) => (
        <div key={i} style={{ color: "#C4491F" }}>
          ▸ {f.label}
        </div>
      ))}
    </div>
  );
}

export default function RiskTimeline({ messages }) {
  const markers = messages.filter((m) => m.flags.length > 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={messages} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="#E8E3D6" vertical={false} />
        <XAxis
          dataKey="index"
          tickFormatter={(i) => `#${i + 1}`}
          stroke="#A79F8E"
          fontSize={11}
          fontFamily="JetBrains Mono, monospace"
          tickLine={false}
        />
        <YAxis stroke="#A79F8E" fontSize={11} fontFamily="JetBrains Mono, monospace" tickLine={false} width={30} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="cumulative" stroke="#C4491F" strokeWidth={2} dot={false} />
        {markers.map((m) => (
          <ReferenceDot key={m.index} x={m.index} y={m.cumulative} r={4} fill="#C4491F" stroke="#FBF9F4" strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}