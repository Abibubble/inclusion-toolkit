### What is it for?

Form errors are a major barrier for all users, but they can completely block users with disabilities. Inaccessible errors include:

- Just highlighting a field in red is useless for screen reader users and people with colour blindness
- Vague messages like 'Invalid input' or 'Error' tell the user nothing about how to fix it
- When a form fails to submit, screen reader users are often left at the top of the page, not knowing what or where the error is

This is a core design pattern, not a single tag. Support depends on using standard HTML and Accessible Rich Internet Applications (ARIA) attributes (`aria-describedby`, `aria-invalid`, `aria-live`) correctly. This is a key part of Web Content Accessibility Guidelines (WCAG)'s 'Perceivable', 'Understandable' and 'Robust' principles and works in all modern browsers.

### How to support it

Errors need to be clear, visible, and announced.

- Be specific. Don't say 'Invalid', instead say something like 'Please enter a valid email address (e.g., name@example.com).'
- Don't use colour alone, always add a text message and/or an accessible icon (like an `X`) next to the field.
- Connect the error. Use `aria-describedby` to programmatically link the input field to its error message. This tells screen readers to announce the error when the user focuses on that field
- Manage Focus. When a form submission fails, ideally, move focus to the first field with an error. If that's not possible, move the focus to a summary of errors at the top of the form
- Use aria-invalid="true". Set this on the input field so assistive tech knows it has an error

### Useful links

- [World Wide Web Consortium (W3C) WAI - Validating Input](https://www.w3.org/WAI/tutorials/forms/validation/)
- [Level Access - Designer Tips: Creating Accessible Forms](https://www.levelaccess.com/blog/designer-tips-creating-accessible-forms/)
