/**
 * @r1x/agent-auth
 * 
 * Agent runtime authentication and wallet management for r1x Agent SDK.
 * Provides wallet signing, token management, and API client functionality.
 */

export type AgentRuntimeWallet = {
  signer: {
    signChallenge(challenge: { id: string; payload: string }): Promise<string>;
  };
};

export type StorageAdapter = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
};

export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

export type AgentApiClient = {
  getAgent(): Promise<{
    billing?: {
      wallet?: {
        address?: string;
      };
    };
    wallet?: {
      address?: string;
    };
    billingWallet?: {
      address?: string;
    };
  }>;
  signTypedData(params: {
    typed_data: {
      domain?: Record<string, unknown>;
      types?: Record<string, Array<{ name: string; type: string }>>;
      message?: Record<string, unknown>;
      primary_type?: string;
    };
    idempotency_key?: string;
  }): Promise<{
    wallet?: {
      address?: string;
    };
    signed?: {
      signature?: string;
    };
  }>;
  signMessage(params: {
    message: string;
  }): Promise<{
    wallet?: {
      address?: string;
    };
    signed?: {
      signature?: string;
    };
  }>;
  listAgents(): Promise<{
    items: unknown[];
  }>;
};

export type AgentRuntimeConfig = {
  wallet: AgentRuntimeWallet;
  fetch?: typeof fetch;
  storage?: StorageAdapter;
  refreshLeadTimeMs?: number;
  loader?: {
    overrides?: {
      baseUrl?: string;
      agentRef?: string;
      credentialId?: string;
      scopes?: string[];
    };
  };
};

export class AgentRuntime {
  public readonly api: AgentApiClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private config: AgentRuntimeConfig;

  private constructor(config: AgentRuntimeConfig) {
    this.config = config;
    this.api = this.createApiClient();
  }

  static async load(config: AgentRuntimeConfig): Promise<{
    runtime: AgentRuntime;
    config: {
      baseUrl?: string;
      agentRef?: string;
      credentialId?: string;
    };
  }> {
    const runtime = new AgentRuntime(config);
    
    // Initialize tokens if refresh token is available
    const refreshToken = await config.storage?.get('refresh_token');
    if (refreshToken) {
      runtime.refreshToken = refreshToken;
      await runtime.refreshAccessToken();
    }

    return {
      runtime,
      config: {
        baseUrl: config.loader?.overrides?.baseUrl,
        agentRef: config.loader?.overrides?.agentRef,
        credentialId: config.loader?.overrides?.credentialId,
      },
    };
  }

  async ensureAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      await this.refreshAccessToken();
      if (this.accessToken) {
        return this.accessToken;
      }
    }

    // Challenge flow
    await this.authenticate();
    return this.accessToken ?? '';
  }

  private async authenticate(): Promise<void> {
    const baseUrl = this.config.loader?.overrides?.baseUrl;
    if (!baseUrl) {
      throw new Error('Base URL is required for authentication');
    }

    const fetchImpl = this.config.fetch ?? globalThis.fetch;
    
    // Request challenge
    const challengeResponse = await fetchImpl(`${baseUrl}/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentRef: this.config.loader?.overrides?.agentRef,
        credentialId: this.config.loader?.overrides?.credentialId,
      }),
    });

    if (!challengeResponse.ok) {
      throw new Error(`Challenge request failed: ${challengeResponse.statusText}`);
    }

    const challenge = await challengeResponse.json();
    
    // Sign challenge
    const signature = await this.config.wallet.signer.signChallenge({
      id: challenge.id,
      payload: challenge.payload,
    });

    // Exchange for tokens
    const tokenResponse = await fetchImpl(`${baseUrl}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challenge.id,
        signature,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    if (this.refreshToken && this.config.storage) {
      await this.config.storage.set('refresh_token', this.refreshToken);
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      return;
    }

    const baseUrl = this.config.loader?.overrides?.baseUrl;
    if (!baseUrl) {
      return;
    }

    const fetchImpl = this.config.fetch ?? globalThis.fetch;
    
    try {
      const response = await fetchImpl(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const tokens = await response.json();
        this.accessToken = tokens.accessToken;
        if (tokens.refreshToken) {
          this.refreshToken = tokens.refreshToken;
          if (this.config.storage) {
            await this.config.storage.set('refresh_token', this.refreshToken);
          }
        }
      }
    } catch (error) {
      // Refresh failed, will need to re-authenticate
      this.refreshToken = null;
      if (this.config.storage) {
        await this.config.storage.delete('refresh_token');
      }
    }
  }

  private createApiClient(): AgentApiClient {
    const fetchImpl = this.config.fetch ?? globalThis.fetch;
    const baseUrl = this.config.loader?.overrides?.baseUrl ?? '';
    const runtime = this;

    return {
      async getAgent() {
        const token = await runtime.ensureAccessToken();
        const response = await fetchImpl(`${baseUrl}/agents/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to get agent: ${response.statusText}`);
        }
        return response.json();
      },

      async signTypedData(params) {
        const token = await runtime.ensureAccessToken();
        const response = await fetchImpl(`${baseUrl}/wallet/sign-typed-data`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        if (!response.ok) {
          throw new Error(`Failed to sign typed data: ${response.statusText}`);
        }
        return response.json();
      },

      async signMessage(params) {
        const token = await runtime.ensureAccessToken();
        const response = await fetchImpl(`${baseUrl}/wallet/sign-message`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        if (!response.ok) {
          throw new Error(`Failed to sign message: ${response.statusText}`);
        }
        return response.json();
      },

      async listAgents() {
        const token = await runtime.ensureAccessToken();
        const response = await fetchImpl(`${baseUrl}/agents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to list agents: ${response.statusText}`);
        }
        return response.json();
      },
    };
  }
}

export type { AgentRuntime };

