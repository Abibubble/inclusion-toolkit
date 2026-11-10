### What is it for?

Dark mode is a colour option that flips the user's view from the typical dark text on a light background to light text on a dark background. So instead of blinding white screens, things take on a darker hue. It applies a separate, darker colour scheme to websites, apps, operating systems, and devices to tone down the brightness.

In recent years, the adoption of dark mode has increased, with [many users preferring it over light mode across various operating systems](https://www.blogcadre.com/resources/how-many-people-use-dark-mode/).

However, dark mode isn't the all-encompassing accessibility fix that many people believe it to be. Let's take a look at the pros and cons of incorporating dark mode.

Pros

1. Many people prefer dark mode (but not all)
2. On OLED and AMOLED screens, it can be more eco-friendly, as pixels showing pure black are switched off, which saves battery
3. It can enhance readability and reduce eye strain, especially in low-light conditions
4. For users with light sensitivity or photophobia, it provides a gentler visual experience, allowing for better focus

Cons

1. Some visually impaired users can find light mode more comfortable
2. Some users with astigmatism may have issues with reading white text on a black background, as the edges can become blurred. This is similar to the issue caused by street lights when driving at night, and is called halation
3. It can cause issues for users with certain types of colour blindness
4. Lack of consistency across platforms - email is especially complex, which can lead to a bad user experience

### How to support it

In code, add a line to use the user's system preferences (using the [prefers-color-scheme media query](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme)), or add a toggle switch to allow the user to switch between dark and light mode. Ideally, do both: follow the system setting by default, and offer a toggle. This gives the user full control of their experience. The difficulty is ensuring the correct CSS is in place to handle differing colours.

In emails, it's much more complex, as different email clients will render dark mode differently. Some will use the email’s own styling, whereas others apply a basic colour inversion, and others apply their own dark mode styling.

### Useful links

- [Dark mode & accessibility myth](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/)
- [Inclusive Dark Mode: Designing Accessible Dark Themes For All Users](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [Pros and cons of using dark mode](https://accessibility.wayne.edu/news/pros-and-cons-of-using-dark-mode-62969)
- [5 myths about dark mode - and the realities](https://builtin.com/articles/myths-realities-dark-mode-ui)
