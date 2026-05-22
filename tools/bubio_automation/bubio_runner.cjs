#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { chromium } = require("playwright");

const BUBIO_STUDIO_URL = "https://bubio.ai/studio";
const DEFAULT_AUTH_DIR = path.join(os.homedir(), ".codex", "bubio-automation");
const DEFAULT_STATE_FILE = path.join(DEFAULT_AUTH_DIR, "bubio-storage-state.json");
const DEFAULT_CLONE_ROOT = path.join(DEFAULT_AUTH_DIR, "chrome-clone");
const CHROME_ROOT = path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), "output", "seedance-bubio", "automation-downloads");
const DEFAULT_DISCOVERY_DIR = path.join(process.cwd(), "output", "seedance-bubio", "api-discovery");
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_OBSERVE_MS = 15000;

function printHelp() {
  console.log(`Bubio runner

Usage:
  bubio_runner.sh doctor
  bubio_runner.sh capture-auth [--state-file FILE]
  bubio_runner.sh bootstrap-auth-from-profile [--chrome-profile-dir DIR]
  bubio_runner.sh inspect-studio [--state-file FILE] [--artifact-dir DIR]
  bubio_runner.sh discover-api [--state-file FILE] [--artifact-dir DIR] [--observe-ms N] [--exercise-form]
  bubio_runner.sh download-latest [--output-dir DIR] [--download-name NAME] [--prompt-file FILE|--prompt TEXT]
  bubio_runner.sh generate [options]

Common options:
  --state-file FILE      Storage-state file. Default: ${DEFAULT_STATE_FILE}
  --chrome-profile-dir   Chrome profile directory name, e.g. "Default" or "Profile 1"
  --headed               Force a visible Chrome window.
  --headless             Run hidden. Use only after auth is already captured.
  --timeout-ms N         Overall wait timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --observe-ms N         API discovery observation window. Default: ${DEFAULT_OBSERVE_MS}
  --exercise-form        In discover-api mode, fill prompt/settings/refs but do not submit.

Generate options:
  --prompt TEXT          Prompt text.
  --prompt-file FILE     Read prompt text from a file.
  --model TEXT           Model label. Default: Seedance 2
  --mode TEXT            Create or Extend. Default: Create
  --aspect TEXT          Ratio like 16:9, 9:16, or 1:1.
  --duration N           Seconds, adjusted with Bubio's +/- controls.
  --sound on|off         Toggle sound.
  --ref FILE             Attach one reference file. Repeatable.
  --refs A,B,C           Comma-separated reference files.
  --output-dir DIR       Download directory. Default: ${DEFAULT_OUTPUT_DIR}
  --download-name NAME   Final MP4 filename.
  --prefix-first-frame   Prefix prompt with "Use @ref1 as the exact first frame."
  --dry-run              Fill the form and stop before clicking Generate.
  --submit-only          Submit the job, save submit evidence, and exit without waiting.

Examples:
  bubio_runner.sh capture-auth
  bubio_runner.sh bootstrap-auth-from-profile --chrome-profile-dir "Default"
  bubio_runner.sh inspect-studio
  bubio_runner.sh discover-api --headless --observe-ms 15000
  bubio_runner.sh download-latest --prompt-file prompt.txt --download-name latest.mp4
  bubio_runner.sh generate --prompt-file prompt.txt --aspect 16:9 --duration 15 --sound on
  bubio_runner.sh generate --prompt "..." --ref frame.png --prefix-first-frame
`);
}

function fail(message, code = 1) {
  console.error(`ERROR: ${message}`);
  process.exit(code);
}

function logStep(message) {
  console.log(`[bubio-runner] ${message}`);
}

function expandHome(input) {
  if (!input) {
    return input;
  }
  if (input === "~") {
    return os.homedir();
  }
  if (input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

function parseArgs(argv) {
  const positionals = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2);
    if (["headed", "headless", "prefix-first-frame", "help", "dry-run", "exercise-form", "submit-only"].includes(key)) {
      options[key] = true;
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      fail(`Missing value for --${key}`);
    }
    if (key === "ref") {
      if (!options.ref) {
        options.ref = [];
      }
      options.ref.push(next);
    } else {
      options[key] = next;
    }
    i += 1;
  }
  return {
    command: positionals[0] || "help",
    options,
  };
}

function ensureSecureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  try {
    fs.chmodSync(dirPath, 0o700);
  } catch (error) {
    // chmod can fail on some filesystems; keep going.
  }
}

