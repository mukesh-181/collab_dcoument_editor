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
 * 3. Measure each element's top position relative to the editor
 * 4. Include ONLY elements whose TOP edge starts within the target page's
 *    vertical range: elementStartY >= pageStartY && elementStartY < pageEndY
 *    (with a 1px tolerance for sub-pixel rounding)
 * 5. This ensures each element belongs to exactly ONE page — no duplication,
 *    no "first line of page N appearing as last line of page N-1".
 * 6. Return elements as normal flowing HTML (NO absolute positioning).
 *    The thumbnail container in page-thumbnails.tsx already applies
 *    padding: 72px 64px for the page margins — adding absolute offsets here
 *    would double-apply the margin and cause the exact bug we're fixing.
 */
export function extractPageContent(
  pageNumber: number,
  config: PaginationConfig = DEFAULT_CONFIG,
): string {
  const editor = document.querySelector(".ProseMirror") as HTMLElement;
  if (!editor) return "";

  if (pageNumber < 1) return "";

  // tiptap-pagination-plus renders pages of `pageHeight` with a `pageGap` between them.
  // pageGap is 40 as defined in editor-extensions.ts.
  const pageStride = config.pageHeight + 40;

  // The vertical range for this specific page, relative to the top of the editor element.
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

    // 1px tolerance for sub-pixel rounding from the browser
    const TOLERANCE = 1;

    // Strict: only include elements whose TOP starts within this page's range.
    // Using elementStartY (not elementEndY) guarantees each element belongs to
    // exactly one page — whichever page its top edge falls in.
    const startsOnThisPage =
      elementStartY >= pageStartY - TOLERANCE &&
      elementStartY < pageEndY - TOLERANCE;

    if (startsOnThisPage) {
      // Append as normal flowing HTML — no absolute positioning.
      // The thumbnail wrapper in page-thumbnails.tsx handles margins via padding.
      pageContent += cleanHtmlForThumbnail(child.outerHTML);
    }

    // Once we've passed this page, no further elements can belong to it.
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
  const pageCount = getPageCount();

  // Extract content for each page, including empty ones
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const content = extractPageContent(pageNum, config);
    contents.push(content || "");
  }

  return contents;
}

export function getPageCount() {
  // Count actual page markers created by the pagination extension
  // This includes empty pages that are created but have no content
  const pageMarkers = document.querySelectorAll(
    "#pages > .rm-page-break > .page",
  );

  // Return at least 1 page (for empty document), but can be 0 if pagination hasn't rendered yet
  return Math.max(1, pageMarkers.length);
}
