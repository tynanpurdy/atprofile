import { XRPC, CredentialManager } from "@atcute/client";
import React from "preact/compat";

export const QtContext = React.createContext<QtClient | null>(null);

export function useXrpc(): XRPC {
  const client = React.useContext(QtContext);
  if (!client) {
    throw new Error("useXrpc must be used within a QtProvider");
  }
  return client.rpc;
}

export class QtClient {
  manager: CredentialManager;
  rpc: XRPC;
  constructor(service: URL = new URL("https://bsky.social")) {
    this.manager = new CredentialManager({ service: service.toString() });
    this.rpc = new XRPC({ handler: this.manager });
  }
  getXrpcClient() {
    return this.rpc;
  }
}