function removeDirIfExists(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function lockFile(filePath) {
  try {
    fs.chmodSync(filePath, 0o600);
  } catch (error) {
    // Best effort only.
  }
}

function detectLikelyChromeProfileDir() {
  if (!fs.existsSync(CHROME_ROOT)) {
    return "Default";
  }
  const entries = fs.readdirSync(CHROME_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  if (entries.includes("Default")) {
    return "Default";
  }
  const profileDirs = entries
    .filter((name) => /^Profile \d+$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return profileDirs[0] || "Default";
}

function readOptionalPrompt(options) {
  let prompt = options.prompt || "";
  if (options["prompt-file"]) {
    const promptPath = path.resolve(expandHome(options["prompt-file"]));
    prompt = fs.readFileSync(promptPath, "utf8");
  }
  prompt = prompt.trim();
  if (prompt && options["prefix-first-frame"]) {
    const prefix = "REF MAP: @ref1 = exact opening first frame / primary visual reference.\nUse @ref1 as the exact first frame.";
    if (!/@\s*ref\s*1\b/i.test(prompt)) {
      prompt = `${prefix}\n\n${prompt}`;
    }
  }
  return prompt;
}

function readPrompt(options) {
  const prompt = readOptionalPrompt(options);
  if (!prompt) {
    fail("No prompt provided. Use --prompt or --prompt-file.");
  }
  return prompt;
}

function hasExplicitRefMention(prompt, index) {
  const oneBased = index + 1;
  const patterns = [
    new RegExp(`@\\s*ref\\s*${oneBased}\\b`, "i"),
    new RegExp(`@\\s*image\\s*${oneBased}\\b`, "i"),
    new RegExp(`\\bimage\\s*${oneBased}\\b`, "i"),
    new RegExp(`\\[\\s*image\\s*${oneBased}\\s*\\]`, "i"),
  ];
  return patterns.some((pattern) => pattern.test(prompt));
}

function warnAboutImplicitRefs(prompt, refs) {
  if (!refs.length) {
    return;
  }
  const missing = refs
    .map((_, index) => index)
    .filter((index) => !hasExplicitRefMention(prompt, index));
  if (!missing.length) {
    return;
  }
  const names = missing.map((index) => `@ref${index + 1}`).join(", ");
  console.warn(`WARNING: ${refs.length} reference file(s) attached, but prompt does not explicitly mention ${names}. Seedance/Bubio often follows refs better when each uploaded image is bound by token and role.`);
}

function resolveFiles(options) {
  const refs = [];
  for (const item of options.ref || []) {
    refs.push(item);
  }
  if (options.refs) {
    for (const item of options.refs.split(",")) {
      if (item.trim()) {
        refs.push(item.trim());
      }
    }
  }
  return refs.map((item) => {
    const filePath = path.resolve(expandHome(item));
    if (!fs.existsSync(filePath)) {
      fail(`Reference file not found: ${filePath}`);
    }
    return filePath;
  });
}

function waitForEnter(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

function authRecoveryMessage(stateFile) {
  const scriptPath = path.join(__dirname, "bubio_runner.sh");
  const statePart = stateFile ? ` --state-file "${stateFile}"` : "";
  return [
    "Bubio is logged out or the saved session expired.",
    "Run this exact command; it opens a visible Chrome window:",
    `zsh "${scriptPath}" capture-auth${statePart}`,
    "Log into Bubio Studio in that opened Chrome window, return to the terminal, and press Enter to save the session.",
    "Then rerun the generation command.",
  ].join("\n");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function launchContext({
  stateFile,
  headed,
  outputDir,
  deferGoto,
}) {
  logStep(`Launching Chrome (${headed ? "headed" : "headless"})`);
  const browser = await chromium.launch({
    channel: "chrome",
    headless: !headed,
  });
  const contextOptions = {
    acceptDownloads: true,
    viewport: { width: 1480, height: 1100 },
  };
  if (stateFile && fs.existsSync(stateFile)) {
    contextOptions.storageState = stateFile;
  }
  const context = await browser.newContext(contextOptions);
  context.setDefaultTimeout(15000);
  const page = await context.newPage();
  if (!deferGoto) {
    logStep("Opening Bubio studio");
    await page.goto(BUBIO_STUDIO_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  if (outputDir) {
    ensureSecureDir(outputDir);
  }
  return { browser, context, page };
}

function redactPathname(pathname) {
  return pathname.split("/").map((segment) => {
    if (!segment) {
      return segment;
    }
    const decoded = decodeURIComponent(segment);
    const ext = path.extname(decoded).toLowerCase();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(decoded)) {
      return "[uuid]";
    }
    if (/^[0-9a-f]{24,}$/i.test(decoded)) {
      return "[hex]";
    }
    if (ext && decoded.length > 36) {
      return `[file${ext}]`;
    }
    if (decoded.length > 80) {
      return "[long]";
    }
    return segment;
  }).join("/");
}

function sanitizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const pathname = redactPathname(url.pathname);
    return {
      url: `${url.origin}${pathname}`,
      origin: url.origin,
      host: url.host,
      pathname,
      queryRedacted: Boolean(url.search),
    };
  } catch (error) {
    return {
      url: "[invalid-url]",
      origin: "",
      host: "",
      pathname: "",
      queryRedacted: false,
    };
  }
}

function pickSafeHeaders(headers) {
  const safe = {};
  for (const key of ["accept", "content-type"]) {
    if (headers[key]) {
      safe[key] = headers[key].slice(0, 160);
    }
  }
  return safe;
}

function summarizeJsonShape(value, depth = 0) {
  if (value === null) {
    return { type: "null" };
  }
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      sample: value.length > 0 && depth < 2 ? summarizeJsonShape(value[0], depth + 1) : undefined,
    };
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).slice(0, 40);
    const children = {};
    if (depth < 2) {
      for (const key of keys.slice(0, 12)) {
        children[key] = summarizeJsonShape(value[key], depth + 1);
      }
    }
    return {
      type: "object",
      keys,
      children: Object.keys(children).length ? children : undefined,
    };
  }
  if (typeof value === "string") {
    return { type: "string", length: value.length };
  }
  return { type: typeof value };
}

function summarizePostData(request) {
  const data = request.postData();
  if (!data) {
    return null;
  }
  const headers = request.headers();
  const contentType = headers["content-type"] || "";
  const bytes = Buffer.byteLength(data);

  if (/json/i.test(contentType) && bytes < 200000) {
    try {
      return {
        kind: "json",
        bytes,
        shape: summarizeJsonShape(JSON.parse(data)),
      };
    } catch (error) {
      return { kind: "json-unparsed", bytes };
    }
  }

  if (/x-www-form-urlencoded/i.test(contentType) && bytes < 200000) {
    return {
      kind: "form-url-encoded",
      bytes,
      fields: Array.from(new URLSearchParams(data).keys()).slice(0, 40),
    };
  }

  if (/multipart\/form-data/i.test(contentType)) {
    const fields = Array.from(data.matchAll(/name="([^"]+)"/g))
      .map((match) => match[1])
      .filter((field, index, list) => list.indexOf(field) === index)
      .slice(0, 40);
    return {
      kind: "multipart-form-data",
      bytes,
      fields,
    };
  }

  return {
    kind: "raw",
    bytes,
    contentType: contentType || undefined,
  };
}

function isLikelyApiEvent(event) {
  if (["xhr", "fetch"].includes(event.resourceType)) {
    return true;
  }
  if (/json/i.test(event.contentType || "")) {
    return true;
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(event.method)) {
    return true;
  }
  if (/api\.bubio\.ai/i.test(event.host) && /\/auth\/|\/functions\/|\/rest\/|\/rpc\//i.test(event.pathname)) {
    return true;
  }
  if (/supabase\.co/i.test(event.host) && /\/auth\/|\/functions\/|\/rest\/|\/rpc\//i.test(event.pathname)) {
    return true;
  }
  if (/\/api\/|\/graphql|\/rpc\//i.test(event.pathname)) {
    return true;
  }
  return false;
}

function isFirstPartyBubioEvent(event) {
  return /(^|\.)bubio\.ai$/i.test(event.host) || /supabase\.co$/i.test(event.host);
}

function createNetworkRecorder(page) {
  const events = [];
  const pending = [];
  const requestIds = new Map();
  let nextId = 1;

  page.on("request", (request) => {
    const requestId = nextId;
    nextId += 1;
    requestIds.set(request, requestId);
    const safeUrl = sanitizeUrl(request.url());
    events.push({
      phase: "request",
      id: requestId,
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: safeUrl.url,
      host: safeUrl.host,
      pathname: safeUrl.pathname,
      queryRedacted: safeUrl.queryRedacted,
      resourceType: request.resourceType(),
      headers: pickSafeHeaders(request.headers()),
      postData: summarizePostData(request),
    });
  });

  page.on("response", (response) => {
    const task = (async () => {
      const request = response.request();
      const safeUrl = sanitizeUrl(response.url());
      const headers = response.headers();
      const contentType = headers["content-type"] || "";
      const contentLength = Number.parseInt(headers["content-length"] || "0", 10);
      const event = {
        phase: "response",
        id: requestIds.get(request) || null,
        timestamp: new Date().toISOString(),
        method: request.method(),
        status: response.status(),
        url: safeUrl.url,
        host: safeUrl.host,
        pathname: safeUrl.pathname,
        queryRedacted: safeUrl.queryRedacted,
        resourceType: request.resourceType(),
        contentType,
        contentLength: Number.isFinite(contentLength) && contentLength > 0 ? contentLength : undefined,
      };

      if (/json/i.test(contentType) && (!contentLength || contentLength < 300000)) {
        try {
          event.jsonShape = summarizeJsonShape(await response.json());
        } catch (error) {
          event.jsonShape = { type: "unavailable" };
        }
      }
      events.push(event);
    })();
    pending.push(task);
    task.catch(() => {}).finally(() => {
      const index = pending.indexOf(task);
      if (index >= 0) {
        pending.splice(index, 1);
      }
    });
  });

  return {
    events,
    async flush() {
      await Promise.allSettled(pending);
    },
    buildSummary(meta) {
      const endpointMap = new Map();
      for (const event of events) {
        if (event.phase !== "response") {
          continue;
        }
        const key = `${event.method} ${event.host}${event.pathname}`;
        if (!endpointMap.has(key)) {
          endpointMap.set(key, {
            method: event.method,
            host: event.host,
            pathname: event.pathname,
            count: 0,
            statuses: {},
            resourceTypes: {},
            contentTypes: {},
            likelyApi: false,
            firstParty: false,
          });
        }
        const endpoint = endpointMap.get(key);
        endpoint.count += 1;
        endpoint.statuses[event.status] = (endpoint.statuses[event.status] || 0) + 1;
        endpoint.resourceTypes[event.resourceType] = (endpoint.resourceTypes[event.resourceType] || 0) + 1;
        if (event.contentType) {
          const shortType = event.contentType.split(";")[0];
          endpoint.contentTypes[shortType] = (endpoint.contentTypes[shortType] || 0) + 1;
        }
        endpoint.likelyApi = endpoint.likelyApi || isLikelyApiEvent(event);
        endpoint.firstParty = endpoint.firstParty || isFirstPartyBubioEvent(event);
      }

      const endpoints = Array.from(endpointMap.values())
        .sort((a, b) => Number(b.likelyApi) - Number(a.likelyApi) || b.count - a.count || `${a.host}${a.pathname}`.localeCompare(`${b.host}${b.pathname}`));

      return {
        ...meta,
        redaction: {
          queryStrings: "removed",
          authHeaders: "not captured",
          cookies: "not captured",
          requestBodies: "shape only",
          responseBodies: "JSON key shape only",
          longPathSegments: "redacted",
        },
        endpoints,
        apiCandidates: endpoints.filter((endpoint) => endpoint.likelyApi),
        firstPartyApiCandidates: endpoints.filter((endpoint) => endpoint.likelyApi && endpoint.firstParty),
        events,
      };
    },
  };
}

function statusSummary(statuses) {
  return Object.entries(statuses)
    .map(([status, count]) => `${status}x${count}`)
    .join(",");
}

async function launchPersistentChrome({
  userDataDir,
  headed,
  profileDirName,
}) {
  logStep(`Launching persistent Chrome clone (${headed ? "headed" : "headless"})`);
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless: !headed,
    viewport: { width: 1480, height: 1100 },
    acceptDownloads: true,
    args: profileDirName ? [`--profile-directory=${profileDirName}`] : [],
  });
  context.setDefaultTimeout(15000);
  const page = context.pages()[0] || (await context.newPage());
  logStep("Opening Bubio studio in persistent context");
  await page.goto(BUBIO_STUDIO_URL, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  return { context, page };
}

