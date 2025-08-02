import React, { useEffect, useRef, useState } from "react";
import { createHeartRateMonitor } from "./heartRateMonitor";
import "./style.css";

export default function FingerScan() {
  const bpmRef = useRef(null);
  const videoRef = useRef(null);
  const samplingCanvasRef = useRef(null);
  const graphCanvasRef = useRef(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitorRef = useRef(null);

  useEffect(() => {
    monitorRef.current = createHeartRateMonitor();

    monitorRef.current.initialize({
      videoElement: videoRef.current,
      samplingCanvas: samplingCanvasRef.current,
      graphCanvas: graphCanvasRef.current,
      graphColor:
        getComputedStyle(document.documentElement).getPropertyValue(
          "--graph-color"
        ) || "#2866eb",
      graphWidth: 6,
      onBpmChange: (bpm) => {
        if (bpmRef.current) bpmRef.current.innerText = bpm;
      },
    });

    return () => {
      if (monitorRef.current && isMonitoring) {
        monitorRef.current.toggleMonitoring();
      }
    };
  }, []);

  const toggleMonitoring = () => {
    if (monitorRef.current) {
      monitorRef.current.toggleMonitoring();
      setIsMonitoring((prev) => !prev);
    }
  };

  return (
    <div className="main-view">
      <header>
        <div>
          <h1>Heart Rate Monitor</h1>
          <small>Tap the circle to start / stop</small>
        </div>
      </header>

      <main>
        <section id="bpm-display-container" onClick={toggleMonitoring}>
          <div id="bpm-display">
            <output ref={bpmRef} title="Heart rate"></output>
            <label>bpm</label>
          </div>
        </section>

        <section id="graph-container">
          <canvas ref={graphCanvasRef}></canvas>
        </section>
      </main>

      {/* Hidden video + canvas for processing */}
      <video ref={videoRef} autoPlay muted playsInline />
      <canvas
        ref={samplingCanvasRef}
        width="400"
        height="400"
        className="visually-hidden"
      />
    </div>
  );
}
