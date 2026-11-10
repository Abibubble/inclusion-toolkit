### What is it for?

Breadcrumbs are a secondary navigation system that shows a user's current location within a site's hierarchy. Their purpose is wayfinding: helping all users understand where they are, where the page sits in the site's structure, and how to navigate back to parent pages. This is essential for users with cognitive impairments and for screen reader users who need context to orient themselves.

Inaccessible wayfinding creates significant barriers. Users get 'lost' and disoriented, screen reader users lose context, and it increases the cognitive load for everyone. This forces users to rely on the 'Back' button or start their entire journey over.

### How to support it

To ensure your breadcrumbs are accessible, build them with semantic HTML.

Wrap them in a \<nav\> element with an aria-label="breadcrumb". This tells screen readers what this landmark is.

Use an ordered list (\<ol\>) because breadcrumbs represent a sequential path.

The last item (the current page) should not be a link. Identify it with the aria-current="page" attribute.

Hide visual separators (like \> or /) from screen readers by wrapping them in a \<span\> with aria-hidden="true".

### Useful links

- [Breadcrumbs for Accessibility: Examples & Best Practices](https://accessiblyapp.com/blog/breadcrumbs-accessibility/)
- [GOV.UK Design System: Breadcrumbs](https://design-system.service.gov.uk/components/breadcrumbs/)
- [The Admin Bar: Accessible Breadcrumbs](https://theadminbar.com/accessibility-weekly/accessible-breadcrumbs/)
