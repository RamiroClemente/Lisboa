(() => {
  'use strict';

  const ENDPOINT = 'https://vhtasjikqfldoilqdbhv.supabase.co/functions/v1/submit-form';
  const PRIVACY_URL = 'privacy.html';
  const POPUP_DELAY = 5000;

  const lang = () => document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'pt';
  const sourcePage = () => `${window.location.origin}${window.location.pathname}`;

  const copy = {
    pt: {
      contactPrivacy: 'Responsável: Ramiro Clemente · Uso estes dados apenas para responder à tua mensagem. Evita incluir informação sensível.',
      privacy: 'Privacidade',
      sending: 'A enviar…',
      sent: 'Obrigado! A tua mensagem foi enviada.',
      error: 'Não foi possível enviar agora. Tenta novamente dentro de alguns instantes.',
      invalid: 'Preenche o nome, um email válido e a mensagem.',
      subscribeSending: 'A subscrever…',
      subscribeError: 'Não foi possível concluir a subscrição agora. Tenta novamente.',
      consent: 'Quero receber novidades, workshops e ofertas do Ramiro por email. Posso cancelar quando quiser.',
      consentVersion: 'lisboa_newsletter_pt_v3',
      popupEyebrow: 'NEWSLETTER',
      popupTitle: 'Fica por perto',
      popupBookingTitle: 'Reserva confirmada!',
      popupText: 'Recebe novidades sobre workshops, mentoring, eventos e ofertas diretamente no teu email.',
      popupBookingText: 'Obrigado pela tua reserva. Se quiseres acompanhar os próximos workshops, eventos e novidades, junta-te à mailing list.',
      popupEmail: 'O teu email',
      popupButton: 'Subscrever',
      popupClose: 'Fechar',
      popupConsentRequired: 'Assinala primeiro a opção de consentimento.',
      popupInvalidEmail: 'Introduz um email válido.',
      popupSuccessTitle: 'Obrigado!',
      popupSuccessText: 'Já estás na mailing list.',
      popupCodeLabel: 'O teu código de 10%'
    },
    en: {
      contactPrivacy: 'Controller: Ramiro Clemente · I’ll only use these details to reply to your message. Please don’t include sensitive information.',
      privacy: 'Privacy',
      sending: 'Sending…',
      sent: 'Thank you! Your message has been sent.',
      error: 'I couldn’t send this right now. Please try again in a moment.',
      invalid: 'Please add your name, a valid email and your message.',
      subscribeSending: 'Subscribing…',
      subscribeError: 'I couldn’t complete your subscription right now. Please try again.',
      consent: 'I’d like to receive Ramiro’s news, workshops and offers by email. I can unsubscribe anytime.',
      consentVersion: 'lisboa_newsletter_en_v3',
      popupEyebrow: 'NEWSLETTER',
      popupTitle: 'Stay in the loop',
      popupBookingTitle: 'Booking confirmed!',
      popupText: 'Get news about workshops, mentoring, events and offers directly in your inbox.',
      popupBookingText: 'Thanks for booking. If you’d like to hear about upcoming workshops, events and news, join the mailing list.',
      popupEmail: 'Your email',
      popupButton: 'Subscribe',
      popupClose: 'Close',
      popupConsentRequired: 'Please tick the consent option first.',
      popupInvalidEmail: 'Please enter a valid email address.',
      popupSuccessTitle: 'Thank you!',
      popupSuccessText: 'You’re now on the mailing list.',
      popupCodeLabel: 'Your 10% code'
    }
  };

  const t = () => copy[lang()];
  const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  async function submit(payload) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, source_page: sourcePage() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || 'submit_failed');
    return data;
  }

  function showMessage(message) {
    if (typeof window.showToast === 'function') window.showToast(message);
    else {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        window.setTimeout(() => toast.classList.remove('show'), 3000);
      }
    }
  }

  function ensurePrivacyNote() {
    const form = document.getElementById('contactForm');
    if (!form || document.getElementById('contactPrivacyNote')) return;
    const p = document.createElement('p');
    p.id = 'contactPrivacyNote';
    p.style.cssText = 'margin:0;font-size:.72rem;line-height:1.45;color:#6e6961;text-transform:none;letter-spacing:0;font-weight:500;';
    p.innerHTML = `${t().contactPrivacy} <a href="${PRIVACY_URL}" target="_blank" rel="noopener" style="text-decoration:underline">${t().privacy}</a>`;
    form.insertBefore(p, form.querySelector('button[type="submit"]'));
  }

  function refreshPrivacyNote() {
    const p = document.getElementById('contactPrivacyNote');
    if (p) p.innerHTML = `${t().contactPrivacy} <a href="${PRIVACY_URL}" target="_blank" rel="noopener" style="text-decoration:underline">${t().privacy}</a>`;
  }

  function installContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    ensurePrivacyNote();

    const button = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const name = (form.querySelector('input[type="text"]')?.value || '').trim();
      const email = (form.querySelector('input[type="email"]')?.value || '').trim().toLowerCase();
      const message = (form.querySelector('textarea')?.value || '').trim();
      const newsletterCheck = document.getElementById('inlineNewsletterCheck');
      const marketingConsent = Boolean(newsletterCheck?.checked);

      if (!name || !validEmail(email) || !message) {
        showMessage(t().invalid);
        return;
      }

      const original = button ? button.textContent : '';
      if (button) { button.disabled = true; button.textContent = t().sending; }

      try {
        await submit({
          form_type: 'contact',
          language: lang(),
          name,
          email,
          message,
          marketing_consent: marketingConsent,
          consent_version: marketingConsent ? t().consentVersion : null,
          consent_text: marketingConsent ? t().consent : null,
          website: ''
        });
        form.reset();
        if (marketingConsent) {
          localStorage.setItem('lisboaSubscribed', '1');
          const inline = document.getElementById('inlineNewsletter');
          if (inline) inline.style.display = 'none';
          closeNewsletterPopup();
        }
        showMessage(t().sent);
      } catch (error) {
        console.error('Lisboa contact form error', error);
        showMessage(t().error);
      } finally {
        if (button) { button.disabled = false; button.textContent = original || (lang() === 'en' ? 'Send message' : 'Enviar mensagem'); }
      }
    }, true);
  }

  function installNewsletter() {
    const button = document.getElementById('subscribeBtn');
    const emailInput = document.getElementById('newsletterEmail');
    const consentCheck = document.getElementById('consentCheck');
    if (!button || !emailInput || !consentCheck) return;

    button.onclick = async event => {
      event.preventDefault();
      const email = emailInput.value.trim().toLowerCase();
      if (!consentCheck.checked) {
        showMessage(lang() === 'en' ? 'Please tick the consent option first.' : 'Assinala primeiro a opção de consentimento.');
        return;
      }
      if (!validEmail(email)) {
        showMessage(lang() === 'en' ? 'Please enter a valid email address.' : 'Introduz um email válido.');
        return;
      }

      const original = button.textContent;
      button.disabled = true;
      button.textContent = t().subscribeSending;
      try {
        await submit({
          form_type: 'newsletter',
          language: lang(),
          email,
          marketing_consent: true,
          consent_version: t().consentVersion,
          consent_text: t().consent,
          website: ''
        });
        localStorage.setItem('lisboaSubscribed', '1');
        const inline = document.getElementById('inlineNewsletter');
        if (inline) inline.style.display = 'none';
        const subscribeState = document.getElementById('subscribeState');
        const codeReveal = document.getElementById('codeReveal');
        if (subscribeState) subscribeState.style.display = 'none';
        if (codeReveal) codeReveal.classList.add('show');
      } catch (error) {
        console.error('Lisboa newsletter error', error);
        showMessage(t().subscribeError);
      } finally {
        button.disabled = false;
        button.textContent = original || (lang() === 'en' ? 'Subscribe' : 'Subscrever');
      }
    };
  }

  function popupMarkup() {
    const isBookingConfirmation = new URLSearchParams(window.location.search).get('newsletter') === '1';
    const c = t();
    return `
      <div id="rcNewsletterPopup" class="rc-newsletter-popup" aria-hidden="true">
        <div class="rc-newsletter-backdrop" data-rc-popup-close></div>
        <section class="rc-newsletter-card" role="dialog" aria-modal="true" aria-labelledby="rcNewsletterTitle">
          <button class="rc-newsletter-close" type="button" data-rc-popup-close aria-label="${c.popupClose}">×</button>
          <div id="rcNewsletterSubscribeState">
            <div class="rc-newsletter-eyebrow">${c.popupEyebrow}</div>
            <h2 id="rcNewsletterTitle">${isBookingConfirmation ? c.popupBookingTitle : c.popupTitle}</h2>
            <p class="rc-newsletter-text">${isBookingConfirmation ? c.popupBookingText : c.popupText}</p>
            <form id="rcNewsletterForm" novalidate>
              <label class="rc-newsletter-email-label" for="rcNewsletterEmail">${c.popupEmail}</label>
              <input id="rcNewsletterEmail" name="email" type="email" inputmode="email" autocomplete="email" required>
              <label class="rc-newsletter-consent">
                <input id="rcNewsletterConsent" type="checkbox">
                <span>${c.consent} <a href="${PRIVACY_URL}" target="_blank" rel="noopener">${c.privacy}</a></span>
              </label>
              <button id="rcNewsletterSubmit" type="submit">${c.popupButton}</button>
              <p id="rcNewsletterError" class="rc-newsletter-error" role="alert" aria-live="polite"></p>
            </form>
          </div>
          <div id="rcNewsletterSuccess" class="rc-newsletter-success" hidden>
            <div class="rc-newsletter-eyebrow">${c.popupEyebrow}</div>
            <h2>${c.popupSuccessTitle}</h2>
            <p>${c.popupSuccessText}</p>
            <div class="rc-newsletter-code-wrap">
              <span>${c.popupCodeLabel}</span>
              <strong>RC10!</strong>
            </div>
          </div>
        </section>
      </div>`;
  }

  function ensurePopupStyles() {
    if (document.getElementById('rcNewsletterPopupStyles')) return;
    const style = document.createElement('style');
    style.id = 'rcNewsletterPopupStyles';
    style.textContent = `
      .rc-newsletter-popup{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:20px;font-family:inherit}
      .rc-newsletter-popup.is-open{display:flex}
      .rc-newsletter-backdrop{position:absolute;inset:0;background:rgba(20,18,16,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      .rc-newsletter-card{position:relative;z-index:1;width:min(560px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#f7f5f0;color:#191817;border-radius:20px;padding:44px 42px 38px;box-shadow:0 24px 80px rgba(0,0,0,.28)}
      .rc-newsletter-close{position:absolute;top:14px;right:16px;width:40px;height:40px;border:0;background:transparent;color:inherit;font:300 30px/1 Arial,sans-serif;cursor:pointer;border-radius:50%}
      .rc-newsletter-close:hover,.rc-newsletter-close:focus-visible{background:rgba(0,0,0,.06);outline:none}
      .rc-newsletter-eyebrow{font-size:.72rem;letter-spacing:.18em;font-weight:700;margin:0 0 12px;color:#6e6961}
      .rc-newsletter-card h2{font-size:clamp(2rem,7vw,3.25rem);line-height:.98;letter-spacing:-.045em;margin:0 0 18px;font-weight:700}
      .rc-newsletter-text,.rc-newsletter-success p{font-size:1rem;line-height:1.55;margin:0 0 26px;color:#4e4a45}
      .rc-newsletter-email-label{display:block;font-size:.76rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 8px}
      #rcNewsletterEmail{box-sizing:border-box;width:100%;height:52px;border:1px solid #bbb5ac;border-radius:12px;background:#fff;color:#191817;padding:0 15px;font:inherit;outline:none}
      #rcNewsletterEmail:focus{border-color:#191817;box-shadow:0 0 0 2px rgba(25,24,23,.08)}
      .rc-newsletter-consent{display:flex;align-items:flex-start;gap:10px;margin:16px 0 18px;font-size:.78rem;line-height:1.45;color:#5c5751;cursor:pointer}
      .rc-newsletter-consent input{flex:0 0 auto;width:17px;height:17px;margin:2px 0 0;accent-color:#191817}
      .rc-newsletter-consent a{color:inherit;text-decoration:underline;text-underline-offset:2px}
      #rcNewsletterSubmit{width:100%;min-height:52px;border:0;border-radius:999px;background:#191817;color:#fff;font:700 .9rem/1 inherit;letter-spacing:.04em;cursor:pointer;padding:14px 20px}
      #rcNewsletterSubmit:disabled{opacity:.62;cursor:wait}
      .rc-newsletter-error{min-height:1.2em;margin:10px 0 0;font-size:.78rem;line-height:1.4;color:#8b2f25}
      .rc-newsletter-success{text-align:center;padding:8px 0 4px}
      .rc-newsletter-success .rc-newsletter-eyebrow{margin-bottom:16px}
      .rc-newsletter-code-wrap{display:flex;flex-direction:column;gap:7px;margin-top:24px;padding:20px;border:1px solid #cbc4ba;border-radius:14px;background:#fff}
      .rc-newsletter-code-wrap span{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:#6e6961;font-weight:700}
      .rc-newsletter-code-wrap strong{font-size:2rem;letter-spacing:.04em}
      body.rc-newsletter-lock{overflow:hidden}
      @media (max-width:600px){.rc-newsletter-popup{padding:12px}.rc-newsletter-card{padding:38px 22px 28px;border-radius:16px}.rc-newsletter-card h2{font-size:2.35rem}}
      @media (prefers-reduced-motion:no-preference){.rc-newsletter-card{animation:rcNewsletterIn .22s ease-out both}@keyframes rcNewsletterIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}}
    `;
    document.head.appendChild(style);
  }

  function createNewsletterPopup() {
    if (document.getElementById('rcNewsletterPopup')) return;
    ensurePopupStyles();
    document.body.insertAdjacentHTML('beforeend', popupMarkup());

    const popup = document.getElementById('rcNewsletterPopup');
    const form = document.getElementById('rcNewsletterForm');
    const emailInput = document.getElementById('rcNewsletterEmail');
    const consentCheck = document.getElementById('rcNewsletterConsent');
    const button = document.getElementById('rcNewsletterSubmit');
    const error = document.getElementById('rcNewsletterError');

    popup.querySelectorAll('[data-rc-popup-close]').forEach(el => el.addEventListener('click', closeNewsletterPopup));

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = emailInput.value.trim().toLowerCase();
      error.textContent = '';

      if (!consentCheck.checked) {
        error.textContent = t().popupConsentRequired;
        consentCheck.focus();
        return;
      }
      if (!validEmail(email)) {
        error.textContent = t().popupInvalidEmail;
        emailInput.focus();
        return;
      }

      const original = button.textContent;
      button.disabled = true;
      button.textContent = t().subscribeSending;
      try {
        await submit({
          form_type: 'newsletter',
          language: lang(),
          email,
          marketing_consent: true,
          consent_version: t().consentVersion,
          consent_text: t().consent,
          website: ''
        });
        localStorage.setItem('lisboaSubscribed', '1');
        const inline = document.getElementById('inlineNewsletter');
        if (inline) inline.style.display = 'none';
        document.getElementById('rcNewsletterSubscribeState').hidden = true;
        document.getElementById('rcNewsletterSuccess').hidden = false;
      } catch (err) {
        console.error('Lisboa popup newsletter error', err);
        error.textContent = t().subscribeError;
      } finally {
        button.disabled = false;
        button.textContent = original || t().popupButton;
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && popup.classList.contains('is-open')) closeNewsletterPopup();
    });
  }

  function openNewsletterPopup() {
    const popup = document.getElementById('rcNewsletterPopup');
    if (!popup) return;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rc-newsletter-lock');
    window.setTimeout(() => document.getElementById('rcNewsletterEmail')?.focus(), 30);
  }

  function closeNewsletterPopup() {
    const popup = document.getElementById('rcNewsletterPopup');
    if (!popup) return;
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rc-newsletter-lock');
  }

  function installNewsletterPopup() {
    createNewsletterPopup();
    const isBookingConfirmation = new URLSearchParams(window.location.search).get('newsletter') === '1';
    const alreadySubscribed = localStorage.getItem('lisboaSubscribed') === '1';

    if (isBookingConfirmation) {
      openNewsletterPopup();
      return;
    }

    if (!alreadySubscribed) {
      window.setTimeout(openNewsletterPopup, POPUP_DELAY);
    }
  }

  function refreshNewsletterPopupLanguage() {
    const popup = document.getElementById('rcNewsletterPopup');
    if (!popup) return;
    const wasOpen = popup.classList.contains('is-open');
    const email = document.getElementById('rcNewsletterEmail')?.value || '';
    const consent = Boolean(document.getElementById('rcNewsletterConsent')?.checked);
    const successVisible = !document.getElementById('rcNewsletterSuccess')?.hidden;
    popup.remove();
    createNewsletterPopup();
    const newEmail = document.getElementById('rcNewsletterEmail');
    const newConsent = document.getElementById('rcNewsletterConsent');
    if (newEmail) newEmail.value = email;
    if (newConsent) newConsent.checked = consent;
    if (successVisible) {
      document.getElementById('rcNewsletterSubscribeState').hidden = true;
      document.getElementById('rcNewsletterSuccess').hidden = false;
    }
    if (wasOpen) openNewsletterPopup();
  }

  function installWorkshopCarouselControls() {
    const carousel = document.getElementById('workshopCarousel');
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll('.carousel-slide, .slide'));
    const dots = Array.from(carousel.querySelectorAll('.dot'));
    const prev = carousel.querySelector('.prev');
    const next = carousel.querySelector('.next');

    if (slides.length < 2 || !prev || !next) return;

    let slideIndex = slides.findIndex(slide => slide.classList.contains('active'));
    if (slideIndex < 0) slideIndex = 0;

    const render = () => {
      slides.forEach((slide, i) => slide.classList.toggle('active', i === slideIndex));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === slideIndex));
    };

    const go = nextIndex => {
      slideIndex = (nextIndex + slides.length) % slides.length;
      render();
    };

    prev.onclick = event => {
      event.preventDefault();
      go(slideIndex - 1);
    };

    next.onclick = event => {
      event.preventDefault();
      go(slideIndex + 1);
    };

    dots.forEach((dot, i) => {
      dot.onclick = event => {
        event.preventDefault();
        go(i);
      };
    });

    render();
  }

  function safeInit(name, fn) {
    try {
      fn();
    } catch (error) {
      console.error(`Lisboa ${name} init error`, error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    safeInit('carousel', installWorkshopCarouselControls);
    safeInit('contact form', installContactForm);
    safeInit('newsletter', installNewsletter);
    safeInit('newsletter popup', installNewsletterPopup);

    const pt = document.getElementById('ptBtn');
    const en = document.getElementById('enBtn');
    [pt, en].forEach(btn => btn?.addEventListener('click', () => window.setTimeout(() => {
      refreshPrivacyNote();
      refreshNewsletterPopupLanguage();
    }, 0)));
  });
})();
