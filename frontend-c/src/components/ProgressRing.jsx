export default function ProgressRing({ progress }) {

  return (
    <div className="ring">

      <h3>Progress</h3>

      <div style={{
        fontSize: "40px",
        color: "#00ffcc"
      }}>
        {progress.toFixed(1)}%
      </div>

    </div>
  )
}
