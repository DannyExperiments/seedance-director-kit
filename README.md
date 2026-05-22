# Seedance Director Kit

This kit packages a public Codex skill plus the supporting playbooks and tools needed to direct high-quality Seedance 2.0 videos consistently.

It is designed for the workflow:

`rough idea -> strategy choice -> authored stills/storyboard -> Seedance prompt -> Bubio run -> critique -> next move`

The intended user experience is thread-first: Bubio renders the clip, but Codex retrieves the MP4, returns it directly in the conversation, creates a review sheet when possible, and critiques the returned artifact.

## What is in this kit

- `skills/seedance-director/`
  - the installable public Codex skill
- `docs/`
  - the playbooks behind the skill
- `tools/bubio_automation/`
  - a faster Bubio runner path for repeated work, including sanitized API discovery
- `examples/`
  - handoff and invocation examples

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

The user logs into Bubio once. The runner stores only reusable local auth state, not a password.
If no saved Bubio session exists yet, Codex should ask the user to log in once and then reuse that saved local session on future runs.
The runner also includes `discover-api`, a non-spending command that records redacted Bubio endpoint structure so future versions can replace more browser clicking with direct CLI/API calls.

## Use

Short invocation:

```text
Use $seedance-director. Take my rough idea, choose the best Seedance strategy, create any needed reference images or storyboard sheets, generate the video through my logged-in Bubio or available Seedance route, retrieve/download the MP4, return the video directly in this thread, critique it, and tell me the next improvement move.
```

The fuller handoff is in:

- `examples/full-handoff-prompt.txt`

The installable skill is self-contained: the public playbooks, prompt architecture, reference-image system, critique loop, review-sheet helper, and bundled Bubio runner all live inside `skills/seedance-director/`, so they come along when another Codex installs that path.

## Recommended sharing format

For another person, the best handoff is:

1. the `seedance-director` skill folder
2. this repo

The skill is the front door. The repo is the operating system, prompt bank, and tooling bundle.

## Suggested companion structure

If a user has their own recurring character or browser habits, keep that in a separate overlay skill such as:

- `seedance-<name>-overlay`

Invoke it alongside `seedance-director` instead of modifying the public core.
