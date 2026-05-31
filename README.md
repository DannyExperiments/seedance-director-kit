# Seedance Director Kit

This kit packages a public Codex skill plus the supporting playbooks and tools needed to direct high-quality Seedance 2.0 videos consistently.

Seedance Director Kit is open source under the MIT License and maintained by DannyExperiments.

It is designed for the workflow:

`rough idea -> strategy choice -> authored stills/storyboard -> Seedance prompt -> Bubio run -> critique -> next move`

The intended user experience is thread-first: Bubio renders the clip, but Codex retrieves the MP4, returns it directly in the conversation, creates a review sheet when possible, runs a motion check for action clips, critiques the returned artifact, and saves a compact run lesson.

## What is in this kit

- `skills/seedance-director/`
  - the installable public Codex skill
- `docs/`
  - the playbooks behind the skill
- `tools/bubio_automation/`
  - a faster Bubio runner path for repeated work, including sanitized API discovery and local motion scoring
- `examples/`
  - handoff and invocation examples
- `CONTRIBUTING.md`, `SECURITY.md`, and `MAINTAINERS.md`
  - open-source maintenance, review, and safety expectations

## What this is not

- It is not tied to any one character, browser profile, or user.
- It does not ship private sessions, passwords, or personal overlays.
- It does not assume Panda, Daniel, or any local custom character system.

## Install

Install via Codex with the built-in skill installer:

```text
Use $skill-installer to install:
https://github.com/DannyExperiments/seedance-director-kit/tree/main/skills/seedance-director
```

Then restart Codex.

Manual fallback:

```zsh
mkdir -p ~/.codex/skills
cp -R "/absolute/path/to/seedance-director-kit/skills/seedance-director" ~/.codex/skills/
```

If the user wants faster Bubio execution, keep this repo available locally and use:

- `tools/bubio_automation/bubio_runner.sh`
- `tools/bubio_automation/analyze_motion.sh`

The user logs into Bubio once. The runner stores only reusable local auth state, not a password.
If no saved Bubio session exists yet, Codex should run `capture-auth` so a visible Chrome login window opens, tell the user which window to use, and then reuse that saved local session on future runs.
The runner also includes `discover-api`, a non-spending command that records redacted Bubio endpoint structure so future versions can replace more browser clicking with direct CLI/API calls.
If auth is missing or expired, Codex should run `capture-auth` so a visible Chrome login window opens, then tell the user exactly which opened window to use. It should not merely say "log in" without opening a route.

## Use

Short invocation:

```text
Use $seedance-director. Take my rough idea, choose the best Seedance strategy, create any needed reference images or storyboard sheets, generate the video through my logged-in Bubio or available Seedance route, retrieve/download the MP4, return the video directly in this thread, make a review sheet, critique it, save the run lesson, and tell me the next improvement move.
```

The fuller handoff is in:

- `examples/full-handoff-prompt.txt`

The installable skill is self-contained: the public playbooks, prompt architecture, reference-image system, critique loop, review-sheet helper, and bundled Bubio runner all live inside `skills/seedance-director/`, so they come along when another Codex installs that path.

## Recommended sharing format

For another person, the best handoff is:

1. the `seedance-director` skill folder
2. this repo

The skill is the front door. The repo is the operating system, prompt bank, and tooling bundle.

## Maintainer Responsibilities

The maintainer reviews workflow changes, prompt guidance, Bubio automation safety, release quality, issue triage, and security posture. The project intentionally keeps user-specific browser profiles, private prompts, cookies, credentials, and generated private assets out of the public core.

## Suggested companion structure

If a user has their own recurring character or browser habits, keep that in a separate overlay skill such as:

- `seedance-<name>-overlay`

Invoke it alongside `seedance-director` instead of modifying the public core.
