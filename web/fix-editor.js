const fs = require('fs');

const editorFile = 'src/features/editor/components/editor.tsx';
let content = fs.readFileSync(editorFile, 'utf8');

// 1. Remove unnecessary Tiptap imports
const importsToRemove = [
  'StarterKit from "@tiptap/starter-kit"',
  'Placeholder from "@tiptap/extension-placeholder"',
  '{ TextStyle } from "@tiptap/extension-text-style"',
  '{ Color } from "@tiptap/extension-color"',
  'Link from "@tiptap/extension-link"',
  '{ ResizableImage } from "../extensions/resizable-image"',
  'Underline from "@tiptap/extension-underline"',
  'TextAlign from "@tiptap/extension-text-align"',
  'Highlight from "@tiptap/extension-highlight"',
  'TaskList from "@tiptap/extension-task-list"',
  'TaskItem from "@tiptap/extension-task-item"',
  'FontFamily from "@tiptap/extension-font-family"',
  'Table from "@tiptap/extension-table"',
  'TableRow from "@tiptap/extension-table-row"',
  'TableCell from "@tiptap/extension-table-cell"',
  'TableHeader from "@tiptap/extension-table-header"',
  '{ InlineQuote } from "../extensions/inline-quote"',
  'Collaboration from "@tiptap/extension-collaboration"',
  'CollaborationCursor from "@tiptap/extension-collaboration-cursor"',
  '{ PaginationPlus } from "tiptap-pagination-plus"',
  '{ FontSize } from "../extensions/font-size"',
  '{ SlashCommand, slashSuggestion } from "../extensions/slash-command"'
];

let newContent = content.split('\n').filter(line => {
  return !importsToRemove.some(imp => line.includes(imp));
}).join('\n');

// Remove CustomLink component
newContent = newContent.replace(/const CustomLink = Link\.extend\(\{[\s\S]*?\}\);\n*/m, '');

// Add import for editor-config
newContent = `import { getEditorExtensions, editorPropsConfig } from "@/utils/editor-config";\n` + newContent;

// Replace extensions and editorProps
const replacementStr = `        extensions={getEditorExtensions({ documentId, ydoc, provider, currentUserName })}
        editorProps={{
          ...editorPropsConfig,
        }}`;

// We use regex to carefully match extensions={[...]} and editorProps={{...}} up to immediatelyRender
newContent = newContent.replace(/extensions=\{\[[\s\S]*?\]\}\s+editorProps=\{\{[\s\S]*?\}\}/m, replacementStr);

fs.writeFileSync(editorFile, newContent);
console.log('Fixed editor.tsx');
