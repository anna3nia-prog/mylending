(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 761px)").addEventListener("change", function (event) {
      if (event.matches) {
        setOpen(false);
      }
    });
  }

  var year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = year;
  });
})();

/* Появление блоков при прокрутке и акцент после «Выбрать курс».
   Работает только если движение не отключено в настройках системы. */
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

  var targets = document.querySelectorAll(
    "main .section-head, .courses-grid > .course, .buy-note, .steps > .step, .audience, .faq, .contacts-grid"
  );

  function finish(el) {
    el.classList.remove("reveal", "is-visible");
    el.style.removeProperty("--reveal-delay");
  }

  var observer = new IntersectionObserver(function (entries) {
    // Элементы, появившиеся одновременно, идут друг за другом: сверху вниз, слева направо
    var visible = entries
      .filter(function (entry) { return entry.isIntersecting; })
      .map(function (entry) { return entry.target; })
      .sort(function (a, b) {
        var ra = a.getBoundingClientRect();
        var rb = b.getBoundingClientRect();
        return Math.round(ra.top - rb.top) || ra.left - rb.left;
      });

    visible.forEach(function (el, i) {
      var isHead = el.classList.contains("section-head");
      el.style.setProperty("--reveal-delay", (isHead ? 0 : Math.min(i, 4) * 100 + 80) + "ms");
      el.classList.add("is-visible");
      observer.unobserve(el);
      // После появления снимаем служебные классы, чтобы задержка не мешала наведению
      window.setTimeout(function () { finish(el); }, 1400);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  targets.forEach(function (el) {
    el.classList.add("reveal");
    observer.observe(el);
  });

  // Если пользователь включит «уменьшение движения» во время просмотра — показываем всё сразу
  reduceMotion.addEventListener("change", function (event) {
    if (event.matches) {
      observer.disconnect();
      targets.forEach(finish);
    }
  });

  // Лёгкий акцент на первом ряду карточек после перехода по «Выбрать курс»
  var heroButton = document.querySelector('.hero-actions a[href="#courses"]');
  var cards = document.querySelectorAll(".courses-grid > .course");
  if (!heroButton || !cards.length) return;

  heroButton.addEventListener("click", function () {
    var done = false;
    function highlight() {
      if (done) return;
      done = true;
      var firstTop = Math.round(cards[0].getBoundingClientRect().top);
      cards.forEach(function (card) {
        if (Math.abs(Math.round(card.getBoundingClientRect().top) - firstTop) > 4) return;
        card.classList.remove("is-arrived");
        void card.offsetWidth;
        card.classList.add("is-arrived");
        window.setTimeout(function () { card.classList.remove("is-arrived"); }, 1300);
      });
    }
    if ("onscrollend" in window) {
      window.addEventListener("scrollend", highlight, { once: true });
    }
    window.setTimeout(highlight, 1000);
  });
})();
