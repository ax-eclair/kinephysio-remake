const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const form = document.querySelector(".contact-form");
const formMessage = document.querySelector(".form-message");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    }
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".service-card").forEach((card) => {
  const frontButton = card.querySelector(".service-front .service-more");
  const backButton = card.querySelector(".service-back-button");
  const front = card.querySelector(".service-front");
  const back = card.querySelector(".service-back");

  if (!frontButton || !backButton || !front || !back) return;

  const setFlipped = (isFlipped) => {
    card.classList.toggle("is-flipped", isFlipped);
    frontButton.setAttribute("aria-expanded", String(isFlipped));
    front.setAttribute("aria-hidden", String(isFlipped));
    back.setAttribute("aria-hidden", String(!isFlipped));
    frontButton.tabIndex = isFlipped ? -1 : 0;
    backButton.tabIndex = isFlipped ? 0 : -1;
  };

  setFlipped(false);

  frontButton.addEventListener("click", () => {
    setFlipped(true);
    backButton.focus();
  });

  backButton.addEventListener("click", () => {
    setFlipped(false);
    frontButton.focus();
  });
});

document.querySelectorAll(".faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    item.classList.toggle("is-open", !isOpen);
  });
});

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.classList.remove("error");

    const honeypot = form.querySelector("#website");
    const requiredFields = [...form.querySelectorAll("[required]")];
    const firstInvalid = requiredFields.find((field) => !field.value.trim() || !field.checkValidity());

    if (honeypot && honeypot.value.trim()) {
      form.reset();
      formMessage.textContent = "Merci pour votre message. Le formulaire sera connecté dans la version finale.";
      return;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      formMessage.textContent = "Merci de compléter les champs obligatoires avec des informations valides.";
      formMessage.classList.add("error");
      return;
    }

    const turnstileToken = form.querySelector('input[name="cf-turnstile-response"]');

    if (!turnstileToken || !turnstileToken.value.trim()) {
      formMessage.textContent = "Merci de valider la vérification anti-spam avant d’envoyer votre message.";
      formMessage.classList.add("error");
      return;
    }

    form.reset();
    if (window.turnstile) {
      window.turnstile.reset();
    }
    formMessage.textContent = "Merci pour votre message. Le formulaire sera connecté dans la version finale.";
  });
}
