### In short

Buttons and links need to be big enough to press without touching something else by mistake. This helps people with shaky hands, or using a phone on a bus or train. Aim for at least 48 by 48 pixels, with a gap of 8 pixels between them.

### What is it for?

Make sure interactive elements, like buttons or links, are large enough and have enough space around them. This makes them easy to press without touching other elements by mistake.

Small tap targets can cause rage clicks, where the user has to try to click on an interactive element more than once. Larger tap targets can remove barriers for a number of users, including (but not limited to):

- Users who use a mobile device where a touchscreen is the primary mode of interaction
- Users with mobility impairments, such as hand tremors
- Users who use a mobile device in environments where they are exposed to shaking, such as public transport
- Users who find fine motor movements difficult
- Users who access a device using one hand
- Users with large fingers, or who are operating the device with only a part of their finger or knuckle
- Users who have low vision may better see the target

You don't need any special code for this. Just make sure your tap targets are large enough, with enough of a gap between them.

### How to support it

Web Content Accessibility Guidelines (WCAG) 2.2 requires tap targets to be at least 24 by 24 CSS pixels at Level AA, unless there's enough space around them. This is SC 2.5.8 Target Size (Minimum). At Level AAA, they must be at least 44 by 44 CSS pixels. This is SC 2.5.5 Target Size (Enhanced). These sizes mean that a user's finger pressing on one tap target does not touch another tap target by mistake.

_Note:_ `px` _means_ `pixels`

Google's Material Design recommends a minimum tap target size of 48 by 48 pixels, with a gap of at least 8 pixels between tap targets. This is larger than the minimum required by WCAG.

An area of 48 by 48 pixels is about 9 millimetres across, which is about the size of the pad of a person's finger.

Design and build every interactive element to be at least 48 by 48 pixels, with a gap of 8 pixels between tap targets. The only exception is text links within a paragraph.

```
button {
    min-width: 48px;
    min-height: 48px;
    margin: 8px;
}
```

An icon inside a link may only be 24 by 24 pixels. You can add padding to the link to bring the tap target size up to 48 by 48 pixels.

```
a {
    display: inline-block;
    margin: 8px;
    padding: 12px;
}
```

### Useful links

- [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [How to use typography, touch targets, and spacing for better accessibility](https://www.brightec.co.uk/blog/how-to-use-typography-touch-targets-and-spacing-for-better-accessibility#:~:text=Touch%20targets%20and%20spacing%20considerations)
- [Accessible tap targets cheat sheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
