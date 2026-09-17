(() => {
  'use strict';

  const ENDPOINT = 'https://vhtasjikqfldoilqdbhv.supabase.co/functions/v1/submit-form';
  const PRIVACY_URL = 'privacy.html';

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
      consent: 'Quero receber novidades, workshops e ofertas do Ramiro por email e participar no sorteio. Posso cancelar quando quiser.',
      consentVersion: 'lisboa_newsletter_pt_v1'
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
      consent: 'I’d like to receive Ramiro’s news, workshops and offers by email and enter the raffle. I can unsubscribe anytime.',
      consentVersion: 'lisboa_newsletter_en_v1'
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

  document.addEventListener('DOMContentLoaded', () => {
    installContactForm();
    installNewsletter();
    const pt = document.getElementById('ptBtn');
    const en = document.getElementById('enBtn');
    [pt, en].forEach(btn => btn?.addEventListener('click', () => window.setTimeout(refreshPrivacyNote, 0)));
  });
})();
