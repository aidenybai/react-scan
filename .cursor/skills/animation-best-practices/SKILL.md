---
name: animation-best-practices
description: CSS and UI animation patterns for responsive, polished interfaces. Use when implementing hover effects, tooltips, button feedback, transitions, or fixing animation issues like flicker and shakiness.
version: 1.0.0
---

# Practical Animation Tips

Detailed reference guide for common animation scenarios. Use this as a checklist when implementing animations.

## Recording & Debugging

### Record Your Animations

When something feels off but you can't identify why, record the animation and play it back frame by frame. This reveals details invisible at normal speed.

### Fix Shaky Animations

Elements may shift by 1px at the start/end of CSS transform animations due to GPU/CPU rendering handoff.

**Fix:**

```css
.element {
  will-change: transform;
}
```

This tells the browser to keep the element on the GPU throughout the animation.

### Take Breaks

Don't code and ship animations in one sitting. Step away, return with fresh eyes. The best animations are reviewed and refined over days, not hours.

## Button & Click Feedback

### Scale Buttons on Press

Make interfaces feel responsive by adding subtle scale feedback:

```css
button:active {
  transform: scale(0.97);
}
```

This gives instant visual feedback that the interface is listening.

### Don't Animate from scale(0)

Starting from `scale(0)` makes elements appear from nowhere—it feels unnatural.

**Bad:**

```css
.element {
  transform: scale(0);
}
.element.visible {
  transform: scale(1);
}
```

**Good:**

```css
.element {
  transform: scale(0.95);
  opacity: 0;
}
.element.visible {
  transform: scale(1);
  opacity: 1;
}
```

Elements should always have some visible shape, like a deflated balloon.

## Tooltips & Popovers

### Skip Animation on Subsequent Tooltips

First tooltip: delay + animation. Subsequent tooltips (while one is open): instant, no delay.

```css
.tooltip {
  transition:
    transform 125ms ease-out,
    opacity 125ms ease-out;
  transform-origin: var(--transform-origin);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

/* Skip animation for subsequent tooltips */
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

Radix UI and Base UI support this pattern with `data-instant` attribute.

### Make Animations Origin-Aware

Popovers should scale from their trigger, not from center.

```css
/* Default (wrong for most cases) */
.popover {
  transform-origin: center;
}

/* Correct - scale from trigger */
.popover {
  transform-origin: var(--transform-origin);
}
```

**Radix UI:**

```css
.popover {
  transform-origin: var(--radix-dropdown-menu-content-transform-origin);
}
```

**Base UI:**

```css
.popover {
  transform-origin: var(--transform-origin);
}
```

## Speed & Timing

### Keep Animations Fast

A faster-spinning spinner makes apps feel faster even with identical load times. A 180ms select animation feels more responsive than 400ms.

**Rule:** UI animations should stay under 300ms.

### Don't Animate Keyboard Interactions

Arrow key navigation, keyboard shortcuts—these are repeated hundreds of times daily. Animation makes them feel slow and disconnected.

**Never animate:**

- List navigation with arrow keys
- Keyboard shortcut responses
- Tab/focus movements

### Be Careful with Frequently-Used Elements

A hover effect is nice, but if triggered multiple times a day, it may benefit from no animation at all.

**Guideline:** Use your own product daily. You'll discover which animations become annoying through repeated use.

## Hover States

### Fix Hover Flicker

When hover animation changes element position, the cursor may leave the element, causing flicker.

**Problem:**

```css
.box:hover {
  transform: translateY(-20%);
}
```

**Solution:** Animate a child element instead:

```html
<div class="box">
  <div class="box-inner"></div>
</div>
```

```css
.box:hover .box-inner {
  transform: translateY(-20%);
}

.box-inner {
  transition: transform 200ms ease;
}
```

The parent's hover area stays stable while the child moves.

### Disable Hover on Touch Devices

Touch devices don't have true hover. Accidental finger movement triggers unwanted hover states.

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: scale(1.05);
  }
}
```

**Note:** Tailwind v4's `hover:` class automatically applies only when the device supports hover.

## Touch & Accessibility

### Ensure Appropriate Target Areas

Small buttons are hard to tap. Use a pseudo-element to create larger hit areas without changing layout.

**Minimum target:** 44px (Apple and WCAG recommendation)

```css
@utility touch-hitbox {
  position: relative;
}

@utility touch-hitbox::before {
  content: "";
  position: absolute;
  display: block;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  min-height: 44px;
  min-width: 44px;
  z-index: 9999;
}
```

Usage:

```jsx
<button className="touch-hitbox">
  <BellIcon />
</button>
```

## Easing Selection

### Use ease-out for Enter/Exit

Elements entering or exiting should use `ease-out`. The fast start creates responsiveness.

```css
.dropdown {
  transition:
    transform 200ms ease-out,
    opacity 200ms ease-out;
}
```

`ease-in` starts slow—wrong for UI. Same duration feels slower because the movement is back-loaded.

### Use ease-in-out for On-Screen Movement

Elements already visible that need to move should use `ease-in-out`. Mimics natural acceleration/deceleration like a car.

```css
.slider-handle {
  transition: transform 250ms ease-in-out;
}
```

### Use Custom Easing Curves

Built-in CSS curves are usually too weak. Custom curves create more intentional motion.

**Resources:**

- [easings.co](https://easings.co/)

## Visual Tricks

### Use Blur as a Fallback

When easing and timing adjustments don't solve the problem, add subtle blur to mask imperfections.

```css
.button-transition {
  transition:
    transform 150ms ease-out,
    filter 150ms ease-out;
}

.button-transition:active {
  transform: scale(0.97);
  filter: blur(2px);
}
```

Blur bridges visual gaps between states, tricking the eye into seeing smoother transitions. The two states blend instead of appearing as distinct objects.

**Performance note:** Keep blur under 20px, especially on Safari.

## Why Details Matter

> "All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune."
> — Paul Graham, Hackers and Painters

Details that go unnoticed are good—users complete tasks without friction. Great interfaces enable users to achieve goals with ease, not to admire animations.
