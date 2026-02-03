# Contributing to OtterSeal

First off, thank you for considering contributing to OtterSeal! It's people like you who make OtterSeal such a great tool.

## Prerequisites

- [Node.js](https://nodejs.org/) 24 or higher
- [pnpm](https://pnpm.io/)

## Setup

1. Fork the repository and clone it locally.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting. You can run the checks using:

```bash
pnpm check
```

Please ensure there are no errors before submitting a pull request.

## Testing

All tests must pass. Run the tests using:

```bash
pnpm test
```

## Pull Request Process

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Submit a pull request!

## Commit Messages

We prefer [Conventional Commits](https://www.conventionalcommits.org/). This helps in generating changelogs and managing versions.
