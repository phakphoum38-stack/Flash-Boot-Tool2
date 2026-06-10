export default function FlashPanel({
  progress = 0,
  speed = 0,
  result,
  start
}) {

  return (
    <div className="panel">

      <button onClick={start}>
        🚀 START FLASH
      </button>

      <div>
        Progress: {(progress || 0).toFixed(1)}%
      </div>

      <div>
        Speed: {(speed || 0).toFixed(1)} MB/s
      </div>

      {result !== null && (
        <h3>
          {result
            ? "✅ SUCCESS"
            : "❌ FAILED"}
        </h3>
      )}

    </div>
  );
}
