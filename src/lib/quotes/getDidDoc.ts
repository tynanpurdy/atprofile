import { DidDocument } from "@atcute/client/utils/did";

export default async function getDidDoc(did: string): Promise<DidDocument> {
  try {
    if (did.startsWith("did:web:")) {
      const response = await fetch(
        `https://${did.replace("did:web:", "")}/.well-known/did.json`,
      );
      return await response.json();
    } else if (did.startsWith("did:plc")) {
      const response = await fetch(`https://plc.directory/${did}`);
      return await response.json();
    }
    throw new Error(`Unsupported DID format: ${did}`);
  } catch (error) {
    throw new Error(
      `Failed to fetch DID document: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
