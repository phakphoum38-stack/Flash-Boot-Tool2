export default function ModeSelector({ mode, setMode }) {

  const modes = [
    { id: "dd", name: "🔥 DD MODE" },
    { id: "smart", name: "⚡ SMART MODE" },
    { id: "etcher", name: "🧠 ETCHER MODE" },
    { id: "ventoy", name: "📦 VENTOY MODE" }
  ]

  return (
    <div className="panel">

      <h3>⚙️ Flash Mode</h3>

      <div style={{ display: "flex", gap: 10 }}>

        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              background:
                mode === m.id ? "#00ffcc" : "#333",
              color: "black"
            }}
          >
            {m.name}
          </button>
        ))}

      </div>

      <div style={{ marginTop: 10 }}>
        Selected:
        <b> {mode}</b>
      </div>

    </div>
  )
}
