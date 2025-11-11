# @r1x/agent-auth

Agent runtime authentication and wallet management for r1x Agent SDK.

## Installation

```bash
bun add @r1x/agent-auth
```

## Usage

```ts
import {
  AgentRuntime,
  MemoryStorageAdapter,
  type AgentRuntimeWallet,
} from '@r1x/agent-auth';

const wallet: AgentRuntimeWallet = {
  signer: {
    async signChallenge(challenge) {
      // Sign the challenge with your wallet
      return signature;
    },
  },
};

const { runtime } = await AgentRuntime.load({
  wallet,
  storage: new MemoryStorageAdapter(),
  loader: {
    overrides: {
      baseUrl: 'https://api.r1xlabs.com',
      agentRef: 'my-agent',
      credentialId: 'my-credential',
    },
  },
});

const token = await runtime.ensureAccessToken();
const agent = await runtime.api.getAgent();
```

## License

MIT

