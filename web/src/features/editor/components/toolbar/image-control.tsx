import { useRef } from "react";
import { ImageIcon } from "lucide-react";
import { Editor } from "@tiptap/react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function ImageControl({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url }).run();
      // Reset input to allow selecting the same file again
      e.target.value = "";
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
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Add Image"
        >
          <ImageIcon className="h-4 w-4" />
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
