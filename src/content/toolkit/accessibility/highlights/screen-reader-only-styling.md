### What is it for?

Screen reader only styling ensures that everyone who uses a website can access the important information it contains. In most cases, this is achieved with semantics, alt text and aria labels. However, in some cases, something should only be 'seen' by screen readers.

For instance, a blog page might have several 'Read more' links. Sighted users can see which article each link is for, but a screen reader user moving from link to link would only hear 'Read more, Read more, Read more'. You can add extra words to each link, such as 'about accessible meetings', that are hidden visually but still read out by screen readers.

### How to support it

You can add the following to your CSS, LESS, SASS, or any other CSS-based styling:

`.sr-only {`

```
   border: 0;
   clip: rect(0 0 0 0);
   height: 0.0625rem;
   margin: -0.0625rem;
   overflow: hidden;
   padding: 0;
   position: absolute;
   width: 0.0625rem;
   white-space: nowrap;
}
```



When you're using things like display: none; consider whether a screen reader user would benefit from the thing you're hiding. That's a great time to use this styling!

### Useful links

- [WebAIM - Invisible content](https://webaim.org/techniques/css/invisiblecontent/#offscreen)
- [CSS Tricks - Inclusively Hidden](https://css-tricks.com/inclusively-hidden/)
