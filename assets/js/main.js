/* NextSelf — shared behaviour
   Scroll reveal · sticky nav · mobile menu · FAQ accordion · count-up
   · pricing tabs · newsletter · access gate.
   No dependencies, no build step. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll reveal ------------------------------------------------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    /* Snap straight to the visible state. Deliberately bypasses the transition:
       a fallback that depends on an animation running is not a fallback. */
    var showAll = function () {
      els.forEach(function (el) {
        el.style.transition = 'none';
        el.classList.add('is-in');
      });
    };

    if (reduced || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    /* Safety net. If the observer never fires — a background/uncomposited tab,
       a viewport the browser reports as zero — the page would otherwise sit at
       opacity 0 forever. After 2.5s, anything still hidden is simply shown. */
    setTimeout(function () {
      var stuck = document.querySelectorAll('.reveal:not(.is-in)');
      if (stuck.length === els.length) showAll();
    }, 2500);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings that share a parent, capped so late items aren't slow.
        var sibs = Array.prototype.filter.call(
          el.parentNode.children,
          function (n) { return n.classList && n.classList.contains('reveal'); }
        );
        var i = sibs.indexOf(el);
        el.style.setProperty('--d', Math.min(i, 5) * 60 + 'ms');
        el.classList.add('is-in');
        io.unobserve(el); // fire once
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- Nav ----------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = nav.querySelector('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ---- FAQ accordion ------------------------------------------------- */
  function initFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      var panel = item.querySelector('.faq-a');
      if (!btn || !panel) return;

      var close = function () {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        panel.style.height = '0px';
      };
      var open = function () {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.height = panel.firstElementChild.offsetHeight + 'px';
      };

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        // One open at a time, within this group.
        item.closest('.faq').querySelectorAll('.faq-item.is-open').forEach(function (o) {
          if (o === item) return;
          o.classList.remove('is-open');
          o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          o.querySelector('.faq-a').style.height = '0px';
        });
        isOpen ? close() : open();
      });
    });

    // Keep an open panel correctly sized when the text reflows.
    window.addEventListener('resize', function () {
      document.querySelectorAll('.faq-item.is-open .faq-a').forEach(function (p) {
        p.style.height = p.firstElementChild.offsetHeight + 'px';
      });
    });
  }

  /* ---- Count-up ------------------------------------------------------ */
  function initCount() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      nums.forEach(function (n) { n.textContent = n.dataset.prefix || '';
        n.textContent += n.dataset.count + (n.dataset.suffix || ''); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.dataset.count);
        var pre = el.dataset.prefix || '';
        var suf = el.dataset.suffix || '';
        var t0 = null;
        var dur = 1100;
        function tick(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + Math.round(target * eased) + suf;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---- Pricing tabs -------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var tabs = group.querySelectorAll('.tab');
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) {
            t.setAttribute('aria-selected', String(t === tab));
          });
          var panelId = tab.getAttribute('aria-controls');
          group.querySelectorAll('[role="tabpanel"]').forEach(function (p) {
            p.hidden = p.id !== panelId;
          });
        });
      });
    });
  }

  /* ---- Newsletter ---------------------------------------------------- */
  /* No backend yet — this validates and hands off to mail. When The Brief gets
     a real provider (Beehiiv/ConvertKit), replace this with their endpoint. */
  function initBrief() {
    var form = document.querySelector('.brief-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var msg = document.querySelector('.brief-msg');
      if (!input.value || !input.checkValidity()) {
        input.focus();
        return;
      }
      window.location.href =
        'mailto:hello@nextselfcoach.com' +
        '?subject=' + encodeURIComponent('Subscribe to The NextSelf Brief') +
        '&body=' + encodeURIComponent('Please add this address to The NextSelf Brief: ' + input.value);
      if (msg) {
        msg.textContent = 'Opening your email client to confirm — thank you.';
        msg.classList.add('is-shown');
      }
      form.reset();
    });
  }

  /* ---- Access gate --------------------------------------------------- */
  /* Positioning device, not security: the page content is present in the DOM
     regardless. Real privacy needs host-level auth (Cloudflare Access, Netlify
     password, basic auth). Documented in README.md. */
  function initGate() {
    var gate = document.querySelector('.gate');
    if (!gate) return;

    var KEY = 'nextself-access';
    var CODE = gate.dataset.code || '';

    var unlock = function (persist) {
      gate.classList.add('is-hidden');
      document.body.classList.remove('is-gated');
      if (persist) {
        try { sessionStorage.setItem(KEY, '1'); } catch (err) { /* private mode */ }
      }
    };

    var already = false;
    try { already = sessionStorage.getItem(KEY) === '1'; } catch (err) { /* ignore */ }

    // A referral link (?access=…) opens it without typing anything.
    var param = new URLSearchParams(window.location.search).get('access');
    if (already || (param && param.toLowerCase() === CODE)) {
      unlock(true);
      return;
    }

    document.body.classList.add('is-gated');
    var form = gate.querySelector('form');
    var input = gate.querySelector('input');
    var err = gate.querySelector('.err');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value.trim().toLowerCase() === CODE) {
        unlock(true);
      } else {
        err.textContent = 'That code was not recognised.';
        input.value = '';
        input.focus();
      }
    });
  }

  /* ---- Booking embed ------------------------------------------------- */
  /* The scheduler is third-party and gets blocked by some privacy extensions.
     Nothing is stacked behind the iframe (that bled through, since the widget
     is transparent) — instead the error state is revealed only on real failure. */
  function initBooking() {
    var wrap = document.querySelector('[data-booking]');
    if (!wrap) return;
    var frame = wrap.querySelector('iframe');
    if (!frame) return;

    // Only a real error event flips to the failed state. Deliberately no
    // timeout: the frame is cross-origin, so we cannot inspect whether it
    // rendered, and if it finished loading before this script ran the load
    // event never fires — a timer would then hide a perfectly working
    // calendar behind an error. The "Open in a new tab" link below the frame
    // is the always-available fallback instead.
    frame.addEventListener('error', function () { wrap.classList.add('is-failed'); });
  }

  /* ---- Testimonial demo preview -------------------------------------- */
  /* The published page must never show invented quotes. The samples live in a
     <template> and are injected only when the URL carries ?demo=1, so they can
     be shown to a stakeholder without ever appearing to the public. */
  function initTestimonialDemo() {
    var grid = document.getElementById('tm-grid');
    var tpl = document.getElementById('tm-samples');
    if (!grid || !tpl) return;

    var demo = new URLSearchParams(window.location.search).get('demo') === '1';
    if (!demo) return;

    grid.appendChild(tpl.content.cloneNode(true));

    var empty = document.getElementById('tm-empty');
    if (empty) empty.hidden = true;

    var banner = document.getElementById('tm-demo-banner');
    if (banner) banner.hidden = false;
  }

  /* ---- Year ---------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function init() {
    initGate();
    initNav();
    initReveal();
    initFaq();
    initCount();
    initTabs();
    initBrief();
    initBooking();
    initTestimonialDemo();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