async function getVisiblePromptTextbox(page) {
  const composerBoxes = page.locator('div[role="textbox"][contenteditable="true"]');
  const composerCount = await composerBoxes.count().catch(() => 0);
  for (let i = composerCount - 1; i >= 0; i -= 1) {
    const candidate = composerBoxes.nth(i);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }

  const textboxes = page.getByRole("textbox");
  const count = await textboxes.count();
  for (let i = count - 1; i >= 0; i -= 1) {
    const candidate = textboxes.nth(i);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }
  fail("Could not find a visible Bubio prompt textbox.");
}

async function studioLooksReady(page) {
  const generateVisible = await page.locator("button").filter({ hasText: /^Generate/ }).first().isVisible().catch(() => false);
  const composerTextboxVisible = await page.locator('div[role="textbox"][contenteditable="true"]').first().isVisible().catch(() => false);
  return generateVisible || composerTextboxVisible;
}

async function enterComposerIfNeeded(page) {
  if (await studioLooksReady(page)) {
    return;
  }

  const createButton = page.getByRole("button", { name: /^Create$/i }).first();
  if (await createButton.isVisible().catch(() => false)) {
    logStep("Authenticated home detected; entering composer");
    await createButton.click();
    await sleep(800);
    await page.waitForLoadState("networkidle").catch(() => {});
  }
}

