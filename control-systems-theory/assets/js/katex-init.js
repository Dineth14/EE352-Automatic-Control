/**
 * assets/js/katex-init.js
 * Initializes renderMathInElement for the document.
 * Assumes KaTeX is loaded via CDN in the HTML.
 */

export function initKaTeX() {
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false,
      errorColor: '#ff3d71'
    });
  } else {
    console.warn("KaTeX not loaded on the page.");
  }
}
