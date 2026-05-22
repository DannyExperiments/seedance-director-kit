#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULTS = {
  fps: 4,
  width: 96,
  height: 54,
  threshold: 8,
};

function usage() {
  console.error(
    [
      "Usage: analyze_motion.cjs input.mp4 [output.json] [--fps N] [--width N] [--height N] [--threshold 0-255]",
      "",
      "Computes a lightweight frame-difference motion score for local review.",
      "It does not replace semantic critique; it flags likely static/tableau action clips.",
    ].join("\n"),
  );
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    fps: DEFAULTS.fps,
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    threshold: DEFAULTS.threshold,
  };

  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      usage();
      process.exit(0);
    }
    if (token.startsWith("--")) {
      const [key, inlineValue] = token.slice(2).split("=", 2);
      const value = inlineValue ?? argv[++i];
      if (value === undefined) fail(`Missing value for --${key}`, 2);
      if (!["fps", "width", "height", "threshold"].includes(key)) {
        fail(`Unknown option: --${key}`, 2);
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        fail(`Invalid numeric value for --${key}: ${value}`, 2);
      }
      args[key] = parsed;
    } else {
      positional.push(token);
    }
  }

  args.input = positional[0] ?? null;
  args.output = positional[1] ?? null;
  if (!args.input) {
    usage();
    fail("Missing input video.", 2);
  }
  return args;
}

function findBinary(name, fallback) {
  const candidates = [name, fallback].filter(Boolean);
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status === 0) return candidate;
  }
  return null;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.encoding ?? null,
    maxBuffer: options.maxBuffer ?? 128 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8")
      : String(result.stderr || "");
    fail(`${command} failed: ${stderr.trim() || `exit ${result.status}`}`);
  }
  return result.stdout;
}

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1));
  return sorted[idx];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function verdictFromScore(score) {
  if (score < 20) return "static";
  if (score < 40) return "weak";
  if (score < 65) return "moderate";
  return "strong";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = path.resolve(args.input);
  if (!fs.existsSync(input)) fail(`Input video not found: ${input}`, 2);

  const ffmpeg = findBinary("ffmpeg", "/opt/homebrew/bin/ffmpeg");
  if (!ffmpeg) fail("ffmpeg not found. Install ffmpeg or add it to PATH.");

  const width = Math.round(args.width);
  const height = Math.round(args.height);
  const fps = args.fps;
  const threshold = Math.round(args.threshold);
  const frameSize = width * height;

  const raw = run(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      input,
      "-vf",
      `fps=${fps},scale=${width}:${height},format=gray`,
      "-f",
      "rawvideo",
      "pipe:1",
    ],
    { maxBuffer: 256 * 1024 * 1024 },
  );

  const frameCount = Math.floor(raw.length / frameSize);
  if (frameCount < 2) {
    fail(`Not enough sampled frames for motion analysis: ${frameCount}`, 2);
  }

  const deltas = [];
  const activeRatios = [];

  for (let frame = 1; frame < frameCount; frame += 1) {
    const prevStart = (frame - 1) * frameSize;
    const currStart = frame * frameSize;
    let totalDiff = 0;
    let activePixels = 0;

    for (let i = 0; i < frameSize; i += 1) {
      const diff = Math.abs(raw[currStart + i] - raw[prevStart + i]);
      totalDiff += diff;
      if (diff >= threshold) activePixels += 1;
    }

    deltas.push(totalDiff / frameSize / 255);
    activeRatios.push(activePixels / frameSize);
  }

  const meanDelta = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const meanActive = activeRatios.reduce((sum, value) => sum + value, 0) / activeRatios.length;
  const medianDelta = percentile(deltas, 50);
  const p90Delta = percentile(deltas, 90);
  const peakActive = Math.max(...activeRatios);
  const lowMotionPairRatio = deltas.filter((value) => value < 0.01).length / deltas.length;

  const score = Math.round(
    clamp(meanDelta / 0.05, 0, 1) * 45
      + clamp(meanActive / 0.35, 0, 1) * 35
      + clamp(p90Delta / 0.08, 0, 1) * 20,
  );
  const verdict = verdictFromScore(score);

  const flags = [];
  if (verdict === "static" || verdict === "weak") flags.push("low_motion");
  if (lowMotionPairRatio >= 0.45) flags.push("tableau_risk");
  if (peakActive < 0.18) flags.push("low_peak_displacement");

  const report = {
    input,
    sampled: {
      fps,
      width,
      height,
      frames: frameCount,
      framePairs: deltas.length,
      pixelThreshold: threshold,
    },
    metrics: {
      meanFrameDelta: round(meanDelta),
      medianFrameDelta: round(medianDelta),
      p90FrameDelta: round(p90Delta),
      meanActivePixelRatio: round(meanActive),
      peakActivePixelRatio: round(peakActive),
      lowMotionPairRatio: round(lowMotionPairRatio),
    },
    motionScore: score,
    verdict,
    flags,
    interpretation:
      verdict === "static" || verdict === "weak"
        ? "Likely too static for action/trailer prompts unless the user explicitly wanted a held beauty shot."
        : "Motion amplitude is not obviously static; still review semantic action and prompt following manually.",
  };

  if (args.output) {
    const output = path.resolve(args.output);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
    report.output = output;
  }

  console.log(`Motion score: ${score}/100 (${verdict})`);
  console.log(`Mean delta: ${round(meanDelta)} | active pixels: ${round(meanActive)} | low-motion pairs: ${round(lowMotionPairRatio)}`);
  if (flags.length) console.log(`Flags: ${flags.join(", ")}`);
  if (report.output) console.log(`Saved: ${report.output}`);
}

main();
