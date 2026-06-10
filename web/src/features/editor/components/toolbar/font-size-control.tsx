import { Editor } from "@tiptap/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FONT_SIZES = [
  "8px",
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "30px",
  "36px",
  "48px",
  "60px",
  "72px",
];

export function FontSizeControl({ editor }: { editor: Editor }) {
  const getCurrentFontSize = () => {
    const inlineSize = editor.getAttributes("textStyle").fontSize;
    if (inlineSize) return inlineSize;

    if (editor.isActive("heading", { level: 1 })) return "36px";
    if (editor.isActive("heading", { level: 2 })) return "24px";
    if (editor.isActive("heading", { level: 3 })) return "20px";

    return "16px";
  };

  return (
    <div className="flex items-center ml-1 mr-1">
      <Select
        value={getCurrentFontSize()}
        onValueChange={(value) => {
          editor.chain().focus().setFontSize(value).run();
        }}
      >
        <SelectTrigger className="h-8 w-20 text-xs font-medium focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent position="popper">
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={size} className="text-xs">
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
