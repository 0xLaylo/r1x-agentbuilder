import { Hono } from 'hono';
import type { AgentMeta, EntrypointDef } from '@r1x/agent-kit';
import { type CreateAgentHttpOptions } from '@r1x/agent-kit';
export type CreateAgentAppOptions = CreateAgentHttpOptions & {
    /**
     * Hook called before mounting agent routes.
     * Use this to register custom middleware that should run before agent handlers.
     */
    beforeMount?: (app: Hono) => void;
    /**
     * Hook called after mounting all agent routes.
     * Use this to register additional custom routes or error handlers.
     */
    afterMount?: (app: Hono) => void;
};
export declare function createAgentApp(meta: AgentMeta, opts?: CreateAgentAppOptions): {
    app: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
    agent: import("@r1x/agent-core").AgentCore;
    addEntrypoint: (def: EntrypointDef) => void;
    config: import("@r1x/agent-kit").ResolvedAgentKitConfig;
};
