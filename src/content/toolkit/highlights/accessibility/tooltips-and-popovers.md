### What is it for?

Tooltips and popovers give users extra info on demand (like for an icon button). But they often fail accessibility by being:

- Mouse-only. They don't appear for keyboard users (focus).
- Silent. Screen readers don't announce the new content.
- Hard to close. Users get 'stuck', or the tooltip vanishes too fast.

It's important to note that popovers and modals are not the same thing. A modal demands your full attention, while a popover just offers extra information.

### How to support it

They must work for keyboard, mouse, and screen reader users.

- For simple tooltips (read-only info):
  - Show on hover and focus
  - Keep it visible while the pointer is over it, and let users close it with the Escape key
  - Use aria-describedby to link the trigger button to the tooltip. This is how screen readers announce it
- For complex popovers (with buttons/links inside):
  - Trigger on click (not hover). This is more robust
  - Manage keyboard focus: Move focus into the popover when it opens, and return it to the trigger button when it closes. Don't trap focus inside, as that's only for modals
  - Make it easy to close: Support the Escape key and include a visible close button

### Useful links

- [Accessible Rich Internet Applications (ARIA) Authoring Practices - Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
