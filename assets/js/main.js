/* NextSelf — shared behaviour
   Scroll reveal · sticky nav · mobile menu · FAQ accordion · count-up
   · pricing tabs · newsletter · access gate.
   No dependencies, no build step. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll reveal ------------------------------------------------- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    var pending = els.slice();
    var io = null;

    /* Once an element has finished revealing it leaves the system entirely:
       dropping .reveal removes the hidden state and the transition override, so
       nothing can hide it again and its own hover transforms work. */
    var settle = function (el) {
      el.style.transition = 'none';
      el.classList.remove('reveal', 'is-in');
      el.style.removeProperty('--d');
      void el.offsetWidth; // commit the final state before transitions return
      el.style.removeProperty('transition');
    };

    var reveal = function (el, animate) {
      var k = pending.indexOf(el);
      if (k === -1) return;
      pending.splice(k, 1);
      if (io) io.unobserve(el);
      // Survives settle(), so entrance effects inside the element can key off it.
      el.classList.add('was-revealed');
      if (!animate) { settle(el); return; }

      el.classList.add('is-in');
      var done = false;
      var finish = function () { if (!done) { done = true; settle(el); } };
      el.addEventListener('transitionend', function (e) {
        if (e.target === el && e.propertyName === 'opacity') finish();
      });
      // transitionend never fires in a background tab or an interrupted
      // transition; don't leave the element half-faded waiting for it.
      var delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
      setTimeout(finish, delay + 1000);
    };

    /* Snap straight to the visible state. Deliberately bypasses the transition:
       a fallback that depends on an animation running is not a fallback. */
    var showAll = function () {
      pending.slice().forEach(function (el) { reveal(el, false); });
    };

    if (reduced || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    // Stagger siblings that share a parent, capped so late items aren't slow.
    els.forEach(function (el) {
      var sibs = Array.prototype.filter.call(
        el.parentNode.children,
        function (n) { return els.indexOf(n) !== -1; }
      );
      el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 60 + 'ms');
    });

    /* Geometry check that doesn't depend on the observer. Anything in view is
       revealed; anything already scrolled past — a fast fling, an anchor jump,
       a restored scroll position — is shown instantly instead of waiting
       invisibly above the viewport. */
    var sweep = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (!vh) { showAll(); return; }
      pending.slice().forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom <= 0) reveal(el, false);
        else if (r.top < vh * 0.92) reveal(el, true);
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    };

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; sweep(); });
    };

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) reveal(entry.target, true);
        else if (entry.boundingClientRect.bottom <= 0) reveal(entry.target, false);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    els.forEach(function (el) { io.observe(el); });

    // Hero and page-header content is in view at load: reveal it now rather
    // than waiting on the observer's first callback.
    sweep();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pageshow', sweep);

    /* Safety net. If the observer never fires — a background/uncomposited tab,
       a viewport the browser reports as zero — re-check geometry, and if still
       nothing has been shown, show everything. */
    setTimeout(function () {
      sweep();
      if (pending.length === els.length) showAll();
    }, 2500);
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
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
