# Security

Seedance Director Kit can interact with browser sessions, local files, generated media, and external video tools. Treat automation changes carefully.

## Reporting

Please report security issues privately to the project maintainer instead of opening a public issue.

## Scope

Security-sensitive areas include:

- browser auth capture and saved local session state,
- upload/download automation,
- handling of generated files,
- redaction of API discovery output,
- scripts that call external tools,
- any change that could expose cookies, tokens, passwords, private prompts, or local user data.

## Rules For Contributors

- Do not commit credentials, cookies, auth state, private browser data, or generated files that contain private user information.
- Do not add dependency-fetching install steps to runtime scripts unless they are clearly documented and optional.
- Keep API discovery output redacted by default.
- Prefer explicit user confirmation before any action that spends credits, submits a render, or changes remote state.
