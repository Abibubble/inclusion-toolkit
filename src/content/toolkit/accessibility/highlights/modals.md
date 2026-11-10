### What is it for?

Modals are manually triggered pop-ups that provide extra information. For example, a shop might use a modal to explain what each condition grade of a refurbished phone means, opened from a link next to the grades.

Modals make it possible to include all the required information on a page, without presenting users with a giant page full of text. It means they can choose when to view more information about certain things. Modals can also be used for filtering and sorting options, allowing those to take up less space too.

Modals are incredibly useful for (but not limited to):

- People with cognitive impairments
- People with ADHD
- People with autism
- Screen reader users

[Almost fully supported (Can I use: dialog element)](https://caniuse.com/dialog) - Internet Explorer, Opera Mini and KaiOS don't support it, though those aren't widely used.

### How to support it

In general, modals can be tricky to build accessibly. Important considerations include the user's focus and keyboard navigation.

- When the modal opens, move focus into it
- While it's open, keep focus inside the modal so keyboard users can't tab to the page behind it
- Let users close it with the Escape key as well as a visible close button
- When it closes, return focus to the element that opened it

The native HTML `<dialog>` element handles much of this for you, so use it, or an existing accessible modal component from your design system, rather than building one from scratch.

### Useful links

- [Accessibility Essentials - Modals](https://martijnhols.nl/blog/accessibility-essentials-every-front-end-developer-should-know#modals)
