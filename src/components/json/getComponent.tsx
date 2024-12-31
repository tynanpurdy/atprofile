import { AppBskyEmbedImagesLayout } from "./appBskyEmbedImages";

export const getComponent = (type: string) => {
  switch (type) {
    case "app.bsky.embed.images":
      return AppBskyEmbedImagesLayout;
    default:
      return null;
  }
};
