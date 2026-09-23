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

/* Вкладки в карточках курсов: «Что внутри» → «Что получите» → «Формат».
   Без JavaScript все блоки видны целиком, как раньше. */
(function () {
  var LABELS = {
    "Что внутри": "Что внутри",
    "Что вы получите": "Что получите",
    "Формат обучения": "Формат"
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var arrow = '<svg class="course-next-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v11M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  document.querySelectorAll(".courses-grid > .course").forEach(function (card, cardIndex) {
    var blocks = Array.prototype.filter.call(card.children, function (el) {
      return el.classList.contains("course-block");
    });
    if (blocks.length < 2) return;

    var titles = blocks.map(function (block) {
      return block.querySelector("h4").textContent.trim();
    });
    var baseId = "course-" + cardIndex;

    var tabs = document.createElement("div");
    tabs.className = "course-tabs";

    var nav = document.createElement("div");
    nav.className = "course-tabs-nav";
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", "Разделы курса");

    var panelsWrap = document.createElement("div");
    panelsWrap.className = "course-tabs-panels";

    var buttons = [];
    var panels = [];

    blocks[0].parentNode.insertBefore(tabs, blocks[0]);
    tabs.appendChild(nav);
    tabs.appendChild(panelsWrap);

    blocks.forEach(function (block, i) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "course-tab";
      button.id = baseId + "-tab-" + i;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", baseId + "-panel-" + i);
      button.textContent = LABELS[titles[i]] || titles[i];
      nav.appendChild(button);
      buttons.push(button);

      block.id = baseId + "-panel-" + i;
      block.classList.add("course-panel");
      block.setAttribute("role", "tabpanel");
      block.setAttribute("aria-labelledby", button.id);
      block.querySelector("h4").classList.add("visually-hidden");
      panelsWrap.appendChild(block);
      panels.push(block);

      if (i < blocks.length - 1) {
        var next = document.createElement("button");
        next.type = "button";
        next.className = "course-next";
        next.innerHTML = "Дальше: " + (LABELS[titles[i + 1]] || titles[i + 1]).toLowerCase() + arrow;
        next.addEventListener("click", function () {
          select(i + 1, { focusTab: false, scroll: true });
        });
        block.appendChild(next);
      }
    });

    var current = 0;

    function select(index, options) {
      options = options || {};
      if (index < 0 || index >= panels.length) return;
      var animate = !reduceMotion.matches && options.animate !== false;
      var from = current;
      current = index;

      buttons.forEach(function (button, i) {
        var active = i === index;
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });

      if (animate && from !== index) {
        // Плавно меняем высоту области, чтобы карточка не прыгала
        var startHeight = panelsWrap.offsetHeight;
        panelsWrap.style.height = startHeight + "px";
        panels.forEach(function (panel, i) { panel.hidden = i !== index; });
        var endHeight = panels[index].offsetHeight;
        panelsWrap.classList.remove("is-animating");
        void panelsWrap.offsetWidth;
        panelsWrap.classList.add("is-animating");
        panels[index].classList.remove("is-entering", "is-entering-back");
        void panels[index].offsetWidth;
        panels[index].classList.add(index > from ? "is-entering" : "is-entering-back");
        panelsWrap.style.height = endHeight + "px";
        window.setTimeout(function () {
          panelsWrap.style.height = "";
          panelsWrap.classList.remove("is-animating");
          panels[index].classList.remove("is-entering", "is-entering-back");
        }, 460);
      } else {
        panels.forEach(function (panel, i) { panel.hidden = i !== index; });
      }

      if (options.focusTab) buttons[index].focus();

      // Если начало вкладок ушло под шапку — возвращаем его в поле зрения
      if (options.scroll) {
        var header = document.querySelector(".site-header");
        var offset = (header ? header.offsetHeight : 0) + 12;
        var top = nav.getBoundingClientRect().top;
        if (top < offset) {
          window.scrollBy({ top: top - offset, behavior: reduceMotion.matches ? "auto" : "smooth" });
        }
      }
    }

    buttons.forEach(function (button, i) {
      button.addEventListener("click", function () { select(i); });
      button.addEventListener("keydown", function (event) {
        var target = null;
        if (event.key === "ArrowRight") target = (i + 1) % buttons.length;
        if (event.key === "ArrowLeft") target = (i - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") target = 0;
        if (event.key === "End") target = buttons.length - 1;
        if (target !== null) {
          event.preventDefault();
          select(target, { focusTab: true });
        }
      });
    });

    // Свайп влево/вправо по содержимому; вертикальная прокрутка не перехватывается
    var startX = 0;
    var startY = 0;
    var tracking = false;
    panelsWrap.addEventListener("touchstart", function (event) {
      if (event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    panelsWrap.addEventListener("touchend", function (event) {
      if (!tracking) return;
      tracking = false;
      var dx = event.changedTouches[0].clientX - startX;
      var dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      select(dx < 0 ? current + 1 : current - 1, { scroll: true });
    }, { passive: true });

    card.classList.add("has-tabs");
    select(0, { animate: false });
  });
})();

/* Длинные списки в карточках: показываем начало и кнопку «Показать всю программу».
   Без JavaScript списки видны целиком. */
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var chevron = '<svg class="list-toggle-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var counter = 0;

  document.querySelectorAll(".courses-grid > .course .lesson-list, .courses-grid > .course .check-list").forEach(function (list) {
    var isLessons = list.classList.contains("lesson-list");
    var visibleCount = isLessons ? 4 : 5;
    var items = Array.prototype.slice.call(list.children);
    // Сворачиваем, только если прячется хотя бы 2 пункта
    if (items.length < visibleCount + 2) return;

    var extra = items.slice(visibleCount);
    list.id = list.id || "course-list-" + counter++;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "list-toggle";
    button.setAttribute("aria-controls", list.id);
    list.parentNode.insertBefore(button, list.nextSibling);

    var moreLabel = (isLessons ? "Показать всю программу" : "Показать весь список") + " · ещё " + extra.length;

    function setExpanded(expanded, byUser) {
      extra.forEach(function (item, i) {
        item.hidden = !expanded;
        if (expanded && byUser && !reduceMotion.matches) {
          item.style.animationDelay = i * 40 + "ms";
          item.classList.add("is-revealed");
          window.setTimeout(function () {
            item.classList.remove("is-revealed");
            item.style.animationDelay = "";
          }, 700 + i * 40);
        }
      });
      list.classList.toggle("is-collapsed", !expanded);
      button.setAttribute("aria-expanded", String(expanded));
      button.innerHTML = (expanded ? "Свернуть" : moreLabel) + chevron;

      // После сворачивания возвращаем начало списка в поле зрения
      if (!expanded && byUser) {
        var header = document.querySelector(".site-header");
        var offset = (header ? header.offsetHeight : 0) + 12;
        var top = list.getBoundingClientRect().top;
        if (top < offset) {
          window.scrollBy({ top: top - offset - 40, behavior: reduceMotion.matches ? "auto" : "smooth" });
        }
      }
    }

    button.addEventListener("click", function () {
      setExpanded(button.getAttribute("aria-expanded") !== "true", true);
    });

    setExpanded(false, false);
  });
})();
