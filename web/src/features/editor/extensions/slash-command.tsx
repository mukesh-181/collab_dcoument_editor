import React from 'react';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance } from 'tippy.js';
import { SlashMenuList } from '@/features/editor/components/slash-menu-list';
import { Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Image as ImageIcon, Table as TableIcon } from 'lucide-react';

export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: 'Heading 1',
      icon: <Heading1 className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      icon: <Heading3 className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      icon: <List className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        let alignment: string | null = null;
        if (editor.isActive({ textAlign: "center" })) alignment = "center";
        else if (editor.isActive({ textAlign: "right" })) alignment = "right";
        else if (editor.isActive({ textAlign: "justify" })) alignment = "justify";

        let chain = editor.chain().focus().deleteRange(range).toggleBulletList();
        if (alignment) {
          chain = chain.setTextAlign(alignment);
        }
        chain.run();
      },
    },
    {
      title: 'Numbered List',
      icon: <ListOrdered className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        let alignment: string | null = null;
        if (editor.isActive({ textAlign: "center" })) alignment = "center";
        else if (editor.isActive({ textAlign: "right" })) alignment = "right";
        else if (editor.isActive({ textAlign: "justify" })) alignment = "justify";

        let chain = editor.chain().focus().deleteRange(range).toggleOrderedList();
        if (alignment) {
          chain = chain.setTextAlign(alignment);
        }
        chain.run();
      },
    },
    {
      title: 'Task List',
      icon: <CheckSquare className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        let alignment: string | null = null;
        if (editor.isActive({ textAlign: "center" })) alignment = "center";
        else if (editor.isActive({ textAlign: "right" })) alignment = "right";
        else if (editor.isActive({ textAlign: "justify" })) alignment = "justify";

        let chain = editor.chain().focus().deleteRange(range).toggleTaskList();
        if (alignment) {
          chain = chain.setTextAlign(alignment);
        }
        chain.run();
      },
    },

    {
      title: 'Table',
      icon: <TableIcon className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      },
    },

  ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
};

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const slashSuggestion = {
  items: getSuggestionItems,
  render: () => {
    let component: ReactRenderer;
    let popup: Instance[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashMenuList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return (component.ref as any)?.onKeyDown(props);
      },

      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};
