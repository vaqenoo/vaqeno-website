/* نسخ البريد الإلكتروني بدل فتح تطبيق البريد */
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

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('.copy-mail') : null;
    if (!el) return;
    e.preventDefault();
    var email = el.getAttribute('data-copy') || 'info@vaqenoo.com';
    copyText(email).then(function () {
      el.classList.add('is-copied');
      el.setAttribute('title', 'تم النسخ');
      window.setTimeout(function () {
        el.classList.remove('is-copied');
        el.removeAttribute('title');
      }, 2200);
    }).catch(function () {});
  });
})();
