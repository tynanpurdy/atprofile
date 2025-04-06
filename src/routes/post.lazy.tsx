import ShowError from "@/components/error";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export const Route = createLazyFileRoute("/post")({
  component: RouteComponent,
});

function RouteComponent() {
  const qt = useContext(QtContext);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
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

      let blobs = [];

      for (const imageData of images) {
        const blob = new Blob([imageData.file], { type: imageData.file.type });
        const res = await qt.client.rpc.call("com.atproto.repo.uploadBlob", {
          data: blob,
        });
        if (!res.data) {
          throw new Error(`Failed to post image!`);
        }
        blobs.push({ blob: res.data.blob, metadata: imageData });
      }

      let processedImages = blobs.map((b) => ({
        image: b.blob,
        alt: b.metadata.altText,
        aspectRatio: b.metadata.aspectRatio,
      }));

      let postRecord: AppBskyFeedPost.Record = {
        text: "",
        createdAt: new Date().toISOString(),
        embed: {
          $type: "app.bsky.embed.images",
          images: processedImages,
        },
        // i know
        $type: "com.example.feed.post",
      } as any as AppBskyFeedPost.Record;

      let did = qt.currentAgent?.sub;
      if (!did) {
        alert("COULD NOT GET DID????");
      }

      let res = await qt.client.rpc.call("com.atproto.repo.createRecord", {
        data: {
          collection: "com.example.feed.post",
          record: postRecord,
          repo: did!,
        },
      });

      // for example: at://did:web:nat.vg/com.example.feed.post/rkey
      const segs = res.data.uri.replace("at://", "").split("/");
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
