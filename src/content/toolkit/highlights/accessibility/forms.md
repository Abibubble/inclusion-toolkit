### What is it for?

An accessible form is an online form that everyone can fill in, including people with vision, movement, or cognitive disabilities. It collects information, such as contact details, sign-ups, feedback, or payments. It does this in a way that is clear and easy for everyone to use, including people who use screen readers or only a keyboard.

Inaccessible forms create significant barriers that can prevent people from completing essential tasks. These barriers include:

- Missing or unlinked labels: Screen reader users don't know what information to enter in a form field
- Poor keyboard navigation: Users who cannot use a mouse are unable to 'Tab' to form fields, buttons, or links in a logical order, or they get trapped in one section
- Vague error messages: Errors that only use a red border (relying on colour alone) or say "Invalid input" don't tell a user what is wrong or how to fix it
- Small tap targets: Small radio buttons or checkboxes are difficult to select for users with motor impairments
- Overly complex layouts or time limits can create cognitive barriers, making the form confusing or stressful to complete

All modern web browsers and assistive technologies (like screen readers) fully support the standard HTML elements (`<label>`, `<input>`, `<fieldset>`, `<legend>`, etc.) and Accessible Rich Internet Applications (ARIA) attributes needed to create accessible forms.

### How to support it

To ensure your form is accessible, you should build it with semantic HTML and clear instructions from the start.

- Always use `<label>` tags and associate them with their inputs (using the `for` and `id` attributes)
  - Placeholder text (e.g., "Enter your name") is not a substitute for a label
- Group related fields
  - Use a `<fieldset>` to group related items (like a set of radio buttons for a "Yes/No" question, or the fields for a shipping address) and a `<legend>` to describe the group
- Provide clear error validation
  - When a form has errors after the user submits it, the message should be in text, identify the specific field, clearly describe the problem, and suggest a correction
- Ensure full keyboard accessibility
  - A user must be able to navigate to every form field, link, and button using only the keyboard (for example 'Tab', 'Shift + Tab', the arrow keys and 'Space'), in a logical sequence.
- Use high-contrast colours for text, borders, and controls, and ensure all clickable elements have a large enough target size.

### Useful links

- [World Wide Web Consortium (W3C) WAI: Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/)
- [WebAIM: Creating Accessible Forms](https://webaim.org/techniques/forms/)
- [MDN: Web Forms](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms)