async function enterVideoModeIfNeeded(page) {
  const topVideoButton = page.locator("button").filter({ hasText: /^Video$/ }).first();
  const imageModeMarker = page.locator("button").filter({ hasText: /^Nano Banana 2$/ }).first();
  const soundControl = page.locator("button").filter({ hasText: /Sound on|Sound off/i }).first();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await soundControl.isVisible().catch(() => false)) {
      return;
    }
    if (!(await topVideoButton.isVisible().catch(() => false))) {
      return;
    }
    logStep("Switching creator shell to Video mode");
    await topVideoButton.click({ force: true });
    await sleep(1000);
    await page.waitForLoadState("networkidle").catch(() => {});
    if (!(await imageModeMarker.isVisible().catch(() => false))) {
      return;
    }
  }
}

async function ensureLoggedIn(page, stateFile) {
  const url = page.url();
  if (/login|signin|auth/i.test(url)) {
    fail(authRecoveryMessage(stateFile));
  }
  await enterComposerIfNeeded(page);
  await enterVideoModeIfNeeded(page);
  const ready = await studioLooksReady(page);
  if (!ready) {
    fail(authRecoveryMessage(stateFile));
  }
}

async function fillPrompt(page, prompt) {
  const textbox = await getVisiblePromptTextbox(page);
  await textbox.click();
  await textbox.evaluate((el, value) => {
    const node = el;
    node.focus();
    if (node.isContentEditable) {
      node.textContent = value;
      node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if ("value" in node) {
      node.value = value;
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, prompt);
  await sleep(200);
}

async function maybeSelectButton(page, buttonText) {
  const button = page.getByRole("button", { name: new RegExp(`^${escapeRegex(buttonText)}$`, "i") }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click({ force: true }).catch(() => {});
    return true;
  }
  const textNode = page.getByText(buttonText, { exact: true }).first();
  if (await textNode.isVisible().catch(() => false)) {
    await textNode.click({ force: true }).catch(() => {});
    return true;
  }
  return false;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureModel(page, desiredModel) {
  if (!desiredModel) {
    return;
  }
  const modelButtons = page.locator("button").filter({
    hasText: /Seedance|Kling|Sora|Veo|Runway|PixVerse|Hailuo|Luma/i,
  });
  const count = await modelButtons.count().catch(() => 0);
  let likelyCurrentModel = null;
  for (let i = 0; i < count; i += 1) {
    const candidate = modelButtons.nth(i);
    if (!(await candidate.isVisible().catch(() => false))) {
      continue;
    }
    const box = await candidate.boundingBox().catch(() => null);
    if (box && box.y > 800) {
      likelyCurrentModel = candidate;
      break;
    }
  }
  if (!likelyCurrentModel && count > 0) {
    likelyCurrentModel = modelButtons.first();
  }

  if (likelyCurrentModel && await likelyCurrentModel.isVisible().catch(() => false)) {
    const currentText = ((await likelyCurrentModel.innerText().catch(() => "")) || "").trim();
    if (currentText.toLowerCase().includes(desiredModel.toLowerCase())) {
      return;
    }
    await likelyCurrentModel.click({ force: true }).catch(() => {});
    await sleep(700);
  }

  const picked = await maybeSelectButton(page, desiredModel);
  if (!picked) {
    logStep(`Model control for ${desiredModel} was not exposed; continuing with current model selection`);
  }
}

async function ensureMode(page, desiredMode) {
  if (!desiredMode) {
    return;
  }
  const normalized = desiredMode.trim().toLowerCase();
  const label = normalized === "extend" ? "Extend" : "Create";
  await maybeSelectButton(page, label);
}

async function ensureAspect(page, desiredAspect) {
  if (!desiredAspect) {
    return;
  }
  async function findCurrentAspectButton() {
    const aspectButtons = page.getByRole("button", { name: /^(1:1|16:9|9:16|4:3|3:4|21:9|9:21)$/ });
    const count = await aspectButtons.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = aspectButtons.nth(i);
      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }
      const box = await candidate.boundingBox().catch(() => null);
      if (box && box.y > 800 && box.width < 120) {
        return candidate;
      }
    }
    return null;
  }

  const current = await findCurrentAspectButton();
  if (!current) {
    return;
  }
  const currentText = (await current.innerText().catch(() => "")).trim();
  if (currentText === desiredAspect) {
    return;
  }
  const currentBox = await current.boundingBox().catch(() => null);
  await current.click({ force: true });
  await sleep(250);

  const optionButtons = page.locator("button");
  const optionCount = await optionButtons.count().catch(() => 0);
  let option = null;
  for (let i = 0; i < optionCount; i += 1) {
    const candidate = optionButtons.nth(i);
    if (!(await candidate.isVisible().catch(() => false))) {
      continue;
    }
    const text = ((await candidate.innerText().catch(() => "")) || "").trim();
    if (text !== desiredAspect) {
      continue;
    }
    const box = await candidate.boundingBox().catch(() => null);
    if (box && box.width > 100 && (!currentBox || box.y < currentBox.y + 20)) {
      option = candidate;
      break;
    }
  }
  if (!option) {
    fail(`Could not select aspect ratio ${desiredAspect}.`);
  }
  await option.click({ force: true });
  await sleep(300);

  const verified = await findCurrentAspectButton();
  const verifiedText = verified ? (await verified.innerText().catch(() => "")).trim() : "";
  if (verifiedText !== desiredAspect) {
    fail(`Aspect ratio verification failed: expected ${desiredAspect}, found ${verifiedText || "unknown"}.`);
  }
}

async function readDurationLabel(page) {
  const labels = page.getByText(/^\d+s$/, { exact: true });
  const count = await labels.count();
  for (let i = count - 1; i >= 0; i -= 1) {
    const label = labels.nth(i);
    if (await label.isVisible().catch(() => false)) {
      const text = (await label.innerText()).trim();
      const parsed = Number.parseInt(text.replace("s", ""), 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

async function ensureDuration(page, desiredDuration) {
  if (!desiredDuration) {
    return;
  }
  const target = Number.parseInt(String(desiredDuration), 10);
  if (!Number.isFinite(target)) {
    fail(`Invalid duration: ${desiredDuration}`);
  }
  const minusButton = page.getByRole("button", { name: "−" }).last();
  const plusButton = page.getByRole("button", { name: "+" }).last();
  if (!(await plusButton.isVisible().catch(() => false))) {
    return;
  }
  for (let i = 0; i < 20; i += 1) {
    const current = await readDurationLabel(page);
    if (current === null) {
      return;
    }
    if (current === target) {
      return;
    }
    if (current < target) {
      await plusButton.click({ force: true });
    } else {
      await minusButton.click({ force: true });
    }
    await sleep(150);
  }
  fail(`Could not adjust duration to ${target}s.`);
}

async function ensureSound(page, desiredSound) {
  if (!desiredSound) {
    return;
  }
  const current = page.getByRole("button", { name: /Sound on|Sound off/i }).first();
  if (!(await current.isVisible().catch(() => false))) {
    return;
  }
  const currentText = (await current.innerText().catch(() => "")).trim().toLowerCase();
  const wantOn = desiredSound.trim().toLowerCase() === "on";
  const isOn = currentText.includes("on");
  if (wantOn !== isOn) {
    await current.click({ force: true });
  }
}

async function tryAttachFiles(page, files) {
  if (!files.length) {
    return false;
  }
  const inputs = page.locator('input[type="file"]');
  const inputCount = await inputs.count().catch(() => 0);
  if (inputCount > 0) {
    await inputs.first().setInputFiles(files);
    return true;
  }

  const promptTextbox = await getVisiblePromptTextbox(page);
  const promptBox = await promptTextbox.boundingBox();
  if (!promptBox) {
    return false;
  }

  const buttons = page.locator("button");
  const count = await buttons.count();
  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i);
    if (!(await button.isVisible().catch(() => false))) {
      continue;
    }
    const box = await button.boundingBox().catch(() => null);
    if (!box) {
      continue;
    }
    if (box.x < promptBox.x && Math.abs(box.y - promptBox.y) < 100 && box.width < 80 && box.height < 80) {
      const chooserPromise = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
      await button.click();
      const chooser = await chooserPromise;
      if (chooser) {
        await chooser.setFiles(files);
        return true;
      }
    }
  }
  return false;
}

async function waitForFreshDownloadTarget(page, previousCount, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const count = await page.getByText("Download", { exact: true }).count().catch(() => 0);
    if (count > previousCount) {
      return true;
    }
    await sleep(1500);
  }
  return false;
}

async function clickTopDownload(page) {
  const cardCandidates = page.locator('div[class*="cv-auto"][class*="group"][class*="rounded-xl"]');
  const cardCount = await cardCandidates.count().catch(() => 0);
  for (let i = 0; i < Math.min(cardCount, 5); i += 1) {
    const card = cardCandidates.nth(i);
    if (!(await card.isVisible().catch(() => false))) {
      continue;
    }
    await card.hover().catch(() => {});
    await sleep(250);
    const cardDownload = card.getByText("Download", { exact: true }).first();
    if (await cardDownload.isVisible().catch(() => false)) {
      await cardDownload.click({ force: true });
      return true;
    }
  }

  const downloadText = page.getByText("Download", { exact: true });
  const count = await downloadText.count().catch(() => 0);
  for (let i = 0; i < count; i += 1) {
    const item = downloadText.nth(i);
    if (await item.isVisible().catch(() => false)) {
      await item.click({ force: true });
      return true;
    }
  }
  return false;
}

function isStudioResultVideoUrl(url) {
  return /\/studio\/videos\/.+\.mp4/i.test(url);
}

function promptMatchScore(text, prompt) {
  if (!text || !prompt) {
    return 0;
  }
  const normalizedText = text.toLowerCase();
  const words = Array.from(new Set(
    prompt.toLowerCase()
      .replace(/[^a-z0-9\s-]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 6)
      .slice(0, 80),
  ));
  let score = 0;
  for (const word of words) {
    if (normalizedText.includes(word)) {
      score += 1;
    }
  }
  return score;
}

function rankVideoCandidates(candidates, prompt) {
  return candidates.slice().sort((a, b) => {
    const promptDiff = promptMatchScore(b.cardText, prompt) - promptMatchScore(a.cardText, prompt);
    if (promptDiff !== 0) {
      return promptDiff;
    }
    const visibleDiff = Number(b.visible) - Number(a.visible);
    if (visibleDiff !== 0) {
      return visibleDiff;
    }
    const areaDiff = (b.area || 0) - (a.area || 0);
    if (areaDiff !== 0) {
      return areaDiff;
    }
    const yDiff = (a.y ?? 999999) - (b.y ?? 999999);
    if (yDiff !== 0) {
      return yDiff;
    }
    return (a.x ?? 999999) - (b.x ?? 999999);
  });
}

async function getStudioVideoCandidatesFromPage(page) {
  const candidates = await page.evaluate(() => {
    function cleanUrl(url) {
      return (url || "").replace(/#t=.*$/i, "");
    }

    function nodeUrl(node) {
      if ("currentSrc" in node && node.currentSrc) {
        return cleanUrl(node.currentSrc);
      }
      return cleanUrl(node.src || "");
    }

    function hostVideoNode(node) {
      if (node.tagName && node.tagName.toLowerCase() === "source" && node.parentElement) {
        return node.parentElement;
      }
      return node;
    }

    function visibleData(node) {
      const host = hostVideoNode(node);
      const rect = host.getBoundingClientRect();
      const style = window.getComputedStyle(host);
      const visible = rect.width > 80 && rect.height > 80 && style.visibility !== "hidden" && style.display !== "none";
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        area: Math.round(rect.width * rect.height),
        visible,
      };
    }

    function surroundingText(node) {
      let current = hostVideoNode(node);
      let best = "";
      for (let i = 0; i < 8 && current; i += 1) {
        const text = ((current.innerText || current.textContent || "")).replace(/\s+/g, " ").trim();
        if (text.length > best.length) {
          best = text.slice(0, 1600);
        }
        current = current.parentElement;
      }
      return best;
    }

    return Array.from(document.querySelectorAll("video, source"))
      .map((node) => {
        return {
          url: nodeUrl(node),
          cardText: surroundingText(node),
          ...visibleData(node),
        };
      })
      .filter((candidate) => candidate.url);
  });

  const unique = new Map();
  for (const candidate of candidates) {
    if (!isStudioResultVideoUrl(candidate.url)) {
      continue;
    }
    if (!unique.has(candidate.url)) {
      unique.set(candidate.url, candidate);
    }
  }
  return Array.from(unique.values());
}

async function getLatestVideoUrlFromPage(page, prompt) {
  const candidates = rankVideoCandidates(await getStudioVideoCandidatesFromPage(page), prompt);
  const signedStudioVideo = candidates[0];
  if (!signedStudioVideo) {
    return null;
  }
  return signedStudioVideo.url;
}

async function getStudioVideoUrlsFromPage(page) {
  const candidates = await getStudioVideoCandidatesFromPage(page);
  return Array.from(new Set(candidates.map((candidate) => candidate.url)));
}

async function nudgeResultViewport(page, attempt) {
  if (attempt < 45) {
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  } else if (attempt % 2 === 0) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.25)).catch(() => {});
  } else {
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  }
}

