export default function FlashPanel({
  progress = 0,
  speed = 0,
  result = null,
  start
}) {

  return (
    <div className="panel">

      <button onClick={start}>
        🚀 START FLASH
      </button>

      <div>
        Progress: {Number(progress).toFixed(1)}%
      </div>

      <div>
        Speed: {speed} MB/s
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
