/**
 * Site search for Straatambassadeurs
 * Requires search-index.js to be loaded first (provides SEARCH_INDEX)
 */
(function() {
  'use strict';

  const input = document.getElementById('site-search');
  const resultsDiv = document.getElementById('search-results');
  if (!input || !resultsDiv || typeof SEARCH_INDEX === 'undefined') return;

  let debounceTimer;

  function normalize(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function findSnippet(text, query, contextLen) {
    contextLen = contextLen || 60;
    const normText = normalize(text);
    const normQuery = normalize(query);
    const idx = normText.indexOf(normQuery);
    if (idx === -1) return '';
    const start = Math.max(0, idx - contextLen);
    const end = Math.min(text.length, idx + query.length + contextLen);
    let snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    // Bold the match
    const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    snippet = snippet.replace(re, '<mark>$1</mark>');
    return snippet;
  }

  function search(query) {
    if (!query || query.length < 2) { hide(); return; }
    const terms = normalize(query).split(/\s+/).filter(Boolean);

    const results = SEARCH_INDEX
      .map(function(page) {
        const normText = normalize(page.text);
        const normTitle = normalize(page.title);
        let score = 0;
        let allMatch = true;
        terms.forEach(function(term) {
          const inTitle = normTitle.indexOf(term) !== -1;
          const inText = normText.indexOf(term) !== -1;
          if (!inTitle && !inText) { allMatch = false; return; }
          if (inTitle) score += 10;
          if (inText) score += 1;
        });
        if (!allMatch) return null;
        return { page: page, score: score };
      })
      .filter(Boolean)
      .sort(function(a, b) { return b.score - a.score; })
      .slice(0, 8);

    render(results, query);
  }

  function render(results, query) {
    if (results.length === 0) {
      resultsDiv.innerHTML = '<div class="search-no-results">Geen resultaten voor "' +
        query.replace(/</g, '&lt;') + '"</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    var html = results.map(function(r) {
      var snippet = findSnippet(r.page.text, query);
      return '<a class="search-result-item" href="' + r.page.url + '">' +
        '<div class="search-result-title">' + r.page.title.replace(/</g, '&lt;') + '</div>' +
        (snippet ? '<div class="search-result-snippet">' + snippet + '</div>' : '') +
        '</a>';
    }).join('');

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
  }

  function hide() {
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';
  }

  input.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      search(input.value.trim());
    }, 200);
  });

  // Close on click outside
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
      hide();
    }
  });

  // Close on Escape
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { hide(); input.blur(); }
  });
})();
