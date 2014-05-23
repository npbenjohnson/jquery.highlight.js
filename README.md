jquery.highlight.js
===================

jQuery plugin which searches an element for text and highlights by wrapping them in spans.

Usage
-----
```js
$('Element').highlight(terms, [options]);
```

Terms can be a string or array of strings.

Options (shown with defaults)
-------
```js
  {
    // Highlight highlights children, any other setting removes highlights
    action: 'highlight',
    // CSS class of highlight spans
    highlightClass: 'highlighted',
    // Comparable to REGEX meaning of greedy for highlights
    greedy: true,
    // Automatically calls unhighlight on element before performing a highlight
    autoClear: true
  }
```

Notes
------
1. When highlighting, whitespace the the browser would compress before rendering is replaced in any elements containing text so that searching using terms with spaces in them has a better chance of correct identification.
2. With autoClear turned off, adjacent spans aren't merged on subsequent searches, so after highlighting a of 'as', subsequently highlighting 'as' would create ```<span class="highlighted">a</span><span class="highlighted">s</span>```
