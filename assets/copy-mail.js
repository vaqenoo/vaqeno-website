/* نسخ البريد الإلكتروني عند الضغط بدلاً من فتح تطبيق المراسلة */
(function () {
  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  var toastEl = null;
  var toastTimer = null;
  function showCopiedToast(email) {
    try {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.setAttribute('role', 'status');
        toastEl.style.cssText =
          'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
          'background:#1e1b4b;color:#fff;padding:10px 18px;border-radius:999px;' +
          'font-size:14px;font-weight:700;box-shadow:0 10px 25px rgba(0,0,0,.25);' +
          'z-index:9999;transition:opacity .2s ease;pointer-events:none;direction:rtl;';
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = '✓ تم نسخ البريد: ' + email;
      toastEl.style.opacity = '1';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        if (toastEl) toastEl.style.opacity = '0';
      }, 2200);
    } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var target = e.target && e.target.closest ? e.target.closest('.copy-mail, a[href^="mailto:"]') : null;
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    var href = target.getAttribute('href') || '';
    var email = target.getAttribute('data-copy') || (href.indexOf('mailto:') === 0 ? href.slice(7).split('?')[0] : '') || 'info@vaqenoo.com';
    copyText(email).then(function () {
      target.classList.add('is-copied');
      target.setAttribute('title', 'تم النسخ');
      showCopiedToast(email);
      window.setTimeout(function () {
        target.classList.remove('is-copied');
        target.removeAttribute('title');
      }, 2200);
    }).catch(function () {
      showCopiedToast(email);
    });
  }, true);
})();
