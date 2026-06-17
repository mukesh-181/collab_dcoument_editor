/**
 * Page Content Extraction Utility
 *
 * Extracts HTML content for each page from the ProseMirror editor
 * using DOM measurement based on pagination extension configuration.
 */

interface PaginationConfig {
  pageHeight: number;
  marginTop: number;
  marginBottom: number;
  contentMarginTop: number;
  contentMarginBottom: number;
}

const DEFAULT_CONFIG: PaginationConfig = {
  pageHeight: 1123,
  marginTop: 72,
  marginBottom: 72,
  contentMarginTop: 8,
  contentMarginBottom: 8,
};

/**
 * Strips only problematic inline styles, preserving collaboration cursor styles
 */
function cleanHtmlForThumbnail(html: string): string {
  // Only remove width/max-width/transform styles that cause layout issues
  // Preserve styles needed for collaboration cursors (color, position, background, etc)
  return html.replace(/\s*style="([^"]*)"/gi, (match, styleContent: string) => {
    // Keep the style if it doesn't contain problematic layout properties
    if (
      /\b(width|max-width|min-width|transform|flex|display):\s*[^;]*/i.test(
        styleContent,
      )
    ) {
      // Remove only the problematic properties, keep the rest
      const cleaned = styleContent
        .split(";")
        .filter(
          (prop: string) =>
            !/\b(width|max-width|min-width|transform|flex|display):/i.test(
              prop,
            ),
        )
        .join(";")
        .trim();
      return cleaned ? ` style="${cleaned}"` : "";
    }
    // Keep the entire style attribute if no problematic properties found
    return ` style="${styleContent}"`;
  });
}

/**
 * Calculates the available content height per page
 */
export function getAvailablePageHeight(
  config: PaginationConfig = DEFAULT_CONFIG,
): number {
  return config.pageHeight - config.marginTop - config.marginBottom;
}

/**
 * Extracts HTML content for a specific page by measuring element positions
 * against the calculated page height boundaries.
 *
 * Approach:
 * 1. Iterate through all children in the ProseMirror DOM
 * 2. Skip pagination widget nodes (rm-pages-wrapper)
 * 3. Measure each element's height and position
 * 4. Include elements that START within the target page's vertical range (strict boundary)
 * 5. Clean inline styles to prevent layout conflicts
 */
export function extractPageContent(
  pageNumber: number,
  config: PaginationConfig = DEFAULT_CONFIG,
): string {
  const editor = document.querySelector(".ProseMirror") as HTMLElement;
  if (!editor) return "";

  if (pageNumber < 1) return "";

  // Use actual DOM geometry instead of manual height summing.
  // tiptap-pagination-plus renders pages of `pageHeight` with a `pageGap` between them.
  // We use 40 as the gap as defined in editor-extensions.ts.
  const pageStride = config.pageHeight + 40;

  // The vertical range for this specific page relative to the top of the editor
  const pageStartY = (pageNumber - 1) * pageStride;
  const pageEndY = pageStartY + config.pageHeight;

  let pageContent = "";
  const editorRect = editor.getBoundingClientRect();

  for (const child of Array.from(editor.children) as HTMLElement[]) {
    // Skip pagination widget containers and other non-content elements
    if (
      child.classList.contains("rm-pages-wrapper") ||
      child.classList.contains("ProseMirror-widget") ||
      child.classList.contains("yRemoteSelection") ||
      child.classList.contains("collaboration-cursor") ||
      child.getAttribute("data-placeholder") !== null ||
      child.contentEditable === "true"
    ) {
      continue;
    }

    const childRect = child.getBoundingClientRect();
    const elementStartY = childRect.top - editorRect.top;
    const elementEndY = childRect.bottom - editorRect.top;

    // Include elements that overlap with this page's vertical bounds
    const overlapsPage = elementStartY < pageEndY && elementEndY > pageStartY;

    if (overlapsPage) {
      let elementHtml = child.outerHTML;
      elementHtml = cleanHtmlForThumbnail(elementHtml);
      
      // Force margin to 0 on the top-level element to prevent offset inside the absolute wrapper
      elementHtml = elementHtml.replace(/^<([a-zA-Z0-9\-]+)([^>]*)>/, (match, tag, rest) => {
        if (rest.includes('style="')) {
          return `<${tag}${rest.replace(/style="/, 'style="margin: 0 !important; ')}>`;
        }
        return `<${tag} style="margin: 0 !important;"${rest}>`;
      });
      
      // Calculate position relative to the start of this specific page
      const relativeTop = elementStartY - pageStartY;
      
      // Use absolute positioning to place the element exactly where it appears in the editor
      pageContent += `<div style="position: absolute; top: ${relativeTop}px; left: 0; right: 0; padding: 0 64px; box-sizing: border-box;">${elementHtml}</div>`;
    }

    // Stop if we've clearly passed this page
    if (elementStartY >= pageEndY) {
      break;
    }
  }

  return pageContent;
}

export function extractAllPageContents(
  config: PaginationConfig = DEFAULT_CONFIG,
): string[] {
  const contents: string[] = [];
  const pageCount = getPageCount(config);

  // Extract content for each page, including empty ones
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const content = extractPageContent(pageNum, config);
    contents.push(content || "");
  }

  return contents;
}

export function getPageCount(
  config: PaginationConfig = DEFAULT_CONFIG,
): number {
  // Count actual page markers created by the pagination extension
  // This includes empty pages that are created but have no content
  const pageMarkers = document.querySelectorAll(
    "#pages > .rm-page-break > .page",
  );

  // Return at least 1 page (for empty document), but can be 0 if pagination hasn't rendered yet
  return Math.max(1, pageMarkers.length);
}
