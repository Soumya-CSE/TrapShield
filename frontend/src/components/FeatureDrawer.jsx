export default function FeatureDrawer({ title, subtitle, onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(51,49,45,0.15)", backdropFilter: "blur(2px)", zIndex: 45 }}
      />
      <div
        className="p-6"
        style={{
          position: "fixed",
          right: 96,
          top: "50%",
          transform: "translateY(-50%)",
          width: 340,
          maxHeight: "72vh",
          overflowY: "auto",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 24,
          boxShadow: "0 20px 50px -15px rgba(51,49,45,0.25)",
          zIndex: 46,
        }}
      >
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display font-bold text-[15px] m-0">{title}</h3>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: 16 }}
          >
            ✕
          </button>
        </div>
        {subtitle && (
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </>
  );
}
