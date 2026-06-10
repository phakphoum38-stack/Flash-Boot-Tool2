import { useEffect, useState } from "react";

export default function SpeedGraph({
  speed = 0
}) {

  const [data, setData] =
    useState([]);

  useEffect(() => {

    setData(prev => {

      const next = [
        ...prev,
        Number(speed || 0)
      ];

      return next.slice(-20);

    });

  }, [speed]);

  return (
    <div className="panel">

      <h3>⚡ Speed (MB/s)</h3>

      <div style={{ display: "flex" }}>

        {data.map((s, i) => (

          <div
            key={i}
            style={{
              width: 10,
              height: Math.max(5, s * 2),
              background: "#00c3ff",
              margin: 1
            }}
          />

        ))}

      </div>

    </div>
  );
}
