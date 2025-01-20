import { AppBskyEmbedImagesLayout } from "./appBskyEmbedImages";
import BlobLayout from "./blob";

export const getComponent = (type: string) => {
  switch (type) {
    case "app.bsky.embed.images":
      return AppBskyEmbedImagesLayout;
    case "blob":
      return BlobLayout;
    default:
      return null;
  }
};
