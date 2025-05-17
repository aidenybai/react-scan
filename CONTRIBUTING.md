# Contributing to React Scan

First off, thanks for taking the time to contribute! ❤️

## Table of Contents

- [Contributing to React Scan](#contributing-to-react-scan)
  - [Table of Contents](#table-of-contents)
  - [Project Structure](#project-structure)
  - [Development Setup](#development-setup)
  - [Contributing Guidelines](#contributing-guidelines)
    - [Commits](#commits)
    - [Pull Request Process](#pull-request-process)
    - [Development Workflow](#development-workflow)
  - [Getting Help](#getting-help)

## Project Structure

This is a monorepo containing several packages:

- `packages/scan` - Core React Scan package
- `packages/vite-plugin-react-scan` - Vite plugin for React Scan
- `packages/extension` - VS Code extension

## Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/aidenybai/react-scan.git
   cd react-scan
   pnpm install
   ```

2. **Build all packages**
   ```bash
   pnpm build
   ```

3. **Testing React Scan**
   ```bash
   cd packages/scan
   pnpm build:copy
   ```
   - This will build the package and then copy it to your clipboard as an IIFE (immedietely invoked function expression). This will allow you to paste it into the browser console to test it on any website

https://github.com/user-attachments/assets/f279e664-479f-4e39-bff4-1bbfee30af22

## Contributing Guidelines

### Commits

We use conventional commits to ensure consistent commit messages:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `test:` Adding or updating tests
- `refactor:` Code changes that neither fix bugs nor add features

Example: `fix(scan): fix a typo`

### Pull Request Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using conventional commits
4. Push to your branch
5. Open a Pull Request
6. Ask for reviews (@pivanov, @RobPruzan are your friends in this journey)

### Development Workflow

1. **TypeScript**
   - All code must be written in TypeScript
   - Ensure strict type checking passes
   - No `any` types unless absolutely necessary

2. **Code Style**
   - We use Biome for formatting and linting
   - Run `pnpm format` to format code
   - Run `pnpm lint` to check for issues

3. **Documentation**
   - Update relevant documentation
   - Add JSDoc comments for public APIs
   - Update README if needed

## Getting Help
- Check existing issues
- Create a new issue

<br />

⚛️ Happy coding! 🚀
