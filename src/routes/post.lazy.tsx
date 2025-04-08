import ShowError from "@/components/error";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { QtContext } from "@/providers/qtprovider";
import { AppBskyFeedPost } from "@atcute/client/lexicons";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useContext, useRef, useState } from "preact/hooks";

interface ImageMetadata {
  file: File;
  altText: string;
  aspectRatio?: { width: number; height: number };
}

async function downscaleImage(
  file: File,
  maxSize: number = 1000000,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;
      let quality = 0.9;
      let blob: Blob | null = null;

      // First pass: try with original dimensions
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Try to get under maxSize with quality reduction first
      while (quality > 0.1) {
        blob = canvas.toBlob(
          (b) => {
            if (b && b.size <= maxSize) {
              resolve(b);
            } else if (quality > 0.1) {
              quality -= 0.1;
              canvas.toBlob((b) => (blob = b), "image/jpeg", quality);
            } else {
              // If we get here, we need to reduce dimensions
              width *= 0.9;
              height *= 0.9;
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);
              quality = 0.9;
              canvas.toBlob((b) => (blob = b), "image/jpeg", quality);
            }
          },
          "image/jpeg",
          quality,
        );
      }

      // If we still haven't resolved, use the last blob
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not downscale image sufficiently"));
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export const Route = createLazyFileRoute("/post")({
  component: RouteComponent,
});

function RouteComponent() {
  const qt = useContext(QtContext);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const [postToBluesky, setPostToBluesky] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  if (!qt?.currentAgent) {
    return (
      <ShowError
        error={new Error("You need to be logged in to use this tool")}
      />
    );
  }

  const getImageAspectRatio = (
    file: File,
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const postImages = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);

      let originalBlobs = [];
      let bskyBlobs = [];

      // Upload both original and downscaled images
      for (const imageData of images) {
        // Original upload
        const originalBlob = new Blob([imageData.file], {
          type: imageData.file.type,
        });
        const originalRes = await qt.client.rpc.call(
          "com.atproto.repo.uploadBlob",
          {
            data: originalBlob,
          },
        );
        if (!originalRes.data) {
          throw new Error(`Failed to post original image!`);
        }
        originalBlobs.push({
          blob: originalRes.data.blob,
          metadata: imageData,
        });

        // Downscaled upload for Bluesky if enabled
        if (postToBluesky) {
          const downscaledBlob = await downscaleImage(imageData.file);
          const bskyRes = await qt.client.rpc.call(
            "com.atproto.repo.uploadBlob",
            {
              data: downscaledBlob,
            },
          );
          if (!bskyRes.data) {
            throw new Error(`Failed to post downscaled image!`);
          }
          bskyBlobs.push({ blob: bskyRes.data.blob, metadata: imageData });
        }
      }

      // Create dummy record with original images
      let processedImages = originalBlobs.map((b) => ({
        image: b.blob,
        alt: b.metadata.altText,
        aspectRatio: b.metadata.aspectRatio,
      }));

      let dummyRecord: AppBskyFeedPost.Record = {
        text: "",
        createdAt: new Date().toISOString(),
        embed: {
          $type: "app.bsky.embed.images",
          images: processedImages,
        },
        $type: "com.example.feed.post",
      } as any as AppBskyFeedPost.Record;

      // Post dummy record
      let did = qt.currentAgent?.sub;
      if (!did) {
        throw new Error("Could not get DID");
      }

      let dummyRes = await qt.client.rpc.call("com.atproto.repo.createRecord", {
        data: {
          collection: "com.example.feed.post",
          record: dummyRecord,
          repo: did,
        },
      });

      // Post to Bluesky if enabled
      if (postToBluesky && bskyBlobs.length > 0) {
        let bskyImages = bskyBlobs.map((b) => ({
          image: b.blob,
          alt: b.metadata.altText,
          aspectRatio: b.metadata.aspectRatio,
        }));

        let bskyRecord: AppBskyFeedPost.Record = {
          text: "",
          createdAt: new Date().toISOString(),
          embed: {
            $type: "app.bsky.embed.images",
            images: bskyImages,
          },
          $type: "app.bsky.feed.post",
        };

        await qt.client.rpc.call("com.atproto.repo.createRecord", {
          data: {
            collection: "app.bsky.feed.post",
            record: bskyRecord,
            repo: did,
          },
        });
      }

      // Navigate to the dummy post
      const segs = dummyRes.data.uri.replace("at://", "").split("/");
      navigate({
        to: "/at:/$handle/$collection/$rkey",
        params: {
          handle: segs[0],
          collection: segs[1],
          rkey: segs[2],
        },
      });

      setImages([]);
    } catch (error) {
      console.error(error);
      setUploadError(
        error instanceof Error ? error : new Error("Upload failed"),
      );
    } finally {
      setIsUploading(false);
    }
  };
  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const newFiles = Array.from(input.files || []);

    const processedImages = await Promise.all(
      newFiles.map(async (file) => ({
        file,
        altText: "",
        aspectRatio: await getImageAspectRatio(file),
      })),
    );

    setImages((currentImages) => {
      const updatedImages = [...currentImages, ...processedImages];
      return updatedImages.slice(0, 4);
    });

    // Reset input value to allow selecting the same file again
    input.value = "";
  };

  const removeImage = (index: number) => {
    setImages((currentImages) => currentImages.filter((_, i) => i !== index));
  };

  const updateAltText = (index: number, altText: string) => {
    setImages((currentImages) =>
      currentImages.map((img, i) => (i === index ? { ...img, altText } : img)),
    );
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 h-full w-full flex justify-center items-center">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Post Images</CardTitle>
          <p className="max-w-lg self-center text-center text-pretty">
            This tool posts images to a dummy lexicon in case one needs to link
            a high res image on a third-party ATProto CDN.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <label htmlFor="bluesky-post" className="text-sm font-medium">
              Also post to Bluesky
            </label>
            <Switch
              id="bluesky-post"
              checked={postToBluesky}
              onCheckedChange={setPostToBluesky}
            />
          </div>
          <div className="flex flex-col items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              multiple
              disabled={isUploading || images.length >= 4}
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              variant="outline"
              className="w-full max-w-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || images.length >= 4}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Select Images (up to 4)
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((imageData, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-3">
                  <div className="relative aspect-video mb-3">
                    <img
                      src={URL.createObjectURL(imageData.file)}
                      alt={imageData.altText || imageData.file.name}
                      className="absolute inset-0 w-full h-full object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => removeImage(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={imageData.altText}
                    onChange={(e) =>
                      updateAltText(index, (e.target as HTMLInputElement).value)
                    }
                    placeholder="Add alt text for accessibility"
                    className="w-full"
                    disabled={isUploading}
                  />
                </CardContent>
              </Card>
            ))}
            {images.length < 1 && (
              <div className="h-full w-full min-w-64 aspect-video bg-muted rounded-xl"></div>
            )}
          </div>

          {images.length > 0 && (
            <Button
              className="w-full"
              onClick={postImages}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Post Images"
              )}
            </Button>
          )}

          {uploadError && <ShowError error={uploadError} />}
        </CardContent>
      </Card>
    </div>
  );
}
