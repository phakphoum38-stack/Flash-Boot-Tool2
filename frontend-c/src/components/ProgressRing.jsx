export default function ProgressRing({
  progress = 0
}) {

  return (
    <div className="ring">

      <h3>Progress</h3>

      <div
        style={{
          fontSize: "40px",
          color: "#00ffcc"
        }}
      >
        {(progress || 0).toFixed(1)}%
      </div>

    </div>
  );
}
