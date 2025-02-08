import { X } from "lucide-react";
import { useState } from "preact/hooks";
import { getBlueskyCdnLink } from "./appBskyEmbedImages";

export default function BlobLayout({
  did,
  dollar_link: ref,
  mimeType,
  author_pds: pds,
}: {
  did: string;
  dollar_link?: string;
  mimeType?: string;
  author_pds?: string;
}) {
  if (mimeType === undefined || ref === undefined)
    return <>Unsupported blob type</>;
  if (mimeType?.includes("image")) {
    return ImageGridLayout({
      images: [
        {
          url: getBlueskyCdnLink(did, ref, "jpeg"),
        },
      ],
    });
  }
  return (
    <a
      className="text-blue-700 dark:text-blue-400"
      href={`${pds}xrpc/com.atproto.sync.getBlob?did=${did}&cid=${ref}`}
    >
      Download {mimeType} file at{" "}
      {pds?.replace("https://", "").replace("/", "")} ({ref})
    </a>
  );
}

interface ImageInfo {
  url: string;
  alt?: string;
}

export const ImageGridLayout = ({ images }: { images: ImageInfo[] }) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const imageCount = images.length;

  // Different grid layouts based on number of images
  const gridClassName =
    {
      1: "grid-cols-2",
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
              src={image.url}
              alt={image.alt || ""}
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
              src={images[selectedImage].url}
              alt={images[selectedImage].alt || ""}
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
