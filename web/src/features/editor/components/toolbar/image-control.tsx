import { useRef, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { Editor } from "@tiptap/react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { uploadImage } from "../../actions/upload-image.action";
import { toast } from "sonner";

export function ImageControl({ editor, documentId }: { editor: Editor, documentId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const toastId = toast.loading("Uploading image...");
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        
        const result = await uploadImage(documentId, formData);
        
        if (result.error) {
          toast.error(result.error, { id: toastId });
        } else if (result.success && result.publicUrl) {
          editor.chain().focus().setImage({ src: result.publicUrl }).run();
          toast.success("Image uploaded", { id: toastId });
        }
      } catch {
        toast.error("Failed to upload image", { id: toastId });
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <TooltipWrapper
        title="Embed Image"
        description="Upload an image from your PC."
      >
        <button
          onClick={triggerImageUpload}
          onMouseDown={(e) => e.preventDefault()}
          disabled={isUploading}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Add Image"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>
      </TooltipWrapper>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
    </>
  );
}
