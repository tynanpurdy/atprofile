import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { X } from "lucide-react";
import { useState } from "preact/hooks";

export const getBlueskyCdnLink = (
  did: string,
  cid: string,
  ext: string,
  type: string = "feed_fullsize",
) => {
  return `https://cdn.bsky.app/img/${type}/plain/${did}/${cid}@${ext}`;
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

  // Different grid layouts based on number of images
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
              className={`w-full h-full cursor-pointer object-cover transition-transform duration-300 hover:scale-[101%] ${imageCount > 1 && "max-h-64"}`}
              style={{
                aspectRatio: imageCount === 1 ? "" : "1/1",
              }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {selectedImage !== null && (
        <>
          {/* Image Preview */}
          <div
            className="fixed inset-0 bg-black/80 flex flex-col gap-2 items-center justify-center z-50"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={getBlueskyCdnLink(
                did,
                images[selectedImage].image.ref.$link,
                "png",
              )}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            {images[selectedImage].alt && (
              <div className="text-white">
                Alt text: {images[selectedImage].alt}
              </div>
            )}
          </div>
          <div className="fixed top-2 right-2 z-50">
            <button
              className="text-blue-100 hover:text-red-400 transition-colors duration-300"
              onClick={() => setSelectedImage(null)}
            >
              <X />
            </button>
          </div>
        </>
      )}
    </>
  );
};
