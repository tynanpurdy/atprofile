import { AccountsManagementModal } from "@/components/auth/accountsManagementModal";
import { PersistentUserCache, UserCache } from "@/lib/userCache";
import { XRPC, CredentialManager } from "@atcute/client";
import {
  AuthorizationServerMetadata,
  configureOAuth,
  createAuthorizationUrl,
  deleteStoredSession,
  finalizeAuthorization,
  getSession,
  IdentityMetadata,
  OAuthUserAgent,
  resolveFromIdentity,
} from "@atcute/oauth-browser-client";
import React, { useState, useEffect } from "preact/compat";

configureOAuth({
  metadata: {
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
  },
});

interface QtContextType {
  client: QtClient;
  currentAgent: OAuthUserAgent | null;
  accounts: `did:${string}`[];
  isManagementModalOpen: boolean;
  openManagementModal: () => void;
  closeManagementModal: () => void;
  userCache: UserCache;
}

export const QtContext = React.createContext<QtContextType | null>(null);

export function useXrpc(): XRPC {
  const client = React.useContext(QtContext);
  if (!client) {
    throw new Error("useXrpc must be used within a QtProvider");
  }
  return client.client.rpc;
}

export function QtProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<QtClient | null>(null);
  const [currentAgent, setCurrentAgent] = useState<OAuthUserAgent | null>(null);
  const [accounts, setAccounts] = useState<`did:${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [userCache] = useState<UserCache>(() => new PersistentUserCache());

  useEffect(() => {
    try {
      const newClient = new QtClient();
      newClient.onStateChange = (agent, accounts) => {
        setCurrentAgent(agent);
        setAccounts(accounts);
      };
      setClient(newClient);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to initialize client"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!client) return null;

  const value = {
    client,
    currentAgent,
    accounts,
    isManagementModalOpen,
    openManagementModal: () => setIsManagementModalOpen(true),
    closeManagementModal: () => setIsManagementModalOpen(false),
    userCache,
  };

  return (
    <QtContext.Provider value={value}>
      <div>{children}</div>
      <AccountsManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
      />
    </QtContext.Provider>
  );
}

export class QtClient {
  manager: CredentialManager;
  rpc: XRPC;
  accounts: `did:${string}`[];
  currentAgent: OAuthUserAgent | null;
  currentAgentDid: `did:${string}` | null;
  onStateChange?: (
    agent: OAuthUserAgent | null,
    accounts: `did:${string}`[],
  ) => void;

  constructor(service: URL = new URL("https://bsky.social")) {
    this.manager = new CredentialManager({ service: service.toString() });
    this.rpc = new XRPC({ handler: this.manager });
    this.accounts =
      (JSON.parse(
        localStorage.getItem("currentAccountList") as string,
      ) as `did:${string}`[]) || [];
    this.currentAgent = null;
    this.currentAgentDid = localStorage.getItem("currentAgentDid") as
      | `did:${string}`
      | null;

    // Only attempt to resume session if it's the default service
    // attempt to avoid one-shots from making irrelevant calls
    console.log(service.href);
    if (service.href === "https://bsky.social/") {
      this.attemptResumeSession();
    }
  }
  private updateState() {
    if (this.onStateChange) {
      this.onStateChange(this.currentAgent, this.accounts);
    }
    // Save currentAgentDid to localStorage whenever state updates
    if (this.currentAgent?.sub) {
      localStorage.setItem("currentAgentDid", this.currentAgent.sub);
    } else {
      localStorage.removeItem("currentAgentDid");
    }
    if (this.accounts.length > 0) {
      localStorage.setItem("currentAccountList", JSON.stringify(this.accounts));
    } else {
      localStorage.removeItem("currentAccountList");
    }
  }
  getXrpcClient() {
    return this.rpc;
  }
  async resolveHandle(handle: string) {
    return await resolveFromIdentity(handle);
  }
  async getOAuthRedirectUri(meta: {
    identity: IdentityMetadata;
    metadata: AuthorizationServerMetadata;
  }) {
    return await createAuthorizationUrl({
      metadata: meta.metadata,
      identity: meta.identity,
      scope: "atproto transition:generic",
    });
  }

  async finalizeAuthorization(code: URLSearchParams) {
    const sess = await finalizeAuthorization(code);
    console.log("Logging in as ", sess.info.sub);
    const agent = new OAuthUserAgent(sess);
    this.currentAgent = agent;
    this.currentAgentDid = agent.sub;
    this.accounts.push(agent.sub);
    this.rpc = new XRPC({ handler: this.manager });
    this.updateState();
    console.log("Successfully logged in!");
  }

  async attemptResumeSession() {
    console.log("Attempting resume session");
    try {
      if (this.currentAgentDid) {
        await this.switchAccount(this.currentAgentDid);
        console.log("Session resumed successfully");
      } else {
        for (const did of this.accounts) {
          try {
            await this.switchAccount(did);
            console.log(`Session resumed successfully for ${did}`);
            break;
          } catch (error) {
            console.error(`Error resuming session for ${did}:`, error);
          }
        }
      }
      console.log("No session to resume");
    } catch (error) {
      console.error("Error resuming session:", error);
    }
  }

  async switchAccount(did: `did:${string}`) {
    const sess = await getSession(did);
    if (!sess) {
      throw new Error(`No session found for ${did}`);
    }
    const agent = new OAuthUserAgent(sess);
    this.currentAgent = agent;
    this.currentAgentDid = agent.sub;
    this.rpc = new XRPC({ handler: this.manager });
    this.updateState();
  }

  async logout(did: `did:${string}`) {
    const currentDid = this.currentAgent?.sub;
    await this.switchAccount(did);
    await this.currentAgent?.signOut();
    deleteStoredSession(did);
    this.accounts = this.accounts.filter((a) => a !== did);
    this.currentAgentDid = currentDid !== did ? currentDid || null : null; // Update currentAgentDid
    if (currentDid && currentDid !== did) {
      await this.switchAccount(currentDid);
    } else {
      this.currentAgent = null;
      this.updateState();
    }
  }
}

export async function resolveBskyUser(did: `did:${string}`, qt: QtContextType) {
  const context = qt;

  const cachedData = context.userCache.get(did);
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
    return cachedData.data;
  }

  const response = await new QtClient(new URL("https://public.api.bsky.app"))
    .getXrpcClient()
    .get("app.bsky.actor.getProfile", {
      params: { actor: did },
    });

  context.userCache.set(did, {
    data: response,
    timestamp: now,
  });

  return response;
}

export function useQt() {
  const client = React.useContext(QtContext);
  if (!client) {
    throw new Error("useQtState must be used within a QtProvider");
  }
  return {
    currentAgent: client.currentAgent,
    accounts: client.accounts,
  };
}
export function useUserCache() {
  const context = React.useContext(QtContext);
  if (!context) {
    throw new Error("useUserCache must be used within a QtProvider");
  }
  return context.userCache;
}
