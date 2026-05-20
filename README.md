# Seedance Director Kit

This kit packages a public Codex skill plus the supporting playbooks and tools needed to direct high-quality Seedance 2.0 videos consistently.

It is designed for the workflow:

`rough idea -> strategy choice -> authored stills/storyboard -> Seedance prompt -> Bubio run -> critique -> next move`

## What is in this kit

- `skill/seedance-director/`
  - the installable public Codex skill
- `docs/`
  - the playbooks behind the skill
- `tools/bubio_automation/`
  - a faster Bubio runner path for repeated work
- `examples/`
  - handoff and invocation examples

## What this is not

- It is not tied to any one character, browser profile, or user.
- It does not ship private sessions, passwords, or personal overlays.
- It does not assume Panda, Daniel, or any local custom character system.

## Install

Copy the bundled skill folder into Codex skills:

```zsh
mkdir -p ~/.codex/skills
cp -R "/absolute/path/to/seedance-director-kit/skill/seedance-director" ~/.codex/skills/
```

If the user wants faster Bubio execution, keep this repo available locally and use:

- `tools/bubio_automation/bubio_runner.sh`

The user logs into Bubio once. The runner stores only reusable local auth state, not a password.

## Use

Short invocation:

```text
Use $seedance-director. Take my rough idea, choose the best Seedance strategy, create any needed reference images or storyboard sheets, generate the video through my logged-in Bubio or available Seedance route, retrieve the output, critique it, and tell me the next improvement move.
```

The fuller handoff is in:

- `examples/full-handoff-prompt.txt`

## Recommended sharing format

For another person, the best handoff is:

1. the `seedance-director` skill folder
2. this repo

The skill is the front door. The repo is the operating system, prompt bank, and tooling bundle.

## Suggested companion structure

If a user has their own recurring character or browser habits, keep that in a separate overlay skill such as:

- `seedance-<name>-overlay`

Invoke it alongside `seedance-director` instead of modifying the public core.
