/* ============================================================
   عباقرة - الألعاب الثلاثة
   كل لعبة دالة تُستدعى داخل #game-root وتنتهي بـ onFinish(result)
   result = { score, stars, correct, wrong }
   ============================================================ */

const Games = (() => {

  /* أدوات مشتركة */
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* مفتاح رسم داخل خيار؟ يدعم "art:lion" والصيغة المختصرة "lion" */
  const artKey = o => {
    if (typeof o !== "string") return null;
    const k = o.startsWith("art:") ? o.slice(4) : o;
    return Art.has(k) ? k : null;
  };

  function hud(total, label) {
    const bar = el("div", "hud");
    bar.innerHTML = `
      <div class="hud-item">⭐ <span class="hud-stars">0</span>/${total}</div>
      <div class="hud-label">${label}</div>
      <div class="hud-item">🔥 <span class="hud-streak">0</span></div>`;
    return bar;
  }

  function bindHud(root) {
    return {
      setStars: n => { root.querySelector(".hud-stars").textContent = n; },
      setStreak: n => { root.querySelector(".hud-streak").textContent = n; }
    };
  }

  /* شاشة النهاية المشتركة - تُبلغ النتيجة فورًا ثم تعرض الأزرار */
  function finishScreen(root, data, onFinish) {
    const { score, stars, correct, wrong, title } = data;
    root.innerHTML = "";
    const max = correct + wrong;
    const pct = max ? Math.round((correct / max) * 100) : 0;

    const box = el("div", "result-box");
    box.innerHTML = `
      <div class="result-emoji">${pct === 100 ? "🏆" : pct >= 70 ? "🎉" : pct >= 40 ? "💪" : "📚"}</div>
      <h2>${title}</h2>
      <div class="result-stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
      <div class="result-stats">
        <div><b>${score}</b><span>نقطة</span></div>
        <div><b>${correct}</b><span>صحيحة</span></div>
        <div><b>${wrong}</b><span>خطأ</span></div>
        <div><b>${pct}%</b><span>دقة</span></div>
      </div>
      <div class="result-actions">
        <button class="btn btn-primary btn-retry">🔄 إعادة المحاولة</button>
        <button class="btn btn-ghost btn-home">🏠 الرئيسية</button>
      </div>`;
    root.appendChild(box);

    if (stars === 3) Sound.win(); else if (stars > 0) Sound.star();

    /* إبلاغ فوري بالنتيجة (لحفظها) */
    onFinish(data);

    box.querySelector(".btn-retry").onclick = () => { Sound.click(); onFinish(null); };
    box.querySelector(".btn-home").onclick = () => { Sound.click(); onFinish({ ...data, exit: true }); };
  }

  /* مكافأة السلسلة المشتركة */
  function makeCounter(root, hudApi) {
    let stars = 0, correct = 0, wrong = 0, streak = 0;
    return {
      get stars() { return stars; },
      get correct() { return correct; },
      get wrong() { return wrong; },
      good(bonus = 10) {
        correct++; streak++;
        const mult = Store.streakMultiplier();
        const gained = Math.round(bonus * mult);
        stars++;
        Store.hitStreak();
        hudApi.setStars(stars);
        hudApi.setStreak(streak);
        Sound.correct();
        if (streak === 3 || streak === 5 || streak === 8) Sound.combo();
        return gained;
      },
      /* إعادة تمثيل تقدم سابق بدون صوت أو نقاط إضافية */
      replayGood() {
        correct++; stars++;
        hudApi.setStars(stars);
      },
      bad() {
        wrong++; streak = 0;
        Store.resetStreak();
        hudApi.setStreak(streak);
        Sound.wrong();
      }
    };
  }

  /* ========================================================
     لعبة 1: المطابقة - اسحب الكلمة إلى تعريفها
     ======================================================== */
  function match(root, lesson, onFinish) {
    root.innerHTML = "";
    const pairs = lesson.pairs.slice(0, 8);
    const h = hud(pairs.length, "صلِّ الكلمة بتعريفها");
    root.appendChild(h);
    const hudApi = bindHud(root);
    const C = makeCounter(root, hudApi);
    let gained = 0;

    const board = el("div", "match-board");
    const left = el("div", "match-col");
    const right = el("div", "match-col");
    board.append(left, right);
    root.appendChild(board);

    const shuffledRight = shuffle(pairs.map((p, i) => ({ ...p, i })));
    let selected = null;     // الكلمة المختارة يسارًا
    let locked = false;

    pairs.forEach((p, i) => {
      const card = el("button", "match-card match-term", p.term);
      card.dataset.i = i;
      card.onclick = () => {
        if (locked || card.classList.contains("done")) return;
        Sound.click();
        Sound.speakAuto(p.term);   /* ما قبل القراءة: اضغط لسماع الكلمة */
        left.querySelectorAll(".match-card").forEach(c => c.classList.remove("sel"));
        card.classList.add("sel");
        selected = card;
        left.querySelectorAll(".match-card").forEach(c => c.classList.remove("shake"));
      };
      left.appendChild(card);
    });

    shuffledRight.forEach(p => {
      const card = el("button", "match-card match-def", p.def);
      card.dataset.i = p.i;
      card.onclick = () => {
        if (locked || card.classList.contains("done")) return;
        Sound.speakAuto(p.def);
        if (!selected) return;
        if (card.classList.contains("sel")) { card.classList.remove("sel"); return; }

        if (+card.dataset.i === +selected.dataset.i) {
          // صحيح
          const pts = C.good(10);
          gained += pts;
          selected.classList.add("done");
          card.classList.add("done", "pop");
          selected.classList.remove("sel");
          selected.disabled = card.disabled = true;
          selected = null;
          Sound.match();

          if (C.correct === pairs.length) {
            locked = true;
            setTimeout(() => {
              const stars = C.wrong === 0 ? 3 : C.correct > C.wrong ? 2 : 1;
              finishScreen(root, {
                score: gained, stars, correct: C.correct, wrong: C.wrong,
                title: "أحسنت المطابقة!"
              }, onFinish);
            }, 700);
          }
        } else {
          // خطأ
          C.bad();
          gained = Math.max(0, gained - 2);
          card.classList.add("shake", "bad");
          selected.classList.add("shake");
          const wrongSel = selected;
          setTimeout(() => {
            card.classList.remove("shake", "bad");
            if (wrongSel) wrongSel.classList.remove("shake", "sel");
          }, 500);
          selected = null;
        }
      };
      right.appendChild(card);
    });
  }

  /* ========================================================
     لعبة 2: الاختيار من متعدد
     ======================================================== */
  function quiz(root, lesson, onFinish) {
    const questions = shuffle(lesson.quiz.slice());
    let idx = 0;
    let gained = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let hudApi = null;
    let C = null;

    function render() {
      root.innerHTML = "";
      const h = hud(questions.length, `سؤال ${idx + 1} من ${questions.length}`);
      root.appendChild(h);
      hudApi = bindHud(root);

      /* إعادة بناء العدّاد مع الحفاظ على تقدم الجولة */
      C = makeCounter(root, hudApi);
      for (let k = 0; k < totalCorrect; k++) C.replayGood();
      hudApi.setStars(totalCorrect);
      hudApi.setStreak(Store.get().streak);

      const q = questions[idx];
      const card = el("div", "quiz-card");
      card.innerHTML = `
        <div class="quiz-head">
          <button class="btn-speaker" title="استمع للسؤال">🔊</button>
          <h3 class="quiz-q"></h3>
        </div>
        ${q.art ? `<div class="quiz-art">${Art.get(q.art)}</div>` : ""}
        <div class="quiz-opts"></div>
        <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${(idx / questions.length) * 100}%"></div></div>`;
      card.querySelector(".quiz-q").textContent = q.q;

      const opts = card.querySelector(".quiz-opts");
      const order = shuffle(q.options.map((o, i) => ({ o, i })));
      let answered = false;

      order.forEach(({ o, i }) => {
        const b = el("button", "quiz-opt", "");
        b.dataset.i = i;
        const key = artKey(o);
        if (key) { b.classList.add("quiz-opt-art"); b.innerHTML = Art.get(key); }
        else b.textContent = o;
        b.onclick = () => {
          if (answered) return;
          answered = true;
          const all = Array.from(opts.querySelectorAll(".quiz-opt"));

          if (i === q.answer) {
            gained += C.good(10);
            totalCorrect++;
            all.forEach((x, k) => { if (order[k].i === q.answer) x.classList.add("ok"); });
          } else {
            C.bad();
            totalWrong++;
            b.classList.add("no");
            all.forEach((x, k) => { if (order[k].i === q.answer) x.classList.add("ok"); });
          }
          all.forEach(x => x.disabled = true);

          setTimeout(() => {
            idx++;
            if (idx >= questions.length) {
              const stars = totalWrong === 0 ? 3 : totalCorrect >= questions.length * 0.7 ? 2 : 1;
              finishScreen(root, {
                score: gained, stars, correct: totalCorrect, wrong: totalWrong,
                title: "انتهى الاختبار!"
              }, onFinish);
            } else render();
          }, 950);
        };
        opts.appendChild(b);
      });

      /* ما يُنطق: السؤال + الإجابة الصحيحة (إذا كانت كلمة لا صورة) */
      const correctOpt = q.options[q.answer];
      const spoken = artKey(correctOpt) ? q.q : q.q + ". " + correctOpt;
      card.querySelector(".btn-speaker").onclick = e => {
        e.stopPropagation();
        Sound.click();
        Sound.speakAuto(spoken);
      };

      root.appendChild(card);
      Sound.speak(q.q);
    }

    render();
  }

  /* ========================================================
     لعبة 3: صواب وخطأ
     ======================================================== */
  function tf(root, lesson, onFinish) {
    const items = shuffle(lesson.trueFalse.slice());
    let idx = 0;
    let gained = 0;
    let totalCorrect = 0;
    let totalWrong = 0;

    function render() {
      root.innerHTML = "";
      const it = items[idx];
      const h = hud(items.length, `عبارة ${idx + 1} من ${items.length}`);
      root.appendChild(h);
      const hudApi = bindHud(root);
      const C = makeCounter(root, hudApi);
      /* استمرار تقدم الجولة */
      for (let k = 0; k < totalCorrect; k++) C.replayGood();
      hudApi.setStars(totalCorrect);
      hudApi.setStreak(Store.get().streak);

      const card = el("div", "tf-card");
      card.innerHTML = `
        <div class="tf-statement">${it.s}</div>
        <div class="tf-actions">
          <button class="btn tf-true">✅ صواب</button>
          <button class="btn tf-false">❌ خطأ</button>
        </div>
        <div class="tf-feedback"></div>
        <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${(idx / items.length) * 100}%"></div></div>`;

      let answered = false;
      const fb = card.querySelector(".tf-feedback");

      function answer(val) {
        if (answered) return;
        answered = true;
        const ok = val === it.a;
        if (ok) {
          gained += C.good(10);
          totalCorrect++;
          fb.textContent = "إجابة صحيحة! 🎉";
          fb.className = "tf-feedback ok";
        } else {
          C.bad();
          totalWrong++;
          fb.textContent = it.a ? "الإجابة الصحيحة: صواب" : "الإجابة الصحيحة: خطأ";
          fb.className = "tf-feedback no";
        }
        card.querySelector(".tf-true").classList.toggle("ok", it.a);
        card.querySelector(".tf-false").classList.toggle("ok", !it.a);
        if (!ok) card.querySelector(val ? ".tf-true" : ".tf-false").classList.add("no");
        card.querySelectorAll("button").forEach(b => b.disabled = true);

        setTimeout(() => {
          idx++;
          if (idx >= items.length) {
            const stars = totalWrong === 0 ? 3 : totalCorrect >= items.length * 0.7 ? 2 : 1;
            finishScreen(root, {
              score: gained, stars, correct: totalCorrect, wrong: totalWrong,
              title: "أحسنت!"
            }, onFinish);
          } else render();
        }, 1100);
      }

      card.querySelector(".tf-true").onclick = () => { Sound.click(); answer(true); };
      card.querySelector(".tf-false").onclick = () => { Sound.click(); answer(false); };

      root.appendChild(card);
      Sound.speak(it.s);
    }

    render();
  }

  /* ========================================================
     لعبة 4: استمع واختر — المرحلة الأولى (الأذن قبل القلم)
     الطفل يسمع الصوت/الكلمة ثم يختر الصورة من دون قراءة
     ======================================================== */
  function listen(root, lesson, onFinish) {
    const items = shuffle(lesson.listen.slice());
    let idx = 0, gained = 0, totalCorrect = 0, totalWrong = 0;

    function render() {
      root.innerHTML = "";
      const it = items[idx];
      const h = hud(items.length, `صورة ${idx + 1} من ${items.length}`);
      root.appendChild(h);
      const hudApi = bindHud(root);
      const C = makeCounter(root, hudApi);
      for (let k = 0; k < totalCorrect; k++) C.replayGood();
      hudApi.setStars(totalCorrect);
      hudApi.setStreak(Store.get().streak);

      const card = el("div", "listen-card");
      card.innerHTML = `
        <div class="listen-top">
          <button class="listen-speaker" title="استمع مرة أخرى">🔊</button>
          <div class="listen-words">
            <b>اسمع جيدًا ثم اختر الصورة</b>
            <span class="listen-hint">${it.en
              ? `${it.say} · <span dir="ltr">${it.en}</span>`
              : "👩‍🏫 للمعلم: انطق الصوت مرتين ثم اطلب الصورة التي تبدأ به"}</span>
          </div>
        </div>
        <div class="listen-opts"></div>
        <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${(idx / items.length) * 100}%"></div></div>`;

      const opts = card.querySelector(".listen-opts");
      const order = shuffle(it.options.map((o, i) => ({ o, i })));
      let answered = false;

      order.forEach(({ o, i }) => {
        const b = el("button", "listen-opt", "");
        b.dataset.i = i;
        const key = artKey(o);
        if (key) { b.classList.add("has-art"); b.innerHTML = Art.get(key); }
        else b.textContent = o;

        b.onclick = () => {
          if (answered) return;
          answered = true;
          const all = Array.from(opts.querySelectorAll(".listen-opt"));
          all.forEach(x => x.disabled = true);

          if (i === it.answer) {
            gained += C.good(10);
            totalCorrect++;
            b.classList.add("ok", "pop");
            say();                       /* نعيد نطق الكلمة الصحيحة */
          } else {
            C.bad();
            totalWrong++;
            b.classList.add("no");
            all.forEach(x => { if (+x.dataset.i === it.answer) x.classList.add("ok"); });
            say();
          }

          setTimeout(() => {
            idx++;
            if (idx >= items.length) {
              const stars = totalWrong === 0 ? 3 : totalCorrect >= items.length * 0.7 ? 2 : 1;
              finishScreen(root, {
                score: gained, stars, correct: totalCorrect, wrong: totalWrong,
                title: "أحسنت الاستماع!"
              }, onFinish);
            } else render();
          }, 1400);
        };
        opts.appendChild(b);
      });

      function say() {
        if (it.en) Sound.speakBoth(it.say, it.en);
        else Sound.speakAuto(it.say);
      }
      card.querySelector(".listen-speaker").onclick = e => {
        e.stopPropagation();
        Sound.click();
        say();
      };

      root.appendChild(card);
      say();
    }

    render();
  }

  /* ========================================================
     لعبة 5: تتبع الحرف — المرحلة الثالثة (التدريب الحسي)
     الطفل يمرّر إصبعه فوق الحرف حتى يمتلئ (لمس + بصر)
     ======================================================== */
  function trace(root, lesson, onFinish) {
    const strip = s => String(s).replace(/[\u064B-\u0652\u0670]/g, "");
    const letters = (lesson.trace || []).map(t =>
      typeof t === "string" ? { letter: strip(t), say: t } : { letter: strip(t.letter), say: t.say || t.letter });
    if (!letters.length) return;

    const W = 260, H = 260;
    let brushMode = "auto";   /* auto | hand | pen */
    function brushWidth(e) {
      const t = brushMode === "auto" ? (e && e.pointerType) : brushMode;
      if (t === "pen") return Math.max(6, 12 * ((e && e.pressure > 0.05) ? e.pressure * 1.4 : 0.9));
      return 26;
    }
    let idx = 0, gained = 0, totalCorrect = 0, totalWrong = 0, timer = null;

    function render() {
      if (timer) clearInterval(timer);
      root.innerHTML = "";
      const it = letters[idx];
      const h = hud(letters.length, `حرف ${idx + 1} من ${letters.length}`);
      root.appendChild(h);
      const hudApi = bindHud(root);
      const C = makeCounter(root, hudApi);
      for (let k = 0; k < totalCorrect; k++) C.replayGood();
      hudApi.setStars(totalCorrect);
      hudApi.setStreak(Store.get().streak);

      const card = el("div", "trace-card");
      card.innerHTML = `
        <div class="quiz-head">
          <button class="btn-speaker" title="استمع للحرف">🔊</button>
          <div class="trace-head">
            <h3 class="quiz-q">تتبّع الحرف: ${it.letter}</h3>
            <p class="trace-sub">مرّر إصبعك فوق الحرف حتى يمتلئ باللون ✨</p>
          </div>
        </div>
        <div class="trace-wrap">
          <canvas class="trace-guide" width="${W}" height="${H}"></canvas>
          <canvas class="trace-ink" width="${W}" height="${H}"></canvas>
          <div class="trace-pct">0%</div>
        </div>
        <div class="trace-actions">
          <button class="btn btn-ghost trace-clear">🧽 مسح</button>
          <button class="btn btn-ghost trace-demo">👀 شاهد</button>
          <button class="btn btn-ghost trace-mode" title="تبديل: تلقائي / يد / قلم">🤖 تلقائي</button>
        </div>
        <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${(idx / letters.length) * 100}%"></div></div>`;
      root.appendChild(card);

      const guide = card.querySelector(".trace-guide");
      const ink = card.querySelector(".trace-ink");
      const gctx = guide.getContext("2d");
      const ictx = ink.getContext("2d");
      const pctEl = card.querySelector(".trace-pct");

      const font = '800 110px Tahoma, "Segoe UI", sans-serif';
      const drawLetter = (ctx, fill, stroke) => {
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (fill) { ctx.fillStyle = fill; ctx.fillText(it.letter, W / 2, H / 2 + 8); }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([7, 6]);
          ctx.strokeText(it.letter, W / 2, H / 2 + 8);
          ctx.setLineDash([]);
        }
      };

      /* قناع الحرف — لقياس نسبة التغطية */
      const maskC = document.createElement("canvas");
      maskC.width = W; maskC.height = H;
      const mctx = maskC.getContext("2d");
      drawLetter(mctx, "#fff", null);
      const mask = mctx.getImageData(0, 0, W, H).data;

      let M = 0;
      for (let y = 0; y < H; y += 2)
        for (let x = 0; x < W; x += 2)
          if (mask[(y * W + x) * 4 + 3] > 128) M++;

      drawLetter(gctx, "rgba(255,255,255,.10)", "rgba(255,255,255,.45)");

      ictx.lineWidth = 26;
      ictx.lineCap = "round";
      ictx.lineJoin = "round";
      ictx.strokeStyle = "#fbbf24";
      ictx.fillStyle = "#fbbf24";

      let drawing = false, done = false, last = null;

      function check() {
        if (done || !M) return;
        const d = ictx.getImageData(0, 0, W, H).data;
        let inside = 0, outside = 0;
        for (let y = 0; y < H; y += 2) {
          for (let x = 0; x < W; x += 2) {
            if (d[(y * W + x) * 4 + 3] > 60) {
              if (mask[(y * W + x) * 4 + 3] > 128) inside++;
              else outside++;
            }
          }
        }
        pctEl.textContent = Math.min(100, Math.round((inside / M) * 100)) + "%";

        /* ينجح عند تغطية الجزء الأكبر من الحرف دون تلوين خارجه كثيرًا */
        if (inside / M >= 0.6 && outside / M <= 0.9) {
          done = true;
          totalCorrect++;
          gained += C.good(10);
          Sound.speakAuto(it.say);
          pctEl.textContent = "100% 🎉";
          setTimeout(() => {
            idx++;
            if (idx >= letters.length) {
              if (timer) clearInterval(timer);
              const stars = totalWrong === 0 ? 3 : totalCorrect >= letters.length * 0.7 ? 2 : 1;
              finishScreen(root, {
                score: gained, stars, correct: totalCorrect, wrong: totalWrong,
                title: "أتتبّعت الحروف بارتباط!"
              }, onFinish);
            } else render();
          }, 1100);
        }
      }

      const pos = e => {
        const r = ink.getBoundingClientRect();
        return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
      };

      ink.onpointerdown = e => {
        if (done) return;
        drawing = true;
        try { ink.setPointerCapture(e.pointerId); } catch {}
        last = pos(e);
        ictx.lineWidth = brushWidth(e);
        ictx.beginPath();
        ictx.arc(last[0], last[1], 10, 0, Math.PI * 2);
        ictx.fill();
        e.preventDefault();
      };
      ink.onpointermove = e => {
        if (!drawing || done || !last) return;
        const p = pos(e);
        ictx.lineWidth = brushWidth(e);
        ictx.beginPath();
        ictx.moveTo(last[0], last[1]);
        ictx.lineTo(p[0], p[1]);
        ictx.stroke();
        last = p;
        e.preventDefault();
      };
      const stop = () => { if (drawing) { drawing = false; check(); } };
      ink.onpointerup = stop;
      ink.onpointercancel = stop;

      card.querySelector(".btn-speaker").onclick = () => { Sound.click(); Sound.speakAuto(it.say); };
      card.querySelector(".trace-clear").onclick = () => {
        Sound.click();
        ictx.clearRect(0, 0, W, H);
        pctEl.textContent = "0%";
      };
      card.querySelector(".trace-demo").onclick = () => {
        if (done) return;
        Sound.click();
        drawLetter(ictx, "#fbbf24", null);
        check();
      };
      const modeBtn = card.querySelector(".trace-mode");
      const updateModeLabel = () => {
        const labels = { auto: "🤖 تلقائي", hand: "✋ يد", pen: "✏️ قلم" };
        modeBtn.textContent = labels[brushMode];
      };
      updateModeLabel();
      modeBtn.onclick = () => {
        Sound.click();
        const order = ["auto", "hand", "pen"];
        brushMode = order[(order.indexOf(brushMode) + 1) % order.length];
        updateModeLabel();
      };

      timer = setInterval(() => { if (!done) check(); }, 350);
      Sound.speakAuto(it.say);
    }

    render();
  }

  /* ========================================================
     لعبة 6: أُركّب الكلمة — التحليل والتركيب الصوتي للكلمات
     الطفل يسمع الكلمة ويرى صورتها ثم يرتّب حروفها مع نطق كل حرف
     ======================================================== */
  function build(root, lesson, onFinish) {
    const items = (lesson.build || []).slice();
    if (!items.length) return;
    let idx = 0, gained = 0, totalCorrect = 0, totalWrong = 0;

    function render() {
      root.innerHTML = "";
      const it = items[idx];
      const parts = it.parts.slice();
      const h = hud(items.length, `كلمة ${idx + 1} من ${items.length}`);
      root.appendChild(h);
      const hudApi = bindHud(root);
      const C = makeCounter(root, hudApi);
      for (let k = 0; k < totalCorrect; k++) C.replayGood();
      hudApi.setStars(totalCorrect);
      hudApi.setStreak(Store.get().streak);

      const card = el("div", "build-card");
      card.innerHTML = `
        <div class="quiz-head">
          <button class="btn-speaker" title="استمع للكلمة">🔊</button>
          <div>
            <h3 class="quiz-q">ركِّب حروف الكلمة بالترتيب</h3>
            <p class="trace-sub">اضغط على الحرف الأوّل فالثاني لتكوين الكلمة</p>
          </div>
        </div>
        ${it.art ? `<div class="quiz-art">${Art.get(it.art)}</div>` : ""}
        <div class="build-slots"></div>
        <div class="build-tiles"></div>
        <div class="build-done-word"></div>
        <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${(idx / items.length) * 100}%"></div></div>`;
      root.appendChild(card);

      const slotsBox = card.querySelector(".build-slots");
      const tilesBox = card.querySelector(".build-tiles");
      const doneWord = card.querySelector(".build-done-word");

      const slots = parts.map((_, i) => {
        const s = el("div", "build-slot", `${i + 1}`);
        slotsBox.appendChild(s);
        return s;
      });

      let order = shuffle(parts.map((p, i) => ({ p, i })));
      if (parts.length > 1 && order.every((x, i) => x.p === parts[i]) && new Set(parts).size > 1) {
        order.reverse();
      }

      let step = 0, locked = false;

      order.forEach(({ p, i }) => {
        const b = el("button", "build-tile", p);
        b.dataset.i = i;
        b.dataset.part = p;
        b.onclick = () => {
          if (locked || b.disabled) return;
          if (p === parts[step]) {
            b.disabled = true;
            b.classList.add("used");
            const sl = slots[step];
            sl.textContent = p;
            sl.classList.add("filled", "pop");
            step++;

            if (step < parts.length) {
              Sound.click();
              Sound.speak(p);
            } else {
              locked = true;
              totalCorrect++;
              gained += C.good(10);
              doneWord.textContent = `🎉 أَحسَنت! الكلمة هي: ${it.word}`;
              doneWord.classList.add("show");
              Sound.speak(it.say || it.word);
              setTimeout(() => {
                idx++;
                if (idx >= items.length) {
                  const stars = totalWrong === 0 ? 3 : totalCorrect >= items.length * 0.7 ? 2 : 1;
                  finishScreen(root, {
                    score: gained, stars, correct: totalCorrect, wrong: totalWrong,
                    title: "ركّبت الكلمات ببراعة!"
                  }, onFinish);
                } else render();
              }, 1250);
            }
          } else {
            totalWrong++;
            C.bad();
            b.classList.add("shake", "no");
            setTimeout(() => b.classList.remove("shake", "no"), 450);
          }
        };
        tilesBox.appendChild(b);
      });

      card.querySelector(".btn-speaker").onclick = e => {
        e.stopPropagation();
        Sound.click();
        Sound.speak(it.say || it.word);
      };

      Sound.speak(it.say || it.word);
    }

    render();
  }

  return { match, quiz, tf, listen, trace, build };
})();
