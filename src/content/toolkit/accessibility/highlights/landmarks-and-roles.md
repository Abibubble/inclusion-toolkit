### In short

Screen reader users can jump to parts of a page, like the menu, using landmarks. Roles tell them what each item is, such as a button. Use the right HTML tags, and both are added for you.

### What is it for?

Imagine trying to navigate a city with no street signs, where every building looks exactly the same. That is what a website feels like to a screen reader user without Landmarks and Roles.

- Landmarks: These are like zones on a map. They tell the user 'This is the Navigation' or 'This is the Main Content'. They let users jump right to what they want to read.
- Roles: These are like name tags. They tell the user exactly what an item is. A plain box tells the user nothing, but a 'Button' role says, 'Click me!'

It is supported universally. All browsers understand standard HTML tags automatically. It's just a matter of choosing the right ones.

### How to support it

The best way is to use semantic HTML (standard HTML tags). When you use the right tag, the landmark or role is added for you automatically.

- Landmarks: Use `<nav>` for menus and `<main>` for your main content.
- Roles: Use `<button>` for buttons and `<a>` for links.

#### Making a plain box act like a button

You can use code to force a plain box (`<div>`) to act like a `<button>`, but it is risky, and takes much more work.

- Using a `<button>` tag is like buying a chair. It comes ready to sit on.
- Using a `<div>` is like buying a pile of wood and writing 'Chair' on it. It says it's a chair, but you have to build the legs yourself (for example, add keyboard support) or it will fall apart.

### Useful links

- [CSS Tricks - Why, How, and When to Use Semantic HTML and Accessible Rich Internet Applications (ARIA)](https://css-tricks.com/why-how-and-when-to-use-semantic-html-and-aria/)
- [HTML Semantics and Accessibility Cheat Sheet](https://webaim.org/resources/htmlcheatsheet/)
- [How to Improve Web Accessibility with Landmarks](https://www.freecodecamp.org/news/improve-web-accessibility-with-landmarks/)
