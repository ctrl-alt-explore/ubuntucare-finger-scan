# Finger PPG – Heart Rate Detection via Webcam

This project uses a standard webcam and signal-processing techniques to detect heart rate (BPM) from fingertip photoplethysmography (PPG). Built with React and Vite, it captures real-time video, analyzes color variation in the fingertip, and displays pulse activity on a live chart.

## Tech Stack

- React (Vite)
- JavaScript (ES2020+)
- WebRTC (via react-webcam)
- Canvas API
- Custom signal processing

## Getting Started

Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/finger-ppg.git
cd finger-ppg
\`\`\`

Install dependencies:
\`\`\`bash
npm install
\`\`\`

Run the app:
\`\`\`bash
npm run dev
\`\`\`

Open in your browser:
\`\`\`
http://localhost:5173
\`\`\`

## How to Use

1. Place your fingertip directly over the webcam lens.
2. Ensure stable lighting conditions.
3. Click \"Start Monitoring\".
4. Observe the live BPM output.

## Features

- Real-time heart rate detection
- Signal visualization
- No backend required
- Basic waveform filtering

## Project Structure

\`\`\`
src/
├── components/
│ └── FingerScan.jsx
├── utils/
│ └── heartRateMonitor.js
├── App.jsx
├── main.jsx
└── style.css
\`\`\`

## Scientific Basis

The red color intensity from the webcam increases and decreases with blood volume changes in the finger. This signal is sampled and processed to estimate the time between beats, then converted to BPM.

## Disclaimer

This is not a medical device. Do not use it for diagnosis or clinical monitoring.
