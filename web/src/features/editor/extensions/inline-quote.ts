import { Mark, mergeAttributes } from '@tiptap/core';

export const InlineQuote = Mark.create({
  name: 'inlineQuote',
  inclusive: false,

  parseHTML() {
    return [
      {
        tag: 'q',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['q', mergeAttributes(HTMLAttributes), 0];
  },
});
