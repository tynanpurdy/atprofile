import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { useState } from "preact/hooks";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";

const getBlueskyCdnLink = (did: string, cid: string, ext: string) => {
  return `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@${ext}`;
};

export const AppBskyEmbedImagesLayout = ({
  did,
  images,
}: {
  did: string;
  images: AppBskyEmbedImages.Image[];
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const imageCount = images.length;

  const gridClassName =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-2",
      4: "grid-cols-2",
    }[Math.min(imageCount, 4)] || "grid-cols-2";

  return (
    <>
      <div className={`grid ${gridClassName} gap-2 w-full`}>
        {images.map((image, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-lg cursor-pointer ${
              imageCount === 3 && i === 0 ? "col-span-2" : ""
            }`}
            onClick={() => setSelectedImage(i)}
          >
            <img
              src={getBlueskyCdnLink(did, image.image.ref.$link, "jpeg")}
              alt=""
              className="w-full h-full cursor-pointer object-cover transition-transform duration-300 hover:scale-105 max-h-64"
              style={{
                aspectRatio: imageCount === 1 ? "" : "1/1",
              }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <Dialog
        open={selectedImage !== null}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogOverlay className="bg-black/80" />
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent">
          <div className="relative inline-block">
            {selectedImage !== null && (
              <>
                <img
                  src={getBlueskyCdnLink(
                    did,
                    images[selectedImage].image.ref.$link,
                    "png",
                  )}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                {images[selectedImage].alt && (
                  <div className="text-white text-center mt-2">
                    Alt text: {images[selectedImage].alt}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
