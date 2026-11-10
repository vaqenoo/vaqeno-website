# وسيط الإشعارات — Cloudflare Worker

الغرض: إخفاء توكن تيليجرام عن كود الموقع. الموقع ينادي هذا الوسيط، والوسيط هو اللي يتكلم مع تيليجرام.

## 1) إنشاء الحساب

1. افتح https://dash.cloudflare.com/sign-up
2. سجّل بإيميلك (بدون بطاقة ائتمان)
3. فعّل الإيميل

## 2) إنشاء الـ Worker

1. من القائمة الجانبية: **Workers & Pages**
2. **Create** → **Workers** → **Start with Hello World!**
3. الاسم: `vaqeno-notify`
4. **Deploy**

## 3) لصق الكود

1. اضغط **Edit code**
2. امسح كل شي موجود
3. الصق محتوى `notify.js`
4. **Deploy**

## 4) إضافة المتغيرات السرية

من صفحة الـ Worker: **Settings** → **Variables and Secrets** → **Add**

| الاسم | النوع | القيمة |
|---|---|---|
| `TELEGRAM_TOKEN` | Secret | توكن البوت الجديد |
| `CHAT_ID` | Text | `8814437947` |

> أو بدل تيليجرام: أضف `NTFY_TOPIC` بقيمة سرية تختارها، وثبّت تطبيق ntfy على جوالك واشترك بنفس الموضوع.

بعد الإضافة اضغط **Deploy** مرة ثانية.

## 5) خذ الرابط

بيطلع لك رابط زي:

```
https://vaqeno-notify.<اسم-حسابك>.workers.dev
```

## 6) اختبار

```bash
curl -X POST https://vaqeno-notify.<اسم-حسابك>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://vaqenoo.com" \
  -d "{\"text\":\"تجربة من VAQENO\"}"
```

لازم يرد `{"ok":true}` وتوصلك الرسالة.

## 7) الربط بالموقع

أرسل الرابط، ويتم تحديث صفحات الموقع لتنادي الوسيط.
