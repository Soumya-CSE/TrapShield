import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #EDE7D9",
        borderRadius: 12,
        padding: "10px 12px",
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: 12,
        maxWidth: 260,
        color: "#33312D",
        boxShadow: "0 8px 20px -8px rgba(51,49,45,0.15)",
      }}
    >
      <div style={{ color: "#8A8579", marginBottom: 4 }}>
        msg #{d.index + 1} · {d.sender}
      </div>
      <div style={{ marginBottom: d.flags.length ? 6 : 0 }}>cumulative risk: {d.cumulative}</div>
      {d.flags.map((f, i) => (
        <div key={i} style={{ color: "#E4897A" }}>
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
        <defs>
          <linearGradient id="journeyGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7A9B7E" />
            <stop offset="55%" stopColor="#D9A455" />
            <stop offset="100%" stopColor="#E4897A" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#F1EBDD" vertical={false} />
        <XAxis
          dataKey="index"
          tickFormatter={(i) => `#${i + 1}`}
          stroke="#B7B2A4"
          fontSize={11}
          fontFamily="IBM Plex Mono, monospace"
          tickLine={false}
        />
        <YAxis stroke="#B7B2A4" fontSize={11} fontFamily="IBM Plex Mono, monospace" tickLine={false} width={30} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="cumulative" stroke="url(#journeyGradient)" strokeWidth={3} dot={false} />
        {markers.map((m) => (
          <ReferenceDot key={m.index} x={m.index} y={m.cumulative} r={5} fill="#E4897A" stroke="#FFFFFF" strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
