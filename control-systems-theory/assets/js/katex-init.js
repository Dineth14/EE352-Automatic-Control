/* ============================================================
   KaTeX Auto-Render Configuration
   ============================================================ */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
          '\\R': '\\mathbb{R}',
          '\\C': '\\mathbb{C}',
          '\\Z': '\\mathbb{Z}',
          '\\N': '\\mathbb{N}',
          '\\tr': '\\operatorname{tr}',
          '\\rank': '\\operatorname{rank}',
          '\\diag': '\\operatorname{diag}',
          '\\sgn': '\\operatorname{sgn}',
          '\\Re': '\\operatorname{Re}',
          '\\Im': '\\operatorname{Im}'
        }
      });
    }
  });
})();
