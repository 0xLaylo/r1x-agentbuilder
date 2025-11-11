# r1x Agent SDK

Build, ship, and monetize AI agents with a consistent surface across runtimes. This monorepo hosts the primitives we use to describe agent capabilities once and deliver them through web servers, manifests, and onchain identity.

**Part of the r1x ecosystem** - The payment infrastructure for the machine economy.

## Overview

- **Agent-first HTTP surface:** Define entrypoints with strict typing, instant discovery endpoints, and automatic AgentCard manifests.
- **Built-in monetization:** x402 pricing, payments middleware, and helpers for paid LLM calls. Supports Base and Solana networks.
- **Trust & identity:** ERC-8004 integrations so agents can prove ownership, reputation, and validation history.

## Key Packages

- [`@r1x/agent-kit`](packages/agent-kit/README.md) — Hono wrapper that registers entrypoints, serves manifests, manages payments, and exposes trust metadata utilities.
- [`@r1x/create-agent-kit`](packages/create-agent-kit/README.md) — CLI scaffolding tool to generate new agent projects with templates, environment setup, and optional dependency installation.
- [`@r1x/agent-kit-identity`](packages/agent-kit-identity/README.md) — ERC-8004 toolkit for registering agents, generating trust configs, and working with reputation/validation registries.

Each package README contains API details, environment variables, and complete examples.

## Features

- **Agent Kit runtime:** Ship typed entrypoints, manifests, and trust metadata with minimal wiring.
- **x402 bootstrapping:** Scaffold paid invoke/stream endpoints with CLI templates, payments middleware, and helper utilities. Multi-chain support (Base & Solana).
- **Agent auth + ERC-8004:** Register identities, expose trust manifests, and manage reputation reviews via on-chain APIs.

## Example

```ts
import { z } from "zod";
import { createAgentApp } from "@r1x/agent-kit";
import {
  createAgentIdentity,
  getTrustConfig,
} from "@r1x/agent-kit-identity";

const identity = await createAgentIdentity({
  domain: "my-agent.example.com",
  autoRegister: true,
});

const { app, addEntrypoint } = createAgentApp(
  {
    name: "demo-agent",
    version: "0.1.0",
    description: "Echo text with optional reputation lookup",
  },
  {
    trust: getTrustConfig(identity),
  }
);

addEntrypoint({
  key: "echo",
  description: "Echo a message back",
  input: z.object({ text: z.string() }),
  async handler({ input }) {
    return { output: { text: input.text } };
  },
});

export default app;
```

This pair wires together the agent runtime and ERC-8004 trust metadata in just a few lines. Dive deeper in the package READMEs linked above.

## Getting Started

### Quick Start: Scaffold a New Agent

The fastest way to get started is with the CLI scaffolding tool:

```bash
bunx @r1x/create-agent-kit@latest
```

The interactive CLI will:

1. Guide you through template selection (`blank`, `axllm`, or `axllm-flow`)
2. Set up your project with agent metadata and entrypoints
3. Configure environment variables for payments and identity (optional)
4. Install dependencies automatically if you choose

See the [`create-agent-kit` README](packages/create-agent-kit/README.md) for detailed CLI options and template descriptions.

### Working with the Codebase

If you're contributing or exploring the monorepo:

1. **Install dependencies**: `bun install`
2. **Explore packages**:
   - [`agent-kit`](packages/agent-kit/README.md) — Core runtime for building agent servers
   - [`agent-kit-identity`](packages/agent-kit-identity/README.md) — ERC-8004 identity and trust
   - [`create-agent-kit`](packages/create-agent-kit/README.md) — CLI for scaffolding projects
3. **Run examples**: Check `examples/` in each package for working code samples
4. **Build packages**: `bun run build:packages`

## Integration with r1x Platform

This SDK integrates seamlessly with the r1x ecosystem:

- **r1x Marketplace** - Discover and integrate x402 services
- **r1x Agent Builder** - Visual no-code agent creation (UI available at https://www.r1xlabs.com/agent-builder)
- **Multi-chain Support** - Base (EVM) and Solana networks
- **x402 Protocol** - Built-in payment handling

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Setting up your development environment
- Making changes and submitting pull requests
- Testing and code standards
- Release process with changesets

Quick tips:

- Use `bun test` and package-level scripts before opening PRs
- Keep documentation up to date when changing APIs
- Follow TypeScript strict mode and ESM standards

## Resources

- [r1x Platform](https://www.r1xlabs.com) - Main platform website
- [r1x Agent Builder](https://www.r1xlabs.com/agent-builder) - Visual agent builder
- [r1x Documentation](https://www.r1xlabs.com/docs) - Complete documentation
- ERC-8004 specification: <https://eips.ethereum.org/EIPS/eip-8004>
- x402 Protocol: <https://docs.payai.network/x402/reference>

## License

MIT
