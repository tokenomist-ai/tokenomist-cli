# Contributing to tokenomist-cli

Thanks for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/tokenomist-cli.git` (upstream: `tokenomist-ai/tokenomist-cli`)
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b my-feature`
5. Make your changes
6. Run tests: `npm test`
7. Run lint: `npm run lint`
8. Commit and push
9. Open a Pull Request

## Development

Development needs Node.js 20.19+, 22.13+ or 24+ (the test and lint tooling no longer supports Node 18). The published CLI still runs on Node 18+.

```bash
npm run build     # Build the CLI
npm run dev       # Build with watch mode
npm test          # Run tests
npm run lint      # Run linter
npm run format    # Format code
```

## Code Style

- TypeScript strict mode
- Formatted with Prettier
- Linted with ESLint

## Reporting Issues

Please use the [GitHub Issues](https://github.com/tokenomist-ai/tokenomist-cli/issues) page.
