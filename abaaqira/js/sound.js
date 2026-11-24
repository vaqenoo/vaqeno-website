/* ============================================================
   عباقرة - الصوت:
   1) مؤثرات مولّدة بالكامل (Web Audio API) بدون أي ملفات خارجية
   2) نطق عربي بصوت شابة طبيعي (Microsoft Neural: زارية ar-SA-ZariyahNeural)
      وإنجليزي بصوت شابة (en-US-AnaNeural) محفوظ محليًا في ./audio/
      ليعمل فورًا وبدون إنترنت على كل الأجهزة (ويندوز / أندرويد / آيفون)
   3) توليد تلقائي عبر الخادم المحلي (/api/tts) لأي نص جديد، ثم بديل المتصفح
   ============================================================ */

const Sound = (() => {
  let ctx = null;
  let enabled = true;
  let currentAudio = null;
  let speakSeq = 0;

  try {
    enabled = localStorage.getItem("abaaqira_sound") !== "0";
    /* تنظيف أي اسم صوت ذكوري قديم (مثل Naayf) ليعمل صوت الشابة المدمج افتراضيًا */
    const oldName = localStorage.getItem("abaaqira_voiceName") || "";
    if (/naayf|maged|majed|male/i.test(oldName)) {
      localStorage.removeItem("abaaqira_voiceName");
    }
  } catch {}

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* نغمة أساسية */
  function tone({ freq = 440, dur = 0.15, type = "sine", vol = 0.18, delay = 0, slideTo = null }) {
    if (!enabled) return;
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + delay;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /* ---------- تنظيف النص وتحويله للصيغة الصوتية الفصيحة (مطابق لـ build_audio.py) ---------- */

  const PHONETIC_MAP = {
    "أ": "حَرفُ الأَلِف، أَ",
    "أَ": "حَرفُ الأَلِف، أَ",
    "أُ": "حَرفُ الأَلِف ضَمَّة، أُ",
    "إِ": "حَرفُ الأَلِف كَسرَة، إِ",
    "ا": "مَدُّ الأَلِف، آ",
    "ب": "حَرفُ البَاء، بَ",
    "بَ": "حَرفُ البَاء، بَ",
    "بِ": "حَرفُ البَاء كَسرَة، بِ",
    "بَا": "مَقطَع بَا",
    "ت": "حَرفُ التَّاء، تَ",
    "تَ": "حَرفُ التَّاء، تَ",
    "تُ": "حَرفُ التَّاء ضَمَّة، تُ",
    "ة": "تَاء مَربُوطَة",
    "ث": "حَرفُ الثَّاء، ثَ",
    "ثَ": "حَرفُ الثَّاء، ثَ",
    "ج": "حَرفُ الجِيم، جَ",
    "جَ": "حَرفُ الجِيم، جَ",
    "ح": "حَرفُ الحَاء، حَ",
    "حَ": "حَرفُ الحَاء، حَ",
    "خ": "حَرفُ الخَاء، خَ",
    "خَ": "حَرفُ الخَاء، خَ",
    "د": "حَرفُ الدَّال، دَ",
    "ذ": "حَرفُ الذَّال، ذَ",
    "ر": "حَرفُ الرَّاء، رَ",
    "ز": "حَرفُ الزَّاي، زَ",
    "س": "حَرفُ السِّين، سَ",
    "سَ": "حَرفُ السِّين، سَ",
    "ش": "حَرفُ الشِّين، شَ",
    "شَ": "حَرفُ الشِّين، شَ",
    "ص": "حَرفُ الصَّاد، صَ",
    "ض": "حَرفُ الضَّاد، ضَ",
    "ط": "حَرفُ الطَّاء، طَ",
    "طَّ": "حَرفُ الطَّاء، طَ",
    "طِّ": "حَرفُ الطَّاء كَسرَة، طِ",
    "ظ": "حَرفُ الظَّاء، ظَ",
    "ع": "حَرفُ العَين، عَ",
    "عِ": "حَرفُ العَين كَسرَة، عِ",
    "غ": "حَرفُ الغَين، غَ",
    "ف": "حَرفُ الفَاء، فَ",
    "فَّ": "حَرفُ الفَاء، فَ",
    "ق": "حَرفُ القَاف، قَ",
    "قَ": "حَرفُ القَاف، قَ",
    "قِ": "حَرفُ القَاف كَسرَة، قِ",
    "ك": "حَرفُ الكَاف، كَ",
    "كَ": "حَرفُ الكَاف، كَ",
    "كِ": "حَرفُ الكَاف كَسرَة، كِ",
    "ل": "حَرفُ اللَّام، لَ",
    "م": "حَرفُ المِيم، مَ",
    "مَ": "حَرفُ المِيم، مَ",
    "مَا": "مَقطَع مَا",
    "ن": "حَرفُ النُّون، نَ",
    "نَ": "حَرفُ النُّون، نَ",
    "هـ": "حَرفُ الهَاء، هَـ",
    "و": "حَرفُ الوَاو، وَ",
    "ي": "حَرفُ اليَاء، يَ",
    "١": "وَاحِد",
    "٢": "اثنَان",
    "٣": "ثَلَاثَة",
    "٤": "أَربَعَة",
    "٥": "خَمسَة",
    "٦": "سِتَّة",
    "٧": "سَبعَة",
    "٨": "ثَمَانِيَة",
    "٩": "تِسعَة",
    "١٠": "عَشَرَة",
    "+": "زَائِد",
    "=": "يُسَاوِي",
    "ب + ا = با": "بَ، مَعَ مَدِّ الأَلِف، تَصِيرُ: بَا",
    "ت + ا = تا": "تَ، مَعَ مَدِّ الأَلِف، تَصِيرُ: تَا",
    "س + ا = سا": "سَ، مَعَ مَدِّ الأَلِف، تَصِيرُ: سَا",
    "م + ا = ما": "مَ، مَعَ مَدِّ الأَلِف، تَصِيرُ: مَا",
    "ب + ا = ؟": "بَ، مَعَ مَدِّ الأَلِف، تَصِيرُ مَاذَا؟",
    "ت + ا = ؟": "تَ، مَعَ مَدِّ الأَلِف، تَصِيرُ مَاذَا؟",
    "م + ا = ؟": "مَ، مَعَ مَدِّ الأَلِف، تَصِيرُ مَاذَا؟",
    "س + ا + س = ؟": "سَ، مَعَ الأَلِف، وَسِين، تَصِيرُ مَاذَا؟",
    "ب + ا + ب + ا = ؟": "بَا، مَعَ بَا، تَصِيرُ مَاذَا؟"
  };

  function cleanSpeech(text) {
    let s = String(text || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/[^\u0600-\u06FFa-zA-Z0-9.,!?;:+\-=\u00AB\u00BB"()\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!s) return "";
    if (PHONETIC_MAP[s]) return PHONETIC_MAP[s];
    s = s
      .replace(/\.\.\.+/g, "، ")
      .replace(/=\s*\u061F/g, " يُسَاوِي كَم؟ ")
      .replace(/=/g, " يُسَاوِي ")
      .replace(/\+/g, " زَائِد ")
      .replace(/([\u0660-\u06690-9])\s*-\s*([\u0660-\u06690-9])/g, "$1 نَاقِص $2")
      .replace(/\s+-\s+/g, "، ")
      .replace(/\s+/g, " ")
      .trim();
    return PHONETIC_MAP[s] || s;
  }

  function hashText(str) {
    const bytes = new TextEncoder().encode(str);
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }

  /* تفضيل المستخدم: female (افتراضي) أو male */
  const prefMale = () => {
    try { return localStorage.getItem("abaaqira_voice") === "male"; } catch { return false; }
  };

  const prefVoiceName = () => {
    try { return localStorage.getItem("abaaqira_voiceName") || ""; } catch { return ""; }
  };

  const ttsAllowed = () => {
    try { return enabled && localStorage.getItem("abaaqira_tts") !== "0"; } catch { return enabled; }
  };

  function audioKey(text, lang) {
    const clean = cleanSpeech(text);
    if (!clean) return null;
    const g = prefMale() ? "m" : "f";
    const l = lang === "en" ? "en" : "ar";
    return { clean, g, l, key: `${g}_${l}_${hashText(clean)}` };
  }

  /* ---------- إيقاف أي نطق جارٍ ---------- */
  function stopSpeech() {
    speakSeq++;
    if (currentAudio) {
      try {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch {}
      currentAudio = null;
    }
    if ("speechSynthesis" in window) {
      try { speechSynthesis.cancel(); } catch {}
    }
  }

  /* ---------- بديل المتصفح (عند عدم توفر ملف الصوت فقط) ---------- */
  const FEMALE = /(female|woman|zariyah|naayfah|laila|layla|hoda|amel|salma|sarah|sara|amina|amira|darina|lujain|reem|hala|hind|maha|nora|nour|farah|yaasmin|jasmine|zahra|khadija|rehan|alaa|heba|hiba|haneen|midday|sana|sanaa|aisha|ayesha|mariam|maryam|fatima|fatimah|zainab|zaynab|ruqayya|aaliyah|aliyah|nadia|rania|raniah|dina|deena|lama|lamia|lamiya|asma|asra|shaima|shaimaa|manal|munira|munirah|haifa|haifaa|wafa|wafaa|bushra|najwa|najla|najlaa|samira|sameera|noura|nawal|nawar|abir|abeer|afnan|arwa|asmaa)/i;
  const MALE = /(male|man|maged|majed|naayf|khalid|hamza|hassan|yousef|yusuf|ahmed|mohamed|ali|omar|faisal|saud|tarik|fahd|bader|hadi|sameh|ziad)/i;

  const isArabicVoice = v => /^ar/i.test(v.lang || "");
  const isEnglishVoice = v => /^en/i.test(v.lang || "");

  function pickArVoice() {
    if (!("speechSynthesis" in window)) return null;
    const ar = speechSynthesis.getVoices().filter(isArabicVoice);
    if (!ar.length) return null;
    const chosen = prefVoiceName();
    if (chosen && chosen !== "neural_female") {
      const v = ar.find(x => x.name === chosen);
      if (v) return v;
    }
    if (prefMale()) return ar.find(v => MALE.test(v.name)) || ar[0];
    return ar.find(v => FEMALE.test(v.name)) || ar.find(v => !MALE.test(v.name)) || ar[0];
  }

  function pickEnVoice() {
    if (!("speechSynthesis" in window)) return null;
    const en = speechSynthesis.getVoices().filter(isEnglishVoice);
    if (!en.length) return null;
    if (prefMale()) return en.find(v => MALE.test(v.name)) || en[0];
    return en.find(v => FEMALE.test(v.name)) || en.find(v => !MALE.test(v.name)) || en[0];
  }

  function speakSynthFallback(clean, lang, onDone) {
    if (!("speechSynthesis" in window)) { if (onDone) onDone(); return; }
    try {
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = lang === "en" ? "en-US" : "ar-SA";
      u.rate = 0.92;
      u.pitch = prefMale() ? 0.95 : 1.35;
      const v = lang === "en" ? pickEnVoice() : pickArVoice();
      if (v) u.voice = v;
      if (onDone) {
        u.onend = () => onDone();
        u.onerror = () => onDone();
      }
      speechSynthesis.speak(u);
    } catch {
      if (onDone) onDone();
    }
  }

  /* ---------- تشغيل مقطع صوتي واحد (محلي أولًا ← خادم محلي ← متصفح) ---------- */
  function playClip(text, lang, seq, onDone) {
    const info = audioKey(text, lang);
    if (!info) { if (onDone) onDone(); return; }

    /* إذا اختار المستخدم صوت نظام محدد يدويًا (غير الصوت العصبي الافتراضي) */
    const chosen = prefVoiceName();
    if (chosen && chosen !== "neural_female") {
      speakSynthFallback(info.clean, info.l, onDone);
      return;
    }

    const staticUrl = `./audio/${info.key}.mp3`;
    const apiUrl = `/api/tts?g=${info.g}&l=${info.l}&t=${encodeURIComponent(info.clean)}`;

    function tryPlay(url, isApi) {
      if (seq !== speakSeq) return;
      const a = new Audio(url);
      currentAudio = a;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (currentAudio === a) currentAudio = null;
        if (seq === speakSeq && onDone) onDone();
      };
      const fail = () => {
        if (finished) return;
        finished = true;
        if (currentAudio === a) currentAudio = null;
        if (seq !== speakSeq) return;
        if (!isApi) {
          tryPlay(apiUrl, true);
        } else {
          speakSynthFallback(info.clean, info.l, onDone);
        }
      };
      a.onended = finish;
      a.onerror = fail;
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch(fail);
      }
    }

    tryPlay(staticUrl, false);
  }

  return {
    get enabled() { return enabled; },
    get voiceName() {
      const chosen = prefVoiceName();
      if (chosen && chosen !== "neural_female") return chosen;
      return prefMale()
        ? "👨 حامد — صوت ذكوري طبيعي (Neural)"
        : "👩 زارية — صوت شابة طبيعي (Neural)";
    },

    cleanSpeech,
    hashText,
    audioKey,

    toggle() {
      enabled = !enabled;
      try { localStorage.setItem("abaaqira_sound", enabled ? "1" : "0"); } catch {}
      if (enabled) this.click();
      else stopSpeech();
      return enabled;
    },

    /* ---------- المؤثرات ---------- */
    click()   { tone({ freq: 660, dur: 0.07, type: "triangle", vol: 0.12 }); },

    correct() {
      tone({ freq: 523, dur: 0.12, type: "sine", vol: 0.2 });
      tone({ freq: 659, dur: 0.12, type: "sine", vol: 0.2, delay: 0.1 });
      tone({ freq: 784, dur: 0.2,  type: "sine", vol: 0.2, delay: 0.2 });
    },

    wrong() {
      tone({ freq: 220, dur: 0.25, type: "sawtooth", vol: 0.12, slideTo: 110 });
    },

    match() {
      tone({ freq: 880, dur: 0.08, type: "triangle", vol: 0.16 });
      tone({ freq: 1174, dur: 0.14, type: "triangle", vol: 0.16, delay: 0.07 });
    },

    star() {
      tone({ freq: 1046, dur: 0.1, type: "sine", vol: 0.18 });
      tone({ freq: 1318, dur: 0.1, type: "sine", vol: 0.18, delay: 0.09 });
      tone({ freq: 1568, dur: 0.22, type: "sine", vol: 0.18, delay: 0.18 });
    },

    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) =>
        tone({ freq: f, dur: i === 4 ? 0.5 : 0.16, type: "sine", vol: 0.2, delay: i * 0.13 }));
    },

    combo() {
      tone({ freq: 784, dur: 0.1, type: "square", vol: 0.1 });
      tone({ freq: 1174, dur: 0.16, type: "square", vol: 0.1, delay: 0.1 });
    },

    /* ---------- النطق العربي (صوت شابة طبيعي) ---------- */
    speak(text) {
      if (!ttsAllowed()) return;
      stopSpeech();
      const seq = speakSeq;
      playClip(text, "ar", seq);
    },

    /* ---------- النطق الإنجليزي (صوت شابة طبيعي) ---------- */
    speakEn(text) {
      if (!ttsAllowed()) return;
      stopSpeech();
      const seq = speakSeq;
      playClip(text, "en", seq);
    },

    /* نطق تلقائي حسب لغة النص (عربي ⇄ إنجليزي) */
    speakAuto(text) {
      const clean = cleanSpeech(text);
      if (!clean) return;
      if (/[\u0600-\u06FF]/.test(clean)) this.speak(clean);
      else this.speakEn(clean);
    },

    /* عربي ثم إنجليزي بالتتابع فور انتهاء الكلمة الأولى */
    speakBoth(ar, en) {
      if (!ttsAllowed()) return;
      stopSpeech();
      const seq = speakSeq;
      playClip(ar, "ar", seq, () => {
        if (en && seq === speakSeq) {
          setTimeout(() => {
            if (seq === speakSeq) playClip(en, "en", seq);
          }, 160);
        }
      });
    },

    /* نطق بطاقة تعلّم كاملة (الوجه الأول ثم الوجه الثاني أيًّا كانت لغتهما) */
    speakPair(first, second) {
      if (!ttsAllowed()) return;
      const c1 = cleanSpeech(first);
      const c2 = cleanSpeech(second);
      if (!c1 && !c2) return;
      stopSpeech();
      const seq = speakSeq;
      const l1 = /[\u0600-\u06FF]/.test(c1) ? "ar" : "en";
      const l2 = /[\u0600-\u06FF]/.test(c2) ? "ar" : "en";
      playClip(first, l1, seq, () => {
        if (c2 && seq === speakSeq) {
          setTimeout(() => {
            if (seq === speakSeq) playClip(second, l2, seq);
          }, 180);
        }
      });
    },

    warmup() {
      if (!("speechSynthesis" in window)) return;
      try {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
      } catch {}
    },

    arabicVoices() {
      const list = [
        { name: "neural_female", label: "👩 زارية — صوت شابة طبيعي (مدمج بدون إنترنت)", lang: "ar-SA" }
      ];
      if ("speechSynthesis" in window) {
        speechSynthesis.getVoices()
          .filter(isArabicVoice)
          .forEach(v => list.push({ name: v.name, label: `${v.name} (${v.lang})`, lang: v.lang }));
      }
      return list;
    },

    setVoiceName(name) {
      try { localStorage.setItem("abaaqira_voiceName", name || ""); } catch {}
    }
  };
})();
