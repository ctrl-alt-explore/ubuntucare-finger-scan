"use strict";

export function createHeartRateMonitor() {
  const IMAGE_WIDTH = 30;
  const IMAGE_HEIGHT = 30;
  const SAMPLE_BUFFER = [];
  const MAX_SAMPLES = 60 * 5;
  const START_DELAY = 1500;

  let ON_BPM_CHANGE;
  let VIDEO_ELEMENT;
  let SAMPLING_CANVAS;
  let GRAPH_CANVAS;
  let SAMPLING_CONTEXT;
  let GRAPH_CONTEXT;
  let GRAPH_COLOR;
  let GRAPH_WIDTH;
  let DEBUG = false;
  let VIDEO_STREAM;
  let MONITORING = false;

  const log = (...args) => {
    if (DEBUG) {
      console.log(...args);
      const debugLog = document.querySelector("#debug-log");
      if (debugLog) debugLog.innerHTML += args + "<br />";
    }
  };

  const averageBrightness = (canvas, context) => {
    const pixelData = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data;
    let sum = 0;
    for (let i = 0; i < pixelData.length; i += 4) {
      sum += pixelData[i] + pixelData[i + 1];
    }
    const avg = sum / (pixelData.length * 0.5);
    return avg / 255;
  };

  const handleResize = () => {
    log("handleResize", GRAPH_CANVAS.clientWidth, GRAPH_CANVAS.clientHeight);
    GRAPH_CANVAS.width = GRAPH_CANVAS.clientWidth;
    GRAPH_CANVAS.height = GRAPH_CANVAS.clientHeight;
  };

  const setBpmDisplay = (bpm) => {
    if (ON_BPM_CHANGE) ON_BPM_CHANGE(bpm);
  };

  const resetBuffer = () => {
    SAMPLE_BUFFER.length = 0;
  };

  const getCamera = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    return cameras[cameras.length - 1];
  };

  const startCameraStream = async (camera) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: camera.deviceId,
          facingMode: ["user", "environment"],
          width: { ideal: IMAGE_WIDTH },
          height: { ideal: IMAGE_HEIGHT },
          whiteBalanceMode: "manual",
          exposureMode: "manual",
          focusMode: "manual",
        },
      });
      return stream;
    } catch (error) {
      alert("Failed to access camera!\nError: " + error.message);
      return null;
    }
  };

  const setTorchStatus = async (stream, status) => {
    try {
      const track = stream.getVideoTracks()[0];
      await track.applyConstraints({ advanced: [{ torch: status }] });
    } catch (error) {
      alert(
        "Starting torch failed.\nError: " +
          "Torch not supported on this device."
      );
    }
  };

  const processFrame = () => {
    SAMPLING_CONTEXT.drawImage(VIDEO_ELEMENT, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    const value = averageBrightness(SAMPLING_CANVAS, SAMPLING_CONTEXT);
    const time = Date.now();

    SAMPLE_BUFFER.push({ value, time });
    if (SAMPLE_BUFFER.length > MAX_SAMPLES) SAMPLE_BUFFER.shift();

    const dataStats = analyzeData(SAMPLE_BUFFER);
    const bpm = calculateBpm(dataStats.crossings);

    if (bpm) setBpmDisplay(Math.round(bpm));
    drawGraph(dataStats);
  };

  const analyzeData = (samples) => {
    const average =
      samples.reduce((sum, s) => sum + s.value, 0) / samples.length;

    let min = samples[0].value;
    let max = samples[0].value;

    samples.forEach((sample) => {
      if (sample.value > max) max = sample.value;
      if (sample.value < min) min = sample.value;
    });

    const range = max - min;
    const crossings = getAverageCrossings(samples, average);

    return { average, min, max, range, crossings };
  };

  const getAverageCrossings = (samples, average) => {
    const crossingsSamples = [];
    let previousSample = samples[0];

    samples.forEach((currentSample) => {
      if (currentSample.value < average && previousSample.value > average) {
        crossingsSamples.push(currentSample);
      }
      previousSample = currentSample;
    });

    return crossingsSamples;
  };

  const calculateBpm = (samples) => {
    if (samples.length < 2) return null;
    const averageInterval =
      (samples[samples.length - 1].time - samples[0].time) /
      (samples.length - 1);
    return 60000 / averageInterval;
  };

  const drawGraph = (dataStats) => {
    const xScaling = GRAPH_CANVAS.width / MAX_SAMPLES;
    const xOffset = (MAX_SAMPLES - SAMPLE_BUFFER.length) * xScaling;

    GRAPH_CONTEXT.lineWidth = GRAPH_WIDTH;
    GRAPH_CONTEXT.strokeStyle = GRAPH_COLOR;
    GRAPH_CONTEXT.lineCap = "round";
    GRAPH_CONTEXT.lineJoin = "round";

    GRAPH_CONTEXT.clearRect(0, 0, GRAPH_CANVAS.width, GRAPH_CANVAS.height);
    GRAPH_CONTEXT.beginPath();

    const maxHeight = GRAPH_CANVAS.height - GRAPH_CONTEXT.lineWidth * 2;
    let previousY = 0;

    SAMPLE_BUFFER.forEach((sample, i) => {
      const x = xScaling * i + xOffset;
      let y = GRAPH_CONTEXT.lineWidth;

      if (sample.value !== 0) {
        y =
          (maxHeight * (sample.value - dataStats.min)) /
            (dataStats.max - dataStats.min) +
          GRAPH_CONTEXT.lineWidth;
      }

      if (y !== previousY) {
        GRAPH_CONTEXT.lineTo(x, y);
      }

      previousY = y;
    });

    GRAPH_CONTEXT.stroke();
  };

  const monitorLoop = () => {
    processFrame();
    if (MONITORING) window.requestAnimationFrame(monitorLoop);
  };

  const startMonitoring = async () => {
    resetBuffer();
    handleResize();
    setBpmDisplay("");

    const camera = await getCamera();
    VIDEO_STREAM = await startCameraStream(camera);

    if (!VIDEO_STREAM) {
      throw new Error("Unable to start video stream");
    }

    try {
      await setTorchStatus(VIDEO_STREAM, true);
    } catch (e) {
      alert("Error:" + e);
    }

    SAMPLING_CANVAS.width = IMAGE_WIDTH;
    SAMPLING_CANVAS.height = IMAGE_HEIGHT;
    VIDEO_ELEMENT.srcObject = VIDEO_STREAM;
    VIDEO_ELEMENT.play();
    MONITORING = true;

    log("Waiting before starting mainloop...");
    setTimeout(() => {
      log("Starting mainloop...");
      monitorLoop();
    }, START_DELAY);
  };

  const stopMonitoring = async () => {
    await setTorchStatus(VIDEO_STREAM, false);
    if (VIDEO_ELEMENT) {
      VIDEO_ELEMENT.pause();
      VIDEO_ELEMENT.srcObject = null;
    }
    MONITORING = false;
  };

  const initialize = (config) => {
    VIDEO_ELEMENT = config.videoElement;
    SAMPLING_CANVAS = config.samplingCanvas;
    GRAPH_CANVAS = config.graphCanvas;
    GRAPH_COLOR = config.graphColor || "#2866eb";
    GRAPH_WIDTH = config.graphWidth || 6;
    ON_BPM_CHANGE = config.onBpmChange;

    SAMPLING_CONTEXT = SAMPLING_CANVAS.getContext("2d");
    GRAPH_CONTEXT = GRAPH_CANVAS.getContext("2d");

    if (!navigator.mediaDevices) {
      alert(
        "Sorry, your browser doesn't support camera access which is required by this app."
      );
      return false;
    }

    window.addEventListener("resize", handleResize);
    handleResize();
  };

  return {
    initialize,
    toggleMonitoring: () => {
      if (MONITORING) stopMonitoring();
      else startMonitoring();
    },
  };
}
