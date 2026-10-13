# Dropdown Component Standards

Always use `react-select` (`Select` from `'react-select'`) for all dropdowns across the application.
**Do NOT use native HTML `<select>` elements.**

## Requirements & Styling
1. **Component**: Always use `<Select>` from `'react-select'`.
2. **Class Prefix**: Set `classNamePrefix="react-select select"`.
3. **No Focus/Select Border**: Ensure dropdowns do not have annoying default browser focus rings or borders on select (`border: "none !important"`, `boxShadow: "none !important"`, `outline: "none !important"`).
4. **Theme / Palette**: Match the theme styling used in `src/feature-module/pos/pos.tsx` (primary orange `#f26522`, soft hover `#fff2e8`).
5. **Portals for Modals & Accordions**: When dropdowns are used inside inputs, accordions, tables, or modals, set `menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}` and appropriate high `zIndex` to prevent clipping.
