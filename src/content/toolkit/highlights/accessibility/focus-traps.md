### What is it for?

A focus trap keeps keyboard focus inside one part of the page while it's open, such as a modal. Pressing Tab only moves between the items inside it, so the user doesn't get lost on the page behind it. A good focus trap always lets the user leave, for example by pressing Escape or using a close button.

### How to support it

Only use a focus trap where it's needed, such as in a modal. Unwanted traps can be added by accident. Always test your pages using only the keyboard before any changes go live.

If you really do want a focus trap, use a ready-made accessible component like a Modal. It handles the focus trap for you.

NOTE: It’s very important to understand that this highlight is about focus traps, NOT keyboard traps. A keyboard trap fails SC 2.1.2: No Keyboard Trap (Level A). That’s when you end up stuck somewhere, such as a modal, and you can’t get out of it without using a mouse!

### Useful links

- [A Primer on Focus Trapping](https://css-tricks.com/a-primer-on-focus-trapping/)
- [How to Build Accessible Modals with Focus Traps](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/)
