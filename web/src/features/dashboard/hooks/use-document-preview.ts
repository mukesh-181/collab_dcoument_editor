import { useState, useMemo, useEffect } from 'react';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function useDocumentPreview(json: any) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const html = useMemo(() => {
    // Prevent SSR from running generateHTML because it requires the DOM (window)
    if (!json || !isMounted) return '';
    try {
      return generateHTML(json, [StarterKit]);
    } catch (e) {
      return '';
    }
  }, [json, isMounted]);

  return html;
}
