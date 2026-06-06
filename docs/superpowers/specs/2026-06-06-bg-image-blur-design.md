# Blurred Background Image Design

## Summary

Use `src/assets/bg.png` as the primary full-screen dashboard background and blur that image heavily behind the shell UI.

The blur should apply only to the image layer, not to the header, cards, or footer.

## Goals

- Replace the current background emphasis with the existing `bg.png` asset
- Keep the shell content sharp and readable
- Apply a strong blur effect that reads as a softened backdrop rather than a foreground treatment
- Keep the change scoped to the top-level app shell

## Non-Goals

- Changing card internals
- Reworking the shell header/footer layout
- Introducing dynamic background behavior or animation
- Adding new image assets

## Recommended Approach

Add a dedicated absolute-positioned background layer in `src/App.tsx`.

Why this approach:

- It blurs the image itself instead of blurring UI content
- It keeps the visual treatment local to the app shell rather than mixed into global body styles
- It allows a dark overlay to be tuned independently for readability

## Architecture

### Layout Layering

`App` should render two top-level visual layers inside the main shell container:

1. A background layer that fills the viewport
2. A foreground content layer that contains the header, card grid, and footer

The foreground layer remains relatively positioned above the background layer.

### Background Layer

The background layer should:

- Use `bg.png` as a full-bleed image
- Fill the visible shell area
- Use `background-size: cover`
- Use centered positioning
- Apply a strong CSS blur effect
- Add a dark overlay so the shell stays readable

The blur should be visually heavy rather than subtle.

## Styling Direction

- Keep the existing dark cinematic tone
- Let the image provide atmosphere while the overlay preserves contrast
- Avoid making the background so sharp that it competes with cards and shell chrome
- Avoid washing out the image completely with too much opacity

## Implementation Boundaries

Likely files to touch:

- `src/App.tsx`
- optionally `src/styles/global.css` if a small utility class is clearer than inline Tailwind usage

This change should not require updates to server code, hooks, or tests outside of normal type verification.

## Testing Strategy

- Run `npm run typecheck`
- Verify the app renders with the blurred image behind the shell
- Confirm header, cards, and footer remain sharp and legible

## Success Criteria

- `bg.png` is used as the visible background
- The image is strongly blurred
- The shell content remains unblurred
- Overall contrast remains readable across the dashboard
