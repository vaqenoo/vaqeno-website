/* VAQENO — إرسال إشعارات للمالك عبر وسيط Cloudflare (التوكن مخفي على السيرفر) */
(function () {
    var ENDPOINT = 'https://vaqeno-notify.vaqenoo.workers.dev';

    window.vaqenoNotify = function (text) {
        try {
            if (!text) return;
            fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: String(text).slice(0, 1500) }),
                keepalive: true
            }).catch(function () { /* تجاهل أي خطأ شبكة */ });
        } catch (e) { /* تجاهل */ }
    };
})();
