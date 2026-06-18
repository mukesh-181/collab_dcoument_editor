import { useMemo } from 'react';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

// Extensions needed to render the preview (read-only, no collab/cursor/slash)
const previewExtensions = [
  StarterKit.configure({
    codeBlock: false,
    horizontalRule: false,
    history: false,
  }),
  TextStyle,
  Color,
  Underline,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({
    types: ['heading', 'paragraph', 'listItem', 'taskItem'],
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Link.configure({ openOnClick: false }),
  Image,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
];

export function useDocumentPreview(json: Record<string, unknown> | null | undefined) {
  const html = useMemo(() => {
    if (!json) return '';
    try {
      return generateHTML(json, previewExtensions);
    } catch {
      return '';
    }
  }, [json]);

  return html;
}
