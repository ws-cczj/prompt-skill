# prompt-skill

Help your agent better understand your ask by making requests specific, contextual, and verifiable.

## Write better asks

- **State the goal clearly**: what you want changed and why it matters.
- **Add context**: include relevant files, constraints, and expected behavior.
- **Define done**: describe how success should be validated (tests, output, behavior).

## Example

Instead of: `Fix login`

Try: `Update /src/auth.ts so expired tokens return HTTP 401 with { "error": "token_expired" }, and add a test in /tests/auth.test.ts.`
