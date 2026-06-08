export default function LogBox({ logs }) {

  return (
    <div className="panel">

      <h3>📜 Logs</h3>

      <div style={{ height: 200, overflow: "auto" }}>
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

    </div>
  )
}
