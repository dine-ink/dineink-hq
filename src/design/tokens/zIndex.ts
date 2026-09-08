// Single source of truth for stacking order. The app already uses z-10/20
// for local decorative layering (background blobs, sticky cells) and
// z-40/50 for overlays — this file names each layer's *purpose* so a new
// overlay always stacks correctly relative to existing ones without
// guessing a number.

export const zIndex = {
  base: 0,
  decoration: 10, // background blobs, subtle layered accents within a card
  stickyHeader: 20, // sticky table headers, sticky page headers
  dropdown: 30,
  overlay: 40, // modal/drawer backdrop
  modal: 50, // dialog/drawer content
  tooltip: 60,
  // Toasts must beat every dialog, including Headless UI ones, which portal
  // to the end of <body> and so win a z-50 tie against a toast mounted inside
  // #root (the setup dialog's success/failure toast was hidden behind it).
  toast: 70,
} as const;

export default zIndex;
