import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export const SlashMenuList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-md flex flex-col gap-1 p-1 w-48 z-50">
      {props.items.map((item: any, index: number) => (
        <button
          className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm text-left ${
            index === selectedIndex
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          {item.icon}
          {item.title}
        </button>
      ))}
    </div>
  );
});

SlashMenuList.displayName = 'SlashMenuList';
