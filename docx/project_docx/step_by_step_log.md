# Step-by-Step Log

## 2026-06-26 — Table Pagination & Column Resizing Polish

### Problem
1. When column resizing was enabled via CSS Grid rows (`tr` as `display: grid`), the browser's default layout engine (especially in WebKit/Blink) had issues resolving `display: contents` on table wrapper elements like `tbody` and `thead`. This caused a large visual gap (approximately 8-10px) to appear between the header row (`tr` containing `th` elements) and the first body row (`tr` containing `td` elements).
2. The gap occurred because the browser was creating anonymous table wrapper boxes or inserting spacing between the nested `tbody` elements inside the separate `div.table-row-group` blocks.
3. Dynamically loaded stylesheets injected by `PaginationPlus.js` had identical class selector specificities (e.g. `.rm-with-pagination table tbody > tr` using `!important`), which overrode the local custom grid layouts in the browser.

### Solution
1. **Neutralized browser table layout bugs**: Instead of setting `thead`, `tbody`, and `div.table-row-group` elements to `display: contents`, we set them to `display: block !important` in both `web/src/app/globals.css` and the inline style overrides of `web/src/features/editor/components/editor.tsx`.
2. **Removed default margins & paddings**: Set `margin: 0 !important`, `padding: 0 !important`, and `border: none !important` on `thead`, `tbody`, and `div.table-row-group` wrappers. Because they behave as standard block elements with 0 margin, they stack vertically without any gap.
3. **Escalated CSS selector specificity**: Prepended `.prose` and parent classes to all key table style rules (e.g. `.prose.rm-with-pagination table.table-plus tr`) to guarantee our layout overrides successfully beat dynamically injected styles from `tiptap-pagination-plus`.
4. **Preserved CSS Grid rows**: Kept the table row `tr` elements as `display: grid !important` with `grid-template-columns: var(--cell-percentage) !important`, which allows the cells to resize dynamically when the column drag handles are moved.
5. **Maintained table-level contents**: Kept the main `table` element at `display: contents !important` (or matching class rules) under pagination to ensure `tiptap-pagination-plus` can still partition table rows across multiple page boundaries.

## 2026-06-26 — Table Resizing Bounds & Precise Border Collapse

### Problem
1. **Column Crossing & Collapse**: The original `TablePlusNodeView` resize math converted percentages to pixels and divided by coordinates, resulting in `NaN` when dragging left quickly. This bypassed constraints and allowed column handles to cross or drop to `0%` width.
2. **Table Width Drift**: Dragging the rightmost handle allowed the sum of column percentages to drift away from 100%, causing the table to break layout.
3. **Double Border / Header Gap**: The selector `tr:first-of-type` matched the first row of both `thead` and `tbody`, applying a top border to both. This caused a double-border/gap between the header row and first body row.

### Solution
1. **Pure Percentage Clamping**:
   - Subclassed `TablePlusNodeView` as `CustomTablePlusNodeView` and overrode `addHandles` to compute mouse position and bounds purely in percentages: `mousePercent = (x / rect.width) * 100`.
   - Clamped the drag percent between `prevPercent + minPercent` and `nextPercent - minPercent`, preventing any columns from collapsing or crossing.
2. **Width Sum Protection**:
   - Hidden the last handle at index `N - 1` (`display: none` and `pointer-events: none`) so the rightmost edge cannot be dragged, locking the total width to 100%.
   - Overrode `updateHandlePositions` to dynamically show/hide handles when columns are added or removed.
3. **Precise Border Collapse**:
   - Updated `globals.css` and the inline editor styles to limit the top border to the table's first row: `thead tr:first-child > *` (or `tbody tr:first-child > *` only if no `thead` is present). This completely removes the double border gap below the header.
   - Added `margin: 0 !important` to `td`/`th` cells to prevent margins on grid items.
