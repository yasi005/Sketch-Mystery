# Security Policy

## Supported versions

Security fixes are applied on the default branch of this repository.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Email or privately message the repository owner with:

- a short description of the issue
- steps to reproduce
- impact (what an attacker could do)

You should receive an acknowledgment when the report is received. Please allow time to investigate before any public disclosure.

## Scope notes

This project is a client-side drawing UI. It does not intentionally store user accounts, payment data, or server-side secrets. If you add APIs, auth, or third-party keys later, keep them in `.env.local` (gitignored) and never commit them.
