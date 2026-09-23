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

/* Форма заказа. Данные никуда не отправляются: после проверки
   показывается блок оплаты. Кнопка «Оплатить» остаётся неактивной,
   пока не подключён платёжный сервис. */
(function () {
  var form = document.getElementById("order-form");
  if (!form) return;

  var PRODUCTS = {
    theory: { name: "«Теория | Рабочая версия»", price: "2 999 ₽" },
    practice: { name: "«Практика | Рабочая версия»", price: "2 999 ₽" },
    bundle: { name: "Комплект «Теория + Практика»", price: "4 999 ₽" },
    claude: { name: "«КЛОД | Рабочая версия»", price: "4 999 ₽" }
  };

  var fields = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    product: form.elements.product,
    offer: form.elements.offer,
    consent: form.elements.consent
  };
  var summaryProduct = document.getElementById("order-summary-product");
  var summaryPrice = document.getElementById("order-summary-price");
  var payment = document.getElementById("payment");
  var paymentButton = document.getElementById("payment-button");

  function updateSummary() {
    var product = PRODUCTS[fields.product.value];
    summaryProduct.textContent = product ? product.name : "Курс не выбран";
    summaryPrice.textContent = product ? product.price : "";
    summaryPrice.hidden = !product;
  }

  function validate(key) {
    var el = fields[key];
    var value = el.type === "checkbox" ? el.checked : el.value.trim();
    var message = "";

    if (key === "name" && value.length < 2) {
      message = "Укажите имя.";
    } else if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      message = value ? "Проверьте адрес электронной почты." : "Укажите электронную почту.";
    } else if (key === "phone") {
      var digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15 || /[^\d\s()+-]/.test(value)) {
        message = value ? "Проверьте номер телефона." : "Укажите номер телефона.";
      }
    } else if (key === "product" && !PRODUCTS[value]) {
      message = "Выберите курс.";
    } else if (key === "offer" && !value) {
      message = "Чтобы продолжить, примите условия публичной оферты.";
    } else if (key === "consent" && !value) {
      message = "Чтобы продолжить, дайте согласие на обработку персональных данных.";
    }

    var error = document.getElementById("order-" + key + "-error");
    error.textContent = message;
    error.hidden = !message;
    if (message) {
      el.setAttribute("aria-invalid", "true");
    } else {
      el.removeAttribute("aria-invalid");
    }
    return !message;
  }

  document.querySelectorAll("[data-product]").forEach(function (link) {
    link.addEventListener("click", function () {
      fields.product.value = link.getAttribute("data-product");
      updateSummary();
      validate("product");
      window.setTimeout(function () {
        fields.name.focus({ preventScroll: true });
      }, 600);
    });
  });

  fields.product.addEventListener("change", function () {
    updateSummary();
    validate("product");
  });

  // Ошибки показываются после попытки отправки и снимаются, пока человек исправляет поле.
  // Проверка по уходу из поля не используется: она сдвигала бы форму прямо во время клика.
  Object.keys(fields).forEach(function (key) {
    var el = fields[key];
    el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
      if (el.hasAttribute("aria-invalid")) {
        validate(key);
      }
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var firstInvalid = null;
    Object.keys(fields).forEach(function (key) {
      if (!validate(key) && !firstInvalid) firstInvalid = fields[key];
    });
    if (firstInvalid) {
      firstInvalid.focus();
      payment.hidden = true;
      return;
    }

    var product = PRODUCTS[fields.product.value];
    document.getElementById("payment-product").textContent = product.name;
    document.getElementById("payment-price").textContent = product.price;
    document.getElementById("payment-email").textContent = fields.email.value.trim();
    paymentButton.textContent = "Оплатить " + product.price;
    payment.hidden = false;
    payment.focus({ preventScroll: true });
    payment.scrollIntoView({ block: "start" });
  });

  document.getElementById("payment-edit").addEventListener("click", function () {
    payment.hidden = true;
    fields.name.focus();
  });

  updateSummary();
})();
