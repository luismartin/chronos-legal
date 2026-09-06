/* Chronos — Legal pages. Shared by index.html and delete-account.html.
 *
 * Progressive enhancement over a plain multilingual document: without JavaScript every
 * language is shown stacked (styled by legal.css). With JavaScript, this file:
 *   - picks the language from the URL hash (#en … #ko, or #es-3 for a section), a saved
 *     preference, or the browser language, before first paint (no flash);
 *   - wraps each language block (<h1 id="xx"> … up to the next one) in <section class="lang">;
 *   - moves the active <h1> and its <p class="muted"> into the hero;
 *   - builds the table of contents from the visible <h2>s and highlights the current one;
 *   - wraps tables so they can scroll horizontally on narrow screens;
 *   - keeps the header selector, the language pills and the URL hash in sync.
 * The legal text itself is never rewritten: nodes are only wrapped or moved.
 */
(function () {
  'use strict';
  var LANGS = ['en', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ko'];
  var STORAGE_KEY = 'chronos-legal-lang';
  var root = document.documentElement;

  function parseHash(hash) {
    var m = /^#?([a-z]{2})(?:-(\d+))?$/.exec(hash || '');
    if (!m || LANGS.indexOf(m[1]) < 0) return null;
    return { lang: m[1], section: m[2] || null };
  }

  function initialLang() {
    var fromHash = parseHash(location.hash);
    if (fromHash) return fromHash.lang;
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('chronos-lang'); } catch (e) {}
    if (saved && LANGS.indexOf(saved) >= 0) return saved;
    var prefs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).toLowerCase().slice(0, 2);
      if (LANGS.indexOf(code) >= 0) return code;
    }
    return 'en';
  }

  /* Before first paint: mark the document as JS-enhanced and pick the language. */
  var current = initialLang();
  root.classList.add('js');
  root.setAttribute('data-lang', current);
  root.lang = current;

  document.addEventListener('DOMContentLoaded', function () {
    var doc = document.getElementById('doc');
    var slot = document.getElementById('hero-slot');
    var tocLinks = document.getElementById('toc-links');
    var select = document.getElementById('lang-select');
    var top = document.getElementById('top');
    var pills = Array.prototype.slice.call(document.querySelectorAll('.langs a'));
    if (!doc) return;

    /* 1. Wrap each language block in <section class="lang" lang="xx" data-lang="xx"> */
    var sections = {};
    var section = null;
    Array.prototype.slice.call(doc.childNodes).forEach(function (node) {
      var isEl = node.nodeType === 1;
      if (isEl && node.tagName === 'H1' && LANGS.indexOf(node.id) >= 0) {
        section = document.createElement('section');
        section.className = 'lang';
        section.lang = node.id;
        section.setAttribute('data-lang', node.id);
        doc.insertBefore(section, node);
        sections[node.id] = section;
      }
      if (!section) return;
      if (isEl && (node.classList.contains('divider') || node.classList.contains('lang-nav'))) return;
      section.appendChild(node);
    });

    /* 2. Per language: section ids, accent numbers in headings, scrollable tables */
    LANGS.forEach(function (lang) {
      var sec = sections[lang];
      if (!sec) return;
      Array.prototype.forEach.call(sec.querySelectorAll('h2'), function (h2, i) {
        h2.id = lang + '-' + (i + 1);
        var first = h2.firstChild;
        if (first && first.nodeType === 3) {
          var m = /^(\s*\d+\.)/.exec(first.nodeValue);
          if (m) {
            var num = document.createElement('span');
            num.className = 'num';
            num.textContent = m[1];
            first.nodeValue = first.nodeValue.slice(m[1].length);
            h2.insertBefore(num, first);
          }
        }
      });
      Array.prototype.forEach.call(sec.querySelectorAll('table'), function (table) {
        var wrap = document.createElement('div');
        wrap.className = 'tablewrap';
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      });
    });

    /* 3. Hero: the active language's own <h1> and <p class="muted"> live in the hero slot */
    var heroNodes = [];
    function placeHero(lang) {
      heroNodes.forEach(function (n) { n.sec.insertBefore(n.el, n.sec.firstChild); });
      heroNodes = [];
      var sec = sections[lang];
      if (!sec || !slot) return;
      var h1 = sec.querySelector('h1');
      if (!h1) return;
      var lead = h1.nextElementSibling;
      var nodes = [h1];
      if (lead && lead.tagName === 'P' && lead.classList.contains('muted')) nodes.push(lead);
      nodes.forEach(function (el) { slot.appendChild(el); heroNodes.unshift({ el: el, sec: sec }); });
    }

    /* 4. Table of contents from the visible <h2>s */
    function buildToc(lang) {
      if (!tocLinks) return;
      tocLinks.textContent = '';
      var sec = sections[lang];
      if (!sec) return;
      Array.prototype.forEach.call(sec.querySelectorAll('h2[id]'), function (h2) {
        var a = document.createElement('a');
        a.href = '#' + h2.id;
        var num = document.createElement('span');
        num.className = 'num';
        var numEl = h2.querySelector('.num');
        num.textContent = numEl ? numEl.textContent.replace(/\.\s*$/, '').trim() : '';
        var label = document.createElement('span');
        label.textContent = (numEl ? h2.textContent.slice(numEl.textContent.length) : h2.textContent).trim();
        a.appendChild(num);
        a.appendChild(label);
        tocLinks.appendChild(a);
      });
    }

    function apply(lang) {
      current = lang;
      root.setAttribute('data-lang', lang);
      root.lang = lang;
      LANGS.forEach(function (l) { if (sections[l]) sections[l].classList.toggle('active', l === lang); });
      placeHero(lang);
      buildToc(lang);
      pills.forEach(function (a) {
        var on = parseHash(a.getAttribute('href'));
        var active = !!on && on.lang === lang;
        a.classList.toggle('on', active);
        if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      if (select && select.value !== lang) select.value = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      frame();
    }

    /* 5. Header shadow + active section in the table of contents */
    var raf = 0;
    function frame() {
      var y = window.scrollY || root.scrollTop || 0;
      if (top) top.classList.toggle('scrolled', y > 24);
      var sec = sections[current];
      if (!sec || !tocLinks) return;
      var active = null;
      var heads = sec.querySelectorAll('h2[id]');
      Array.prototype.forEach.call(heads, function (h) {
        if (h.getBoundingClientRect().top <= 120) active = h.id;
      });
      /* At the very end of the page the last section is the one being read, even if its heading never reaches the top. */
      if (heads.length && y + window.innerHeight >= root.scrollHeight - 2) active = heads[heads.length - 1].id;
      Array.prototype.forEach.call(tocLinks.querySelectorAll('a'), function (a) {
        var on = !!active && a.getAttribute('href') === '#' + active;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; frame(); });
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    /* 6. Language changes go through the URL hash, so #en … #ko links keep working everywhere */
    function scrollToSection(parsed) {
      if (!parsed.section) return;
      var el = document.getElementById(parsed.lang + '-' + parsed.section);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    window.addEventListener('hashchange', function () {
      var parsed = parseHash(location.hash);
      if (!parsed) return;
      if (parsed.lang !== current) {
        apply(parsed.lang);
        window.scrollTo({ top: 0, behavior: 'instant' });
        scrollToSection(parsed);
      }
    });
    if (select) {
      select.addEventListener('change', function () {
        var lang = select.value;
        if (LANGS.indexOf(lang) < 0 || lang === current) return;
        location.hash = '#' + lang;
      });
    }

    apply(current);
    var initial = parseHash(location.hash);
    if (initial && initial.section) {
      scrollToSection(initial);
      window.addEventListener('load', function () { scrollToSection(initial); }, { once: true });
    }
  });
})();