async function waitForFreshVideoUrl(page, previousUrls, timeoutMs, prompt) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeoutMs) {
    const candidates = rankVideoCandidates(await getStudioVideoCandidatesFromPage(page), prompt);
    const fresh = candidates.find((candidate) => !previousUrls.has(candidate.url));
    if (fresh) {
      return fresh.url;
    }
    await nudgeResultViewport(page, attempt);
    attempt += 1;
    await sleep(2000);
  }
  return null;
}

async function fetchAndSaveVideoUrl(videoUrl, outputDir, requestedName) {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    fail(`Video fetch failed with status ${response.status}.`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const suggested = path.basename(new URL(videoUrl).pathname) || `bubio-${Date.now()}.mp4`;
  const finalName = sanitizeFilename(requestedName || suggested);
  const finalPath = path.join(outputDir, finalName.endsWith(".mp4") ? finalName : `${finalName}.mp4`);
  fs.writeFileSync(finalPath, buffer);
  return finalPath;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function suggestedReviewSheetPath(videoPath) {
  const parsed = path.parse(videoPath);
  return path.join(parsed.dir, `${parsed.name}-review-sheet.jpg`);
}

function printThreadDeliveryHint(videoPath) {
  const reviewSheetPath = suggestedReviewSheetPath(videoPath);
  const reviewScriptPath = path.join(__dirname, "make_review_sheet.sh");
  console.log(`Thread video markdown: ![Generated video](${videoPath})`);
  if (fs.existsSync(reviewScriptPath)) {
    console.log(`Review sheet command: zsh "${reviewScriptPath}" "${videoPath}" "${reviewSheetPath}" 4`);
    console.log(`Thread review markdown after sheet exists: ![Review sheet](${reviewSheetPath})`);
  }
}

async function runDoctor(options) {
  const stateFile = path.resolve(expandHome(options["state-file"] || DEFAULT_STATE_FILE));
  console.log(`Bubio studio: ${BUBIO_STUDIO_URL}`);
  console.log(`State file: ${stateFile}`);
  console.log(`State exists: ${fs.existsSync(stateFile) ? "yes" : "no"}`);
  console.log(`Chrome channel: chrome`);
  console.log(`Chrome root: ${CHROME_ROOT}`);
}

async function runCaptureAuth(options) {
  const stateFile = path.resolve(expandHome(options["state-file"] || DEFAULT_STATE_FILE));
  ensureSecureDir(path.dirname(stateFile));
  const { browser, context, page } = await launchContext({
    stateFile: null,
    headed: options.headless ? false : true,
  });
  try {
    console.log(`Opened ${BUBIO_STUDIO_URL}`);
    console.log("Log in to Bubio in this Chrome window if needed.");
    console.log("When the studio is ready, return here and press Enter.");
    await waitForEnter("> Press Enter to save the authenticated session ");
    await page.goto(BUBIO_STUDIO_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await ensureLoggedIn(page, stateFile);
    await context.storageState({ path: stateFile });
    lockFile(stateFile);
    console.log(`Saved Bubio session to ${stateFile}`);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

function copyProfileSnapshot(profileDirName, cloneRoot) {
  const sourceProfileDir = path.join(CHROME_ROOT, profileDirName);
  if (!fs.existsSync(sourceProfileDir)) {
    fail(`Chrome profile directory not found: ${sourceProfileDir}`);
  }

  removeDirIfExists(cloneRoot);
  ensureSecureDir(cloneRoot);

  const localStateSrc = path.join(CHROME_ROOT, "Local State");
  const localStateDest = path.join(cloneRoot, "Local State");
  if (fs.existsSync(localStateSrc)) {
    fs.copyFileSync(localStateSrc, localStateDest);
  }

  const sourceEntries = fs.readdirSync(sourceProfileDir, { withFileTypes: true });
  const targetProfileDir = path.join(cloneRoot, profileDirName);
  ensureSecureDir(targetProfileDir);

  const skipNames = new Set([
    "Cache",
    "Code Cache",
    "GPUCache",
    "GrShaderCache",
    "GraphiteDawnCache",
    "DawnCache",
    "blob_storage",
    "VideoDecodeStats",
    "optimization_guide_hint_cache_store",
    "Service Worker",
    "Session Storage",
    "Shared Dictionary",
    "WebStorage",
    "Network Action Predictor",
  ]);

  for (const entry of sourceEntries) {
    if (skipNames.has(entry.name)) {
      continue;
    }
    const src = path.join(sourceProfileDir, entry.name);
    const dest = path.join(targetProfileDir, entry.name);
    fs.cpSync(src, dest, { recursive: true, force: true, dereference: false });
  }
}

async function runBootstrapAuthFromProfile(options) {
  const stateFile = path.resolve(expandHome(options["state-file"] || DEFAULT_STATE_FILE));
  const profileDirName = options["chrome-profile-dir"] || detectLikelyChromeProfileDir();
  const cloneRoot = path.resolve(expandHome(options["clone-root"] || DEFAULT_CLONE_ROOT));
  ensureSecureDir(path.dirname(stateFile));
  console.log(`Cloning Chrome profile snapshot from ${profileDirName}...`);
  copyProfileSnapshot(profileDirName, cloneRoot);
  console.log(`Launching cloned Chrome profile from ${cloneRoot}...`);
  const { context, page } = await launchPersistentChrome({
    userDataDir: cloneRoot,
    headed: options.headless ? false : true,
    profileDirName,
  });
  try {
    const looksReady = await studioLooksReady(page);
    if (!looksReady) {
      console.log("Cloned profile did not immediately look authenticated.");
      console.log("If a login prompt is visible, complete it in the opened Chrome window, then return here and press Enter.");
      await waitForEnter("> Press Enter after Bubio studio is ready ");
      await page.goto(BUBIO_STUDIO_URL, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
    }
    await ensureLoggedIn(page, stateFile);
    await context.storageState({ path: stateFile });
    lockFile(stateFile);
    console.log(`Saved Bubio session to ${stateFile}`);
  } finally {
    await context.close().catch(() => {});
  }
}

async function runInspectStudio(options) {
  const stateFile = path.resolve(expandHome(options["state-file"] || DEFAULT_STATE_FILE));
  const artifactDir = path.resolve(expandHome(options["artifact-dir"] || path.join(process.cwd(), "output", "seedance-bubio", "automation-debug")));
  ensureSecureDir(artifactDir);
  const { browser, context, page } = await launchContext({
    stateFile,
    headed: options.headless ? false : true,
    outputDir: artifactDir,
  });
  try {
    await ensureLoggedIn(page, stateFile);
    logStep("Collecting visible button labels and screenshot");
    const buttons = page.getByRole("button");
    const count = await buttons.count();
    const labels = [];
    for (let i = 0; i < count; i += 1) {
      const button = buttons.nth(i);
      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }
      const text = ((await button.innerText().catch(() => "")) || "").trim();
      if (text) {
        labels.push(text.replace(/\s+/g, " "));
      }
    }
    const screenshotPath = path.join(artifactDir, `bubio-studio-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log("Visible button labels:");
    console.log(labels.join("\n"));
    console.log(`Saved screenshot: ${screenshotPath}`);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function runDiscoverApi(options) {
  const stateFile = path.resolve(expandHome(options["state-file"] || DEFAULT_STATE_FILE));
  if (!fs.existsSync(stateFile)) {
    fail(`Missing auth state file: ${stateFile}. Run capture-auth first.`);
  }
  const artifactDir = path.resolve(expandHome(options["artifact-dir"] || DEFAULT_DISCOVERY_DIR));
  const observeMs = Number.parseInt(options["observe-ms"] || String(DEFAULT_OBSERVE_MS), 10);
  if (!Number.isFinite(observeMs) || observeMs < 1000) {
    fail(`Invalid --observe-ms value: ${options["observe-ms"]}`);
  }
  ensureSecureDir(artifactDir);

  const startedAt = new Date().toISOString();
  const { browser, context, page } = await launchContext({
    stateFile,
    headed: options.headless ? false : true,
    outputDir: artifactDir,
    deferGoto: true,
  });
  const recorder = createNetworkRecorder(page);

  try {
    logStep("Opening Bubio studio with network recorder enabled");
    await page.goto(BUBIO_STUDIO_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    logStep("Checking Bubio auth state");
    await ensureLoggedIn(page, stateFile);
    if (options["exercise-form"]) {
      logStep("Exercising prompt/settings/upload controls without submitting generation");
      if (options.prompt || options["prompt-file"]) {
        await fillPrompt(page, readPrompt(options));
      }
      await ensureModel(page, options.model || "Seedance 2");
      await ensureMode(page, options.mode || "Create");
      await ensureAspect(page, options.aspect);
      await ensureDuration(page, options.duration);
      await ensureSound(page, options.sound);
      const refs = resolveFiles(options);
      if (refs.length > 0) {
        const attached = await tryAttachFiles(page, refs);
        if (!attached) {
          fail("Could not find Bubio's media uploader while exercising form controls.");
        }
        await sleep(1500);
      }
    }
    logStep(`Observing sanitized network traffic for ${observeMs}ms; no generation will be submitted`);
    await sleep(observeMs);
    await recorder.flush();

    const timestamp = Date.now();
    const screenshotPath = path.join(artifactDir, `bubio-api-discovery-${timestamp}.png`);
    const summaryPath = path.join(artifactDir, `bubio-network-summary-${timestamp}.json`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    const summary = recorder.buildSummary({
      generatedAt: new Date().toISOString(),
      startedAt,
      studioUrl: BUBIO_STUDIO_URL,
      observeMs,
      artifactDir,
      screenshotPath,
      note: "Sanitized endpoint discovery only. No Generate click was performed.",
    });
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    lockFile(summaryPath);

    console.log("First-party API endpoints:");
    for (const endpoint of summary.firstPartyApiCandidates.slice(0, 80)) {
      console.log(`${endpoint.method} ${endpoint.host}${endpoint.pathname} -> ${statusSummary(endpoint.statuses)} (${endpoint.count})`);
    }
    if (summary.firstPartyApiCandidates.length === 0) {
      console.log("(none detected; try --exercise-form, a longer --observe-ms, or inspect manually while the recorder is running)");
    }
    const thirdPartyCount = summary.apiCandidates.length - summary.firstPartyApiCandidates.length;
    if (thirdPartyCount > 0) {
      console.log(`Other likely third-party network endpoints captured: ${thirdPartyCount}`);
    }
    console.log(`Saved sanitized network summary: ${summaryPath}`);
    console.log(`Saved screenshot: ${screenshotPath}`);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function runDownloadLatest(options) {
  const stateFile = path.resolve(expandHome(options["state-file"] || DEFAULT_STATE_FILE));
  const outputDir = path.resolve(expandHome(options["output-dir"] || DEFAULT_OUTPUT_DIR));
  const prompt = readOptionalPrompt(options);
  ensureSecureDir(outputDir);
  const { browser, context, page } = await launchContext({
    stateFile,
    headed: options.headless ? false : true,
    outputDir,
  });
  try {
    logStep("Checking Bubio auth state");
    await ensureLoggedIn(page, stateFile);
    logStep("Resolving newest signed video URL from the page");
    const videoUrl = await getLatestVideoUrlFromPage(page, prompt);
    if (!videoUrl) {
      fail("Could not find a signed studio video URL on the page.");
    }
    const finalPath = await fetchAndSaveVideoUrl(videoUrl, outputDir, options["download-name"]);
    console.log(`Saved latest video to ${finalPath}`);
    printThreadDeliveryHint(finalPath);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function runGenerate(options) {
  const stateFile = path.resolve(expandHome(options["state-file"] || DEFAULT_STATE_FILE));
  if (!fs.existsSync(stateFile)) {
    fail(authRecoveryMessage(stateFile));
  }
  const outputDir = path.resolve(expandHome(options["output-dir"] || DEFAULT_OUTPUT_DIR));
  const prompt = readPrompt(options);
  const refs = resolveFiles(options);
  const timeoutMs = Number.parseInt(options["timeout-ms"] || String(DEFAULT_TIMEOUT_MS), 10);

  ensureSecureDir(outputDir);

  const { browser, context, page } = await launchContext({
    stateFile,
    headed: options.headless ? false : true,
    outputDir,
  });

  try {
    logStep("Checking Bubio auth state");
    await ensureLoggedIn(page, stateFile);
    const previousVideoUrls = new Set(await getStudioVideoUrlsFromPage(page));
    const beforeDownloads = await page.getByText("Download", { exact: true }).count().catch(() => 0);
    warnAboutImplicitRefs(prompt, refs);

    logStep("Filling prompt");
    await fillPrompt(page, prompt);
    logStep(`Selecting mode: ${options.mode || "Create"}`);
    await ensureMode(page, options.mode || "Create");

    if (refs.length > 0) {
      logStep(`Attaching ${refs.length} reference file(s)`);
      const attached = await tryAttachFiles(page, refs);
      if (!attached) {
        fail("Could not find Bubio's media uploader. Use inspect-studio to refine selectors.");
      }
      await sleep(1500);
    }

    logStep(`Selecting model: ${options.model || "Seedance 2"}`);
    await ensureModel(page, options.model || "Seedance 2");
    logStep(`Selecting aspect: ${options.aspect || "unchanged"}`);
    await ensureAspect(page, options.aspect);
    logStep(`Selecting duration: ${options.duration || "unchanged"}`);
    await ensureDuration(page, options.duration);
    logStep(`Selecting sound: ${options.sound || "unchanged"}`);
    await ensureSound(page, options.sound);

    if (options["dry-run"]) {
      const dryRunShot = path.join(outputDir, `bubio-dry-run-${Date.now()}.png`);
      logStep("Dry run requested; saving screenshot before submit");
      await page.screenshot({ path: dryRunShot, fullPage: true });
      console.log(`Dry run complete. Saved screenshot to ${dryRunShot}`);
      return;
    }

    const generateText = page.getByText("Generate", { exact: true }).last();
    if (!(await generateText.isVisible().catch(() => false))) {
      fail("Generate button text was not visible.");
    }
    logStep("Submitting Bubio generation");
    await generateText.click();

    if (options["submit-only"]) {
      const submitTimestamp = Date.now();
      const submitShot = path.join(outputDir, `bubio-submit-${submitTimestamp}.png`);
      const submitState = path.join(outputDir, `bubio-submit-${submitTimestamp}.json`);
      const promptFileForResume = options["prompt-file"]
        ? path.resolve(expandHome(options["prompt-file"]))
        : path.join(outputDir, `bubio-submit-${submitTimestamp}-prompt.txt`);
      if (!options["prompt-file"]) {
        fs.writeFileSync(promptFileForResume, `${prompt}\n`);
      }
      await sleep(3000);
      await page.screenshot({ path: submitShot, fullPage: true }).catch(() => {});
      fs.writeFileSync(submitState, `${JSON.stringify({
        submittedAt: new Date().toISOString(),
        studioUrl: BUBIO_STUDIO_URL,
        outputDir,
        downloadName: options["download-name"] || null,
        promptFileForResume,
        previousVideoUrlCount: previousVideoUrls.size,
        note: "Submit-only mode: generation was clicked, but this runner intentionally exited before waiting for the MP4.",
      }, null, 2)}\n`);
      console.log(`Submit-only complete. Saved screenshot: ${submitShot}`);
      console.log(`Submit-only state: ${submitState}`);
      console.log("Set a 5-minute heartbeat/checkpoint. On return, run:");
      console.log(`zsh "${path.join(__dirname, "bubio_runner.sh")}" download-latest --output-dir "${outputDir}" --prompt-file "${promptFileForResume}"${options["download-name"] ? ` --download-name "${options["download-name"]}"` : ""}`);
      return;
    }

    logStep("Waiting for a fresh signed result URL");
    let freshVideoUrl = await waitForFreshVideoUrl(page, previousVideoUrls, timeoutMs, prompt);
    if (!freshVideoUrl) {
      logStep("Fresh result URL not detected yet; falling back to download-count signal");
      const sawNewDownload = await waitForFreshDownloadTarget(page, beforeDownloads, timeoutMs);
      if (!sawNewDownload) {
        fail("Timed out waiting for a new downloadable result.");
      }
      freshVideoUrl = await waitForFreshVideoUrl(page, previousVideoUrls, 30000, prompt);
    }
    if (!freshVideoUrl) {
      fail("A new result appeared, but no fresh signed studio video URL was detected.");
    }
    const finalPath = await fetchAndSaveVideoUrl(freshVideoUrl, outputDir, options["download-name"]);
    console.log(`Saved video to ${finalPath}`);
    printThreadDeliveryHint(finalPath);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (options.help || command === "help") {
    printHelp();
    return;
  }

  if (command === "doctor") {
    await runDoctor(options);
    return;
  }
  if (command === "capture-auth") {
    await runCaptureAuth(options);
    return;
  }
  if (command === "bootstrap-auth-from-profile") {
    await runBootstrapAuthFromProfile(options);
    return;
  }
  if (command === "inspect-studio") {
    await runInspectStudio(options);
    return;
  }
  if (command === "discover-api") {
    await runDiscoverApi(options);
    return;
  }
  if (command === "download-latest") {
    await runDownloadLatest(options);
    return;
  }
  if (command === "generate") {
    await runGenerate(options);
    return;
  }

  fail(`Unknown command: ${command}`);
}

main().catch((error) => {
  fail(error && error.stack ? error.stack : String(error));
});
