# Contributing

Seedance Director Kit is maintained as an open-source Codex skill and tooling bundle for directing Seedance/Bubio video workflows.

## Good Contributions

- Improve the `seedance-director` skill instructions.
- Add prompt patterns that reliably improve motion, identity consistency, or final-state clarity.
- Improve Bubio automation safety, auth recovery, upload handling, stale-card checks, or MP4 retrieval.
- Add review tools that make output critique more objective.
- Document real failure modes with reproducible symptoms and fixes.

## Development Notes

- Keep private browser profiles, cookies, tokens, passwords, and user-specific assets out of the repo.
- Preserve the thread-first delivery model: Bubio renders the video, but Codex should retrieve the MP4, return it to the conversation, make a review sheet when useful, critique honestly, and save lessons.
- Prefer small, reviewable changes that strengthen one part of the loop.

## Pull Requests

Please include:

- the workflow or failure mode being improved,
- any commands used to test the change,
- whether the change touches prompt guidance, browser/Bubio automation, or review tooling.

Maintainer review focuses on safety, portability, prompt quality, and whether the change makes Seedance results more reliable.
