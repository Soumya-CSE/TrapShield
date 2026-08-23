export default function FeatureDock({ items, activeId, onSelect }) {
  return (
    <div
      className="hidden md:flex flex-col gap-2.5 p-2.5"
      style={{
        position: "fixed",
        right: 28,
        top: "50%",
        transform: "translateY(-50%)",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 22,
        boxShadow: "0 12px 30px -10px rgba(51,49,45,0.18)",
        zIndex: 40,
      }}
    >
      {items.map((item, i) => (
        <div key={item.id}>
          {item.divider && <div style={{ height: 1, background: "var(--line)", margin: "2px 6px" }} />}
          <button
            onClick={() => onSelect(activeId === item.id ? null : item.id)}
            title={item.label}
            className="relative flex items-center justify-center transition-colors"
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              background: activeId === item.id ? "var(--sage-bg)" : "transparent",
              color: activeId === item.id ? "var(--sage)" : "var(--muted)",
            }}
          >
            {item.icon}
            {item.badge && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--coral)",
                  border: "2px solid var(--card)",
                }}
              />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
