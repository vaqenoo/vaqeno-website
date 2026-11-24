/* ============================================================
   عباقرة - التطبيق الرئيسي (SPA بدون إعادة تحميل)
   أقسام: الروضة (أول/ثاني/ثالث) + دروس المنهج + أخبار ونصائح
   ============================================================ */

const App = (() => {
  const $ = s => document.querySelector(s);
  const root = () => $("#app");
  let newsTimer = null;
  let liveUnsub = null;

  function copyText(text, okMsg = "✅ تم نسخ الرابط") {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast(okMsg)).catch(() => fallbackCopy(text, okMsg));
    } else {
      fallbackCopy(text, okMsg);
    }
  }

  function fallbackCopy(text, okMsg) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast(okMsg);
    } catch {
      toast("⚠️ انسخ الرابط يدويًا من المربع");
    }
  }

  /* نص مختصر لآخر عملية حفظ (لعرض شارة الحفظ التلقائي) */
  function savedAgo(ts) {
    if (!ts) return "لم يُحفظ بعد";
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "آخر حفظ: الآن";
    if (m < 60) return `آخر حفظ: قبل ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24) return `آخر حفظ: قبل ${h} ساعة`;
    const d = Math.floor(h / 24);
    return `آخر حفظ: قبل ${d} يوم`;
  }

  /* تحديد الدرس الحالي المقترح لجلسة الطالب */
  function currentLessonFor(s) {
    if (s.lastLessonId) {
      const last = findLesson(s.lastLessonId);
      if (last && !Store.lessonStars(last.id).completed) return last;
    }
    for (const g of GRADES) {
      for (const l of g.lessons) {
        if (!Store.lessonStars(l.id).completed) return l;
      }
    }
    for (const l of LESSONS) {
      if (!Store.lessonStars(l.id).completed) return l;
    }
    return (s.lastLessonId && findLesson(s.lastLessonId)) || GRADES[0].lessons[0];
  }

  function findParentGrade(lessonId) {
    return GRADES.find(g => g.lessons.some(l => l.id === lessonId)) || null;
  }

  /* ---------- شاشة البداية: اسم الطالب أو إنشاء جلسة للمعلم وإرسال الرابط ---------- */
  function welcomePage(initialTab = "student") {
    const s = Store.get();
    const room = Store.getRoom();
    const savedList = Store.listProfiles().filter(p => p.player && p.player !== "صديقي");
    const avatars = Store.AVATARS || ["🦁", "🦋", "🚀", "🧸", "🌟", "👑", "🐰", "🐬", "🍓", "🦊"];
    let pickedAvatar = s.avatar || avatars[0];
    let activeTab = initialTab === "teacher" ? "teacher" : "student";

    const defaultStudentName = s.player && s.player !== "صديقي" ? s.player : "";
    const defaultRoomCode = room && room.code ? room.code : "";
    const defaultTeacherTitle = (room && room.title && room.title !== "جلسة المعلم") ? room.title : "";

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <section class="welcome-shell">
        <div class="welcome-head">
          <div class="welcome-logo">🎓</div>
          <h1>مرحبًا بك في منصة عباقرة</h1>
          <p>اكتب اسم الطالب لحفظ تقدّمه ونجومه تلقائيًا، أو أنشئ جلسة للمعلم وأرسل الرابط للطلاب</p>
        </div>

        <div class="welcome-tabs" role="tablist">
          <button type="button" class="welcome-tab${activeTab === "student" ? " active" : ""}" id="tab-btn-student">
            🎒 دخول الطالب
          </button>
          <button type="button" class="welcome-tab${activeTab === "teacher" ? " active" : ""}" id="tab-btn-teacher">
            👨‍🏫 جلسة للمعلم وإرسال الرابط
          </button>
        </div>

        <!-- مسار الطالب -->
        <div class="welcome-pane${activeTab === "student" ? " show" : ""}" id="pane-student">
          ${room ? `
          <div class="room-invite-banner">
            <span class="room-invite-ic">🏫</span>
            <div class="room-invite-txt">
              <b>أنت في جلسة: ${escapeHtml(room.title || "جلسة المعلم")}</b>
              <span>رمز الجلسة: <code>${escapeHtml(room.code)}</code> · اكتب اسمك ليصل تقدّمك ونجومك لمعلمك تلقائيًا</span>
            </div>
          </div>` : ""}

          <div class="welcome-card">
            <h3>✍️ اكتب اسم الطالب واختر رمزه</h3>
            <p class="method-note">يُحفظ تقدّم الطالب (النقاط، النجوم، الملصقات، الشهادة، وآخر درس) باسمه تلقائيًا بعد كل جولة</p>

            <div class="avatar-picker" id="w-avatar-picker">
              ${avatars.map(a => `<button type="button" class="avatar-choice${a === pickedAvatar ? " sel" : ""}" data-av="${a}">${a}</button>`).join("")}
            </div>

            <label class="welcome-field">
              <span>اسم الطالب (مطلوب)</span>
              <input id="w-student-name" maxlength="30" value="${escapeHtml(defaultStudentName)}" placeholder="مثال: سارة أحمد، عمر خالد..." autocomplete="off" />
            </label>

            <label class="welcome-field">
              <span>🔑 رمز جلسة المعلم (اختياري — إن أرسل لك معلمك رمزًا أو رابطًا)</span>
              <input id="w-room-code" maxlength="16" dir="ltr" value="${escapeHtml(defaultRoomCode)}" placeholder="مثال: ABQ-4829 (اتركه فارغًا للتعلّم الفردي)" autocomplete="off" />
            </label>

            <button type="button" class="btn btn-primary welcome-submit" id="w-start-student">
              🚀 ابدأ التعلّم واحفظ تقدمي
            </button>
          </div>

          ${savedList.length ? `
          <div class="welcome-saved">
            <h4>🏆 أو أكمل بجلسة محفوظة على هذا الجهاز (${savedList.length}):</h4>
            <div class="welcome-saved-list" id="w-saved-list"></div>
          </div>` : ""}

          <div class="welcome-switch-foot">
            <button type="button" class="btn btn-ghost" id="w-go-teacher-tab">
              👨‍🏫 هل أنت معلم؟ أنشئ جلسة وأرسل الرابط للطلاب ←
            </button>
          </div>
        </div>

        <!-- مسار المعلم -->
        <div class="welcome-pane${activeTab === "teacher" ? " show" : ""}" id="pane-teacher">
          <div class="welcome-card teacher-create-card">
            <h3>👨‍🏫 إنشاء جلسة للمعلم وإرسال الرابط للطلاب</h3>
            <p class="method-note">أنشئ جلسة باسمك أو اسم الفصل، ثم انسخ رابط الطلاب أو أرسله عبر واتساب. فور فتح الطالب للرابط وكتابة اسمه يصل تقدّمه ونجومه إلى لوحة المعلم مباشرة.</p>

            <label class="welcome-field">
              <span>🏫 اسم المعلم أو الفصل</span>
              <input id="w-teacher-title" maxlength="45" value="${escapeHtml(defaultTeacherTitle)}" placeholder="مثال: أ. أحمد — روضة أول / معلمة سارة — تمهيدي" />
            </label>

            <div class="teacher-gen-actions">
              <button type="button" class="btn btn-primary" id="w-btn-create-room">
                ✨ ${room && room.code ? "تحديث اسم الجلسة وتجهيز الرابط" : "إنشاء جلسة المعلم وتوليد رابط الطلاب"}
              </button>
              <button type="button" class="btn btn-ghost" id="w-btn-new-code" title="توليد رمز جلسة جديد">
                🔄 رمز جلسة جديد
              </button>
            </div>

            <div class="teacher-share-box" id="w-teacher-share-box">
              <div class="teacher-share-head">
                <div>
                  <span class="share-lbl">الجلسة النشطة:</span>
                  <b id="w-share-title">—</b>
                </div>
                <div class="share-code-wrap">
                  <span class="share-lbl">رمز الجلسة:</span>
                  <code class="room-code-badge" id="w-share-code">—</code>
                </div>
              </div>

              <label class="welcome-field" style="margin-top:10px">
                <span>🔗 رابط الطلاب الجاهز للإرسال (انسخه وأرسله لطلابك):</span>
                <div class="invite-url-row">
                  <input id="w-share-url" dir="ltr" readonly value="" />
                  <button type="button" class="btn btn-primary btn-sm" id="w-btn-copy-link">📋 نسخ الرابط</button>
                </div>
              </label>

              <div class="teacher-share-buttons">
                <button type="button" class="btn btn-primary" id="w-btn-copy-big">📋 نسخ رابط الطلاب</button>
                <a class="btn btn-wa" id="w-btn-wa" href="#" target="_blank" rel="noopener">💬 إرسال الرابط عبر واتساب</a>
                <button type="button" class="btn btn-ghost" id="w-btn-native-share">📤 مشاركة الرابط</button>
              </div>

              <div class="teacher-go-dash">
                <button type="button" class="btn btn-primary welcome-submit" id="w-btn-open-dashboard">
                  👨‍🏫 فتح لوحة المعلم ومتابعة الطلاب الآن ←
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>`;

    root().appendChild(view);

    const setTab = tab => {
      activeTab = tab;
      view.querySelector("#tab-btn-student").classList.toggle("active", tab === "student");
      view.querySelector("#tab-btn-teacher").classList.toggle("active", tab === "teacher");
      view.querySelector("#pane-student").classList.toggle("show", tab === "student");
      view.querySelector("#pane-teacher").classList.toggle("show", tab === "teacher");
      if (tab === "teacher") ensureTeacherRoomRendered(false);
    };

    view.querySelector("#tab-btn-student").onclick = () => { Sound.click(); setTab("student"); };
    view.querySelector("#tab-btn-teacher").onclick = () => { Sound.click(); setTab("teacher"); };
    view.querySelector("#w-go-teacher-tab").onclick = () => { Sound.click(); setTab("teacher"); };

    /* اختيار رمز الطالب */
    view.querySelectorAll("#w-avatar-picker .avatar-choice").forEach(b => {
      b.onclick = () => {
        Sound.click();
        pickedAvatar = b.dataset.av;
        view.querySelectorAll("#w-avatar-picker .avatar-choice").forEach(x => x.classList.toggle("sel", x === b));
      };
    });

    /* بدء جلسة الطالب */
    const nameInp = view.querySelector("#w-student-name");
    const roomInp = view.querySelector("#w-room-code");
    const submitStudent = () => {
      const name = (nameInp.value || "").trim();
      if (!name || name === "صديقي") {
        toast("✍️ فضلًا اكتب اسم الطالب أولًا");
        nameInp.focus();
        return;
      }
      const codeVal = (roomInp.value || "").trim();
      if (codeVal) {
        const curR = Store.getRoom();
        const titleToKeep = curR && curR.code === Store.normalizeRoomCode(codeVal) ? curR.title : "";
        Store.joinStudentRoom(codeVal, titleToKeep);
      }
      Store.setPlayer(name, pickedAvatar);
      Sound.star();
      toast(`🎉 مرحبًا ${name}! يُحفظ تقدّمك تلقائيًا`);
      go("#/");
    };
    view.querySelector("#w-start-student").onclick = submitStudent;
    nameInp.onkeydown = e => { if (e.key === "Enter") submitStudent(); };
    roomInp.onkeydown = e => { if (e.key === "Enter") submitStudent(); };

    /* الجلسات المحفوظة على الجهاز */
    const savedContainer = view.querySelector("#w-saved-list");
    if (savedContainer) {
      savedList.forEach(p => {
        const item = el("div", "welcome-saved-item");
        item.innerHTML = `
          <span class="ws-avatar">${p.avatar || "🦁"}</span>
          <div class="ws-info">
            <b>${escapeHtml(p.player)}</b>
            <small>⭐ ${p.stars} نجمة · 💎 ${p.points} نقطة</small>
          </div>
          <button type="button" class="btn btn-primary btn-sm">▶️ متابعة</button>`;
        item.querySelector("button").onclick = () => {
          Sound.click();
          const codeVal = (roomInp.value || "").trim();
          if (codeVal) {
            const curR = Store.getRoom();
            const titleToKeep = curR && curR.code === Store.normalizeRoomCode(codeVal) ? curR.title : "";
            Store.joinStudentRoom(codeVal, titleToKeep);
          }
          Store.switchProfile(p.id);
          toast(`👋 مرحبًا بعودتك يا ${p.player}!`);
          go("#/");
        };
        savedContainer.appendChild(item);
      });
    }

    /* إعداد ومشاركة رابط جلسة المعلم */
    const teacherTitleInp = view.querySelector("#w-teacher-title");
    function renderShareBox(rObj) {
      if (!rObj || !rObj.code) return;
      const url = Store.getStudentInviteUrl(rObj);
      view.querySelector("#w-share-title").textContent = rObj.title || "فصل عباقرة";
      view.querySelector("#w-share-code").textContent = rObj.code;
      view.querySelector("#w-share-url").value = url;
      view.querySelector("#w-btn-wa").href = Store.getStudentWhatsAppUrl(rObj);
    }

    function ensureTeacherRoomRendered(announceToast = false) {
      const title = (teacherTitleInp.value || "").trim() || (Store.getRoom() && Store.getRoom().title) || "فصل عباقرة";
      if (!teacherTitleInp.value) teacherTitleInp.value = title;
      const rObj = Store.createTeacherRoom(title);
      renderShareBox(rObj);
      if (announceToast) {
        Sound.star();
        toast(`✅ تم تجهيز جلسة المعلم (${rObj.code}) — انسخ الرابط وأرسله لطلابك`);
      }
      return rObj;
    }

    if (activeTab === "teacher" || (room && room.code)) {
      if (room && room.code) renderShareBox(room);
      else ensureTeacherRoomRendered(false);
    }

    view.querySelector("#w-btn-create-room").onclick = () => {
      ensureTeacherRoomRendered(true);
    };

    view.querySelector("#w-btn-new-code").onclick = () => {
      Sound.click();
      const title = (teacherTitleInp.value || "").trim() || "فصل عباقرة";
      const rObj = Store.regenerateTeacherRoom(title);
      Store.createTeacherRoom(rObj.title, rObj.code);
      renderShareBox(rObj);
      toast(`🔄 تم توليد رمز جلسة جديد: ${rObj.code}`);
    };

    const doCopyLink = () => {
      Sound.click();
      const rObj = ensureTeacherRoomRendered(false);
      copyText(Store.getStudentInviteUrl(rObj), "✅ تم نسخ رابط الطلاب — أرسله لطلابك الآن");
    };
    view.querySelector("#w-btn-copy-link").onclick = doCopyLink;
    view.querySelector("#w-btn-copy-big").onclick = doCopyLink;

    view.querySelector("#w-btn-native-share").onclick = async () => {
      Sound.click();
      const rObj = ensureTeacherRoomRendered(false);
      const url = Store.getStudentInviteUrl(rObj);
      if (navigator.share) {
        try {
          await navigator.share({
            title: `منصة عباقرة — ${rObj.title}`,
            text: `افتح الرابط واكتب اسمك للانضمام إلى جلسة (${rObj.title}) في منصة عباقرة التعليمية:`,
            url
          });
          return;
        } catch {}
      }
      copyText(url, "✅ تم نسخ رابط الطلاب — أرسله لطلابك الآن");
    };

    view.querySelector("#w-btn-open-dashboard").onclick = () => {
      Sound.click();
      ensureTeacherRoomRendered(false);
      go("#/teacher");
    };
  }

  /* ---------- الصفحة الرئيسية ---------- */

  function home() {
    const s = Store.get();
    const room = Store.getRoom();
    const profiles = Store.listProfiles();
    const name = s.player || "صديقي";
    const avatar = s.avatar || "🦁";
    const curLesson = currentLessonFor(s);
    const curLessonSt = curLesson ? Store.lessonStars(curLesson.id) : null;
    const curGrade = curLesson ? findParentGrade(curLesson.id) : null;
    const unlockedStickers = (typeof REWARD_STICKERS !== "undefined" ? REWARD_STICKERS : [])
      .filter(st => s.stars >= st.need).length;

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="hero">
        <button class="hero-avatar" id="btn-avatar" title="تغيير اسم الطالب أو الجلسة">${avatar}</button>
        <div class="hero-info">
          <div class="session-pill" id="btn-session-pill" title="اضغط لتغيير اسم الطالب أو الانضمام لجلسة معلم">
            <span class="session-dot"></span>
            <span>جلسة الطالب: <b>${escapeHtml(name)}</b> ✎</span>
          </div>
          <h1 class="hero-title">عباقرة</h1>
        </div>
        <div class="hero-actions">
          <button class="btn-session-switch" id="btn-teacher-link" title="إنشاء جلسة للمعلم وإرسال الرابط للطلاب">
            👨‍🏫 جلسة المعلم
          </button>
          <button class="btn-session-switch" id="btn-profiles" title="تبديل الطالب أو إضافة جلسة جديدة">
            👥 الجلسات <span class="badge-count">${profiles.length}</span>
          </button>
          <button class="btn-icon" id="btn-settings" title="الإعدادات">⚙️</button>
        </div>
      </header>

      <section class="stats">
        <div class="stat"><span class="stat-num">${s.points}</span><span class="stat-lbl">نقطة 💎</span></div>
        <div class="stat"><span class="stat-num">${s.stars}</span><span class="stat-lbl">نجمة ⭐</span></div>
        <div class="stat"><span class="stat-num">${s.bestStreak}</span><span class="stat-lbl">أطول سلسلة 🔥</span></div>
        <div class="stat"><span class="stat-num">${accuracy(s)}%</span><span class="stat-lbl">الدقة 🎯</span></div>
      </section>

      <div class="save-chip" title="كل جولة تُحفظ تلقائيًا في هذا الجهاز باسم الطالب الحالي">
        <span class="save-dot"></span>
        <b>💾 التقدم محفوظ تلقائيًا</b>
        ${room && room.code ? `<span class="save-room-pill" id="btn-room-chip">🏫 ${escapeHtml(room.title || "جلسة المعلم")} (${escapeHtml(room.code)})</span>` : ""}
        <span class="save-time">${savedAgo(s.updatedAt)}</span>
      </div>

      ${curLesson ? `
      <section class="continue-card" id="continue-card">
        <div class="continue-info">
          <span class="continue-tag">📍 متابعة تقدّم ${escapeHtml(name)} ${curGrade ? `· ${curGrade.title}` : ""}</span>
          <h3>${curLesson.icon} ${curLesson.title}</h3>
          <p>${curLesson.stage || curLesson.desc || ""}</p>
          <div class="prog-line"><div class="prog-fill" style="width:${curLessonSt.pct}%"></div></div>
          <small>الألعاب المكتملة: ${curLessonSt.doneGames}/${curLessonSt.totalGames} · ⭐ ${curLessonSt.stars}/${curLessonSt.max}</small>
        </div>
        <button class="btn btn-primary continue-btn" id="btn-continue">▶️ متابعة</button>
      </section>` : ""}

      <section class="news" id="news">
        <span class="news-icon" id="news-icon">💡</span>
        <span class="news-text" id="news-text">نصيحة اليوم: ابدأ الدرس بلعبة قصيرة لجذب انتباه الطفل</span>
        <span class="news-dots" id="news-dots"></span>
      </section>

      <h2 class="section-title rainbow">١) 🌈 مراحل الروضة وتقدّم الطالب</h2>
      <section class="grades" id="grades"></section>

      <h2 class="section-title">٢) 🎙️ مختبر النطق ومكافآت الطالب</h2>
      <section class="features-grid">
        <button class="feature-card" id="go-phonics" style="--fc:#ec4899">
          <span class="feature-icon">🎙️</span>
          <span class="feature-body">
            <h3>مخارج الحروف والحركات</h3>
            <p>٢٨ حرفًا بمخارجها الصحيحة مع الفتحة والضمة والكسرة والمدود</p>
          </span>
          <span class="lesson-arrow">‹</span>
        </button>
        <button class="feature-card" id="go-rewards" style="--fc:#f59e0b">
          <span class="feature-icon">🏅</span>
          <span class="feature-body">
            <h3>ملصقاتي وشهادتي (${unlockedStickers} مفتوح)</h3>
            <p>ملصقات الأبطال الناطقة وشهادة التقدير الخاصة بـ ${escapeHtml(name)}</p>
          </span>
          <span class="lesson-arrow">‹</span>
        </button>
      </section>

      <h2 class="section-title">٣) 📚 دروس المنهج العام</h2>
      <section class="lessons" id="lessons"></section>

      <footer class="footer">صُنع بحب للمعلمين والطلاب · كل طالب له جلسة وتقدّم محفوظ مستقل · يعمل بدون إنترنت</footer>`;

    root().appendChild(view);

    /* بطاقات الصفوف الثلاثة مع شريط التقدم */
    const gradesEl = view.querySelector("#grades");
    GRADES.forEach((g, idx) => {
      const gp = Store.gradeProgress(g);
      const card = el("button", "grade-card");
      card.style.setProperty("--gc", g.theme);
      card.innerHTML = `
        <span class="grade-emoji" style="background:${g.theme}">${g.icon}</span>
        <span class="grade-body">
          <div class="grade-head-row">
            <h3>${g.title} <small dir="ltr">${g.titleEn}</small></h3>
            <span class="grade-badge-pct">${gp.pct}%</span>
          </div>
          <p>${g.desc}</p>
          <div class="prog-line"><div class="prog-fill" style="width:${gp.pct}%;background:${g.theme}"></div></div>
          <div class="grade-meta-row">
            <span>📚 الدروس: <b>${gp.doneLessons}/${gp.totalLessons}</b></span>
            <span>⭐ النجوم: <b>${gp.stars}/${gp.max}</b></span>
          </div>
        </span>
        <span class="lesson-arrow">‹</span>`;
      card.onclick = () => { Sound.click(); go(`#/grade/${g.id}`); };
      gradesEl.appendChild(card);
    });

    /* دروس المنهج */
    const lessonsEl = view.querySelector("#lessons");
    LESSONS.forEach(l => lessonsEl.appendChild(lessonCard(l)));

    view.querySelector("#btn-settings").onclick = () => { Sound.click(); go("#/settings"); };
    view.querySelector("#btn-teacher-link").onclick = () => { Sound.click(); go("#/welcome/teacher"); };
    view.querySelector("#btn-profiles").onclick = () => { Sound.click(); go("#/profiles"); };
    view.querySelector("#btn-avatar").onclick = () => { Sound.click(); go("#/welcome"); };
    view.querySelector("#btn-session-pill").onclick = () => { Sound.click(); go("#/welcome"); };
    if (view.querySelector("#btn-room-chip")) {
      view.querySelector("#btn-room-chip").onclick = () => { Sound.click(); go("#/welcome/teacher"); };
    }
    if (curLesson && view.querySelector("#btn-continue")) {
      view.querySelector("#btn-continue").onclick = () => { Sound.click(); go(`#/lesson/${curLesson.id}`); };
    }
    view.querySelector("#go-phonics").onclick = () => { Sound.click(); go("#/phonics"); };
    view.querySelector("#go-rewards").onclick = () => { Sound.click(); go("#/rewards"); };

    startNews(view);
  }

  function accuracy(s) {
    const t = s.correct + s.wrong;
    return t ? Math.round((s.correct / t) * 100) : 0;
  }

  function lessonCard(l) {
    const st = Store.lessonStars(l.id);
    const statusText = st.completed
      ? "✅ مكتمل"
      : st.doneGames > 0
      ? `⏳ ${st.doneGames}/${st.totalGames} ألعاب`
      : "🆕 ابدأ";
    const statusCls = st.completed ? "done" : st.doneGames > 0 ? "doing" : "new";
    const card = el("button", "lesson-card");
    card.innerHTML = `
      <div class="lesson-icon">${l.icon}</div>
      <div class="lesson-body">
        <div class="lesson-top-row">
          <h3>${l.title}</h3>
          <span class="lesson-status ${statusCls}">${statusText}</span>
        </div>
        ${l.stage ? `<div class="lesson-card-stage">${l.stage}</div>` : ""}
        <p>${l.desc}</p>
        <div class="prog-line"><div class="prog-fill" style="width:${st.pct}%"></div></div>
        <div class="lesson-meta">
          <span class="stars-mini">${"⭐".repeat(Math.min(3, Math.ceil(st.pct / 34)))}${"☆".repeat(Math.max(0, 3 - Math.ceil(st.pct / 34)))}</span>
          <span>⭐ ${st.stars}/${st.max} (${st.pct}%)</span>
        </div>
      </div>
      <span class="lesson-arrow">‹</span>`;
    card.onclick = () => { Sound.click(); go(`#/lesson/${l.id}`); };
    return card;
  }

  function gradeStars(g) {
    return Store.gradeProgress(g);
  }

  /* ---------- الأخبار والنصائح (تتداول) ---------- */

  function startNews(view) {
    const iconEl = view.querySelector("#news-icon");
    const textEl = view.querySelector("#news-text");
    const dotsEl = view.querySelector("#news-dots");
    if (!textEl) return;

    clearInterval(newsTimer);
    let i = Math.floor(Math.random() * NEWS.length);

    dotsEl.innerHTML = NEWS.map((_, k) =>
      `<span class="news-dot${k === i ? " on" : ""}"></span>`).join("");

    const show = () => {
      const n = NEWS[i % NEWS.length];
      iconEl.textContent = n.icon;
      textEl.textContent = n.text;
      Array.from(dotsEl.children).forEach((d, k) => d.classList.toggle("on", k === i % NEWS.length));
      textEl.classList.remove("fade");
      void textEl.offsetWidth;   /* إعادة تشغيل الحركة */
      textEl.classList.add("fade");
      i++;
    };
    show();
    newsTimer = setInterval(show, 6500);
  }

  /* ---------- صفحة الصف (روضة) ---------- */

  function gradeMenu(id) {
    const g = findGrade(id);
    if (!g) return go("#/");
    const s = Store.get();
    const st = Store.gradeProgress(g);

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="back">→</button>
        <h2>${g.icon} ${g.title}</h2>
        <button class="btn-session-mini" id="grade-session" title="تبديل الطالب">${s.avatar || "🦁"} ${escapeHtml(s.player || "صديقي")}</button>
      </header>
      <div class="grade-banner" style="--gc:${g.theme}">
        <div class="grade-banner-info">
          <b>${g.title}</b> <small dir="ltr">${g.titleEn}</small>
          <p>${g.desc}</p>
          <div class="prog-line"><div class="prog-fill" style="width:${st.pct}%;background:${g.theme}"></div></div>
          <small class="grade-prog-lbl">تقدّم ${escapeHtml(s.player || "صديقي")}: ${st.doneLessons}/${st.totalLessons} دروس مكتملة (${st.pct}%)</small>
        </div>
        <div class="grade-score">⭐ ${st.stars}/${st.max}</div>
      </div>
      ${g.id === "kg1" ? `
      <button class="feature-card" id="grade-go-phonics" style="--fc:#ec4899;width:100%;margin-bottom:14px">
        <span class="feature-icon">🎙️</span>
        <span class="feature-body">
          <h3>استوديو مخارج الحروف والحركات (٢٨ حرفًا)</h3>
          <p>استمع لمخرج كل حرف ونطقه بالفتحة والضمة والكسرة والمدود</p>
        </span>
        <span class="lesson-arrow">‹</span>
      </button>` : ""}
      ${g.method ? `
      <section class="method-card" style="--gc:${g.theme}">
        <h3>🧭 ${g.id === "kg1" ? "خطة التأسيس — الأذن قبل القلم" : "خطة التقدّم في هذا الصف"}</h3>
        <p class="method-note">ست مراحل متتابعة · لا تنتقل إلى ما بعدها قبل ظهور علامة الإتقان</p>
        <ol class="method-list">
          ${g.method.map(m => `
            <li>
              <span class="method-n">${m.n}</span>
              <span class="method-body">
                <b>${m.t}</b>
                <em>${m.d}</em>
                ${m.sign ? `<small>✅ ${m.sign}</small>` : ""}
              </span>
            </li>`).join("")}
        </ol>
      </section>` : ""}
      <section class="lessons" id="grade-lessons"></section>`;

    root().appendChild(view);
    view.querySelector("#back").onclick = () => { Sound.click(); go("#/"); };
    view.querySelector("#grade-session").onclick = () => { Sound.click(); go("#/profiles"); };
    if (view.querySelector("#grade-go-phonics")) {
      view.querySelector("#grade-go-phonics").onclick = () => { Sound.click(); go("#/phonics"); };
    }

    const box = view.querySelector("#grade-lessons");
    const tracksByGrade = {
      kg1: {
        ids: ["kg1-sound", "kg1-letters", "kg1-diff"],
        t1: "🧱 القسم الأوّل: مسار التأسيس الصوتي والحسي (المراحل ١–٥)",
        t2: "🎨 القسم الثاني: مسار التطبيقات والمفردات اليومية"
      },
      kg2: {
        ids: ["kg2-harakat", "kg2-madd", "kg2-words"],
        t1: "🧱 القسم الأوّل: مسار الحركات والمدود والكلمات (المراحل ١–٣)",
        t2: "🎨 القسم الثاني: مسار التطبيقات والمفردات ثنائية اللغة"
      },
      kg3: {
        ids: ["kg3-reading", "kg3-sentences", "kg3-math"],
        t1: "🧱 القسم الأوّل: مسار القراءة والجمل والحساب (المراحل ١–٣)",
        t2: "🌍 القسم الثاني: مسار البيئة والزمن والتهيئة العامة"
      }
    };
    const cfg = tracksByGrade[g.id];
    if (cfg) {
      const foundation = g.lessons.filter(l => cfg.ids.includes(l.id));
      const applied = g.lessons.filter(l => !cfg.ids.includes(l.id));
      box.appendChild(el("h3", "track-title", cfg.t1));
      foundation.forEach(l => box.appendChild(lessonCard(l)));
      box.appendChild(el("h3", "track-title", cfg.t2));
      applied.forEach(l => box.appendChild(lessonCard(l)));
    } else {
      g.lessons.forEach(l => box.appendChild(lessonCard(l)));
    }
  }

  /* ---------- قائمة الألعاب للدرس ---------- */

  function lessonMenu(id) {
    const l = findLesson(id);
    if (!l) return go("#/");
    Store.setLastLesson(l.id);
    const s = Store.get();
    const st = Store.lessonStars(l.id);
    const parentGrade = findParentGrade(l.id);

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="back">→</button>
        <h2>${l.icon} ${l.title}</h2>
        <button class="btn-session-mini" id="lesson-session" title="تبديل الطالب">${s.avatar || "🦁"} ${escapeHtml(s.player || "صديقي")}</button>
      </header>
      ${l.stage ? `<div class="lesson-stage">🧭 ${l.stage}</div>` : ""}
      ${l.desc ? `<p class="lesson-desc">${l.desc}</p>` : ""}
      <div class="lesson-progress-box">
        <div class="lesson-progress-row">
          <span>📊 تقدّم <b>${escapeHtml(s.player || "صديقي")}</b> في الدرس: ${st.doneGames}/${st.totalGames} ألعاب</span>
          <b>⭐ ${st.stars}/${st.max} (${st.pct}%)</b>
        </div>
        <div class="prog-line"><div class="prog-fill" style="width:${st.pct}%"></div></div>
      </div>
      ${l.steps ? `<div class="lesson-steps"><b>👣 خطوات التدريس:</b><ol>${l.steps.map(x => `<li>${x}</li>`).join("")}</ol></div>` : ""}
      ${l.tip ? `<div class="lesson-tip">💡 <b>نصيحة للمعلم:</b> ${l.tip}</div>` : ""}
      ${l.credit ? `<p class="lesson-credit">${l.credit}</p>` : ""}

      ${(l.pairs && l.pairs.length) ? `
      <section class="flashcards-box">
        <div class="flashcards-head">
          <h3>📖 ١) تعلّم واستمع أولًا (اضغط على البطاقة لسماع نطقها)</h3>
        </div>
        <div class="flashcards-grid" id="flashcards"></div>
      </section>` : ""}

      <h3 class="section-title">🎮 ٢) طبّق وتدرّب بالألعاب التفاعلية</h3>
      <section class="games" id="games"></section>`;

    root().appendChild(view);
    view.querySelector("#back").onclick = () => {
      Sound.click();
      go(parentGrade ? `#/grade/${parentGrade.id}` : "#/");
    };
    view.querySelector("#lesson-session").onclick = () => { Sound.click(); go("#/profiles"); };

    /* بطاقات التعلّم الناطقة قبل اللعب */
    const fcBox = view.querySelector("#flashcards");
    if (fcBox && l.pairs) {
      l.pairs.forEach(p => {
        const fc = el("button", "flashcard");
        fc.innerHTML = `
          <span class="fc-speaker">🔊</span>
          <strong class="fc-term">${p.term}</strong>
          <span class="fc-def">${p.def}</span>`;
        fc.onclick = () => {
          fcBox.querySelectorAll(".flashcard").forEach(x => x.classList.remove("active"));
          fc.classList.add("active", "pop");
          setTimeout(() => fc.classList.remove("pop"), 350);
          Sound.speakPair(p.term, p.def);
        };
        fcBox.appendChild(fc);
      });
    }

    /* تعرض الألعاب التي يملك الدرس بياناتها فقط */
    GAMES.filter(g => !GAME_HAS[g.id] || GAME_HAS[g.id](l)).forEach(g => {
      const cell = (Store.get().lessons[l.id] || {})[g.id];
      const bestStars = cell ? Math.max(0, Math.min(3, cell.stars || 0)) : 0;
      const card = el("button", "game-card");
      card.style.setProperty("--gc", g.color);
      card.innerHTML = `
        <div class="game-icon">${g.icon}</div>
        <div class="game-body">
          <h3>${g.name}</h3>
          <p>${g.desc}</p>
          <div class="game-meta">
            ${cell && cell.plays > 0
              ? `<span>✅ أفضل نتيجة: 🏆 ${cell.best} نقطة</span><span>${"⭐".repeat(bestStars)}${"☆".repeat(3 - bestStars)}</span>`
              : "<span>🆕 ابدأ أول محاولة</span>"}
          </div>
        </div>
        <span class="lesson-arrow">‹</span>`;
      card.onclick = () => { Sound.click(); go(`#/play/${l.id}/${g.id}`); };
      view.querySelector("#games").appendChild(card);
    });
  }

  function play(lessonId, gameId) {
    const l = findLesson(lessonId);
    const g = GAMES.find(x => x.id === gameId);
    if (!l || !g) return go("#/");

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="exit" title="خروج">✕</button>
        <h2>${g.icon} ${g.name}</h2>
        <button class="btn-icon" id="sound" title="الصوت">${Sound.enabled ? "🔊" : "🔇"}</button>
      </header>
      <div id="game-root" class="game-root"></div>`;
    root().appendChild(view);

    view.querySelector("#exit").onclick = () => { Sound.click(); go(`#/lesson/${l.id}`); };
    view.querySelector("#sound").onclick = e => {
      const on = Sound.toggle();
      e.currentTarget.textContent = on ? "🔊" : "🔇";
    };

    const gr = view.querySelector("#game-root");

    function start() {
      const fn = {
        listen: Games.listen,
        trace: Games.trace,
        build: Games.build,
        match: Games.match,
        quiz: Games.quiz,
        tf: Games.tf
      }[gameId];
      if (!fn) return go(`#/lesson/${l.id}`);
      fn(gr, l, result => {
        if (result === null) return start();            // إعادة المحاولة
        if (result.exit) return go(`#/lesson/${l.id}`);  // رجوع للقائمة
        Store.record({
          lessonId, gameId,
          score: result.score, stars: result.stars,
          correct: result.correct, wrong: result.wrong
        });
        // عرض أزرار بعد الحفظ
        const box = gr.querySelector(".result-box");
        if (box && !box.querySelector(".btn-next")) {
          const b = el("button", "btn btn-primary btn-next", "التالي ←");
          b.onclick = () => { Sound.click(); go(`#/lesson/${l.id}`); };
          box.querySelector(".result-actions").appendChild(b);
        }
      });
    }
    start();
  }

  function settings() {
    const s = Store.get();
    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="back">→</button>
        <h2>⚙️ الإعدادات</h2>
        <span></span>
      </header>
      <div class="settings">
        <label class="field">
          <span>👤 اسم الطالب (كل اسم جديد له جلسة وتقدّم مستقل)</span>
          <input id="pname" maxlength="30" placeholder="اكتب اسم الطالب هنا" value="${escapeHtml(s.player)}" />
          <small class="field-hint">الجلسة الحالية: <b>${s.avatar || "🦁"} ${escapeHtml(s.player || "صديقي")}</b> (${s.stars} ⭐ · ${s.points} نقطة)</small>
        </label>

        <button class="btn btn-ghost" id="openProfiles">👥 إدارة وتبديل جلسات الطلاب (${Store.listProfiles().length})</button>
        <button class="btn btn-ghost" id="openTeacher">👨‍🏫 لوحة المعلم ومتابعة جميع الطلاب (Excel)</button>

        <label class="field row">
          <span>🔊 المؤثرات الصوتية</span>
          <input type="checkbox" id="psound" ${Sound.enabled ? "checked" : ""} />
        </label>

        <label class="field row">
          <span>🗣️ النطق التلقائي للأسئلة</span>
          <input type="checkbox" id="ptts" ${localStorage.getItem("abaaqira_tts") !== "0" ? "checked" : ""} />
        </label>

        <label class="field">
          <span>👩 الصوت (مدمج ويعمل بدون إنترنت)</span>
          <select id="pvoice">
            <option value="female" ${localStorage.getItem("abaaqira_voice") !== "male" ? "selected" : ""}>👩 صوت شابة أنثوي — زارية (طبيعي مدمج)</option>
            <option value="male" ${localStorage.getItem("abaaqira_voice") === "male" ? "selected" : ""}>👨 صوت ذكوري — حامد</option>
          </select>
          <small class="field-hint">الصوت النشط حاليًا: <b id="voiceNow"></b></small>
        </label>

        <div class="field row">
          <span>🔊 تجربة الصوت الآن</span>
          <button class="btn btn-ghost" id="testVoice">▶️ استمع للصوت</button>
        </div>

        <div class="voice-help">
          <b>✅ تم دمج صوت شابة طبيعي بالكامل:</b>
          <p>يعمل التطبيق الآن بصوت <b>زارية (شابة عربية)</b> و<b>آنا (شابة إنجليزية)</b> عبر ملفات صوتية عصبية محفوظة داخل التطبيق (٥٨٥ مقطعًا صوتيًا) — بدون الحاجة لإعدادات ويندوز وبدون إنترنت.</p>
        </div>

        <button class="btn btn-primary" id="save">💾 حفظ</button>
        <div class="backup-box">
          <b>💾 نسخة احتياطية من تقدم الطالب</b>
          <p>احفظ نسخة من كل الجلسات على جهازك، أو استعدها على جهاز آخر ليكمل الطالب من حيث توقف.</p>
          <div class="backup-actions">
            <button class="btn btn-ghost" id="backup">⬇️ تنزيل نسخة احتياطية</button>
            <label class="btn btn-ghost" style="cursor:pointer">
              ⬆️ استعادة من نسخة
              <input type="file" id="restoreFile" accept=".json,application/json" style="display:none" />
            </label>
          </div>
        </div>
        <button class="btn btn-danger" id="reset">🗑️ تصفير كل النقاط والنتائج</button>
        <button class="btn btn-ghost" id="install">📥 تثبيت التطبيق</button>
        <a class="btn btn-ghost" href="../abaaqira.html">← صفحة المنصة على VAQENO</a>
      </div>`;

    root().appendChild(view);
    view.querySelector("#back").onclick = () => { Sound.click(); go("#/"); };
    view.querySelector("#openProfiles").onclick = () => { Sound.click(); go("#/profiles"); };
    view.querySelector("#openTeacher").onclick = () => { Sound.click(); go("#/teacher"); };

    /* مسح أي تخصيص سابق لصوت النظام الذكوري (Naayf) ليعمل صوت الشابة المدمج */
    Sound.setVoiceName("");

    const pvoiceEl = view.querySelector("#pvoice");
    const now = view.querySelector("#voiceNow");
    const syncVoice = () => {
      localStorage.setItem("abaaqira_voice", pvoiceEl.value);
      Sound.setVoiceName("");
      if (now) now.textContent = Sound.voiceName || "—";
    };
    if (now) now.textContent = Sound.voiceName || "—";
    pvoiceEl.onchange = () => {
      syncVoice();
      Sound.speak("مرحبًا! أنا صوت عباقرة. ١ ٢ ٣. أسد بطة تفاحة.");
    };

    view.querySelector("#testVoice").onclick = () => {
      syncVoice();
      const phrase = "مرحبًا! أنا صوت عباقرة. ١ ٢ ٣. أسد بطة تفاحة.";
      Sound.speak(phrase);
      toast("🔊 جارٍ النطق...");
    };

    view.querySelector("#save").onclick = () => {
      Store.setPlayer(view.querySelector("#pname").value);
      localStorage.setItem("abaaqira_sound", view.querySelector("#psound").checked ? "1" : "0");
      localStorage.setItem("abaaqira_tts", view.querySelector("#ptts").checked ? "1" : "0");
      syncVoice();
      Sound.click();
      toast("✅ تم الحفظ");
      go("#/");
    };

    view.querySelector("#reset").onclick = () => {
      if (confirm("هل تريد تصفير كل النقاط والنتائج نهائيًا؟")) {
        Store.resetAll();
        Sound.click();
        toast("🗑️ تم التصفير");
        go("#/");
      }
    };

    view.querySelector("#backup").onclick = () => {
      try {
        const blob = new Blob([Store.exportJSON()], { type: "application/json;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "تقدمي-عباقرة.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        Sound.click();
        toast("💾 تم تنزيل نسخة احتياطية من تقدمك");
      } catch {
        toast("⚠️ تعذّر إنشاء النسخة الاحتياطية");
      }
    };

    view.querySelector("#restoreFile").onchange = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const count = Store.importJSON(String(reader.result));
          Sound.click();
          toast(`✅ تم استعادة ${count} جلسة بنجاح`);
          go("#/");
        } catch {
          toast("⚠️ الملف غير صالح — اختر نسخة JSON من عباقرة");
        }
      };
      reader.readAsText(file);
    };

    const ib = view.querySelector("#install");
    ib.onclick = () => {
      if (window.__deferredPrompt) {
        window.__deferredPrompt.prompt();
        window.__deferredPrompt = null;
      } else {
        toast("📱 افتح قائمة المتصفح واختر «إضافة إلى الشاشة الرئيسية»");
      }
    };
  }

  /* ---------- استوديو مخارج الحروف والحركات (٢٨ حرفًا) ---------- */
  function phonicsStudio() {
    const list = typeof PHONICS_LETTERS !== "undefined" ? PHONICS_LETTERS : [];
    if (!list.length) return go("#/");
    let activeIdx = 0;

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="back">→</button>
        <h2>🎙️ مخارج الحروف والحركات</h2>
        <span></span>
      </header>
      <p class="lesson-desc">اضغط على أي حرف لسماع مخرجه الصحيح ونطقه بالفتحة والضمة والكسرة والمدود</p>
      <section id="phonics-stage" class="phonics-stage"></section>
      <h3 class="section-title">🔤 جميع الحروف العربية (٢٨ حرفًا)</h3>
      <section id="phonics-grid" class="phonics-grid"></section>`;
    root().appendChild(view);

    view.querySelector("#back").onclick = () => { Sound.click(); go("#/"); };

    const stage = view.querySelector("#phonics-stage");
    const grid = view.querySelector("#phonics-grid");

    function renderStage(speakNow) {
      const p = list[activeIdx];
      stage.innerHTML = `
        <div class="phonics-hero">
          <div class="phonics-art">${Art.get(p.art)}</div>
          <div class="phonics-main">
            <div class="phonics-badge">حَرفُ ${p.name}</div>
            <div class="phonics-big-row">
              <span class="phonics-big-letter">${p.letter}</span>
              <span class="phonics-example">${p.word}</span>
            </div>
            <button class="btn btn-primary phonics-listen-main" id="ph-say-main">🔊 اسمع الحرف والكلمة</button>
          </div>
        </div>

        <div class="phonics-makhraj" id="ph-makhraj">
          <div class="phonics-makhraj-head">
            <b>👄 مخرج الحرف (كيف أنطقه صح؟)</b>
            <button class="btn-speaker" id="ph-say-makhraj" title="اسمع مخرج الحرف">🔊</button>
          </div>
          <p>${p.makhraj}</p>
        </div>

        <div class="phonics-harakat-title">🎵 اضغط على الحركة لسماع صوت الحرف بها:</div>
        <div class="phonics-harakat">
          ${p.harakat.map((h, i) => `
            <button class="harakah-btn" data-hi="${i}">
              <span class="harakah-tag">${h.title}</span>
              <strong class="harakah-lbl">${h.label}</strong>
              <span class="harakah-word">${h.word}</span>
            </button>`).join("")}
        </div>`;

      stage.querySelector("#ph-say-main").onclick = () => {
        Sound.click();
        Sound.speak(`حَرفُ ${p.name}، ${p.word}`);
      };
      stage.querySelector("#ph-say-makhraj").onclick = () => {
        Sound.click();
        Sound.speak(p.makhraj);
      };
      stage.querySelectorAll(".harakah-btn").forEach(btn => {
        btn.onclick = () => {
          const h = p.harakat[+btn.dataset.hi];
          stage.querySelectorAll(".harakah-btn").forEach(x => x.classList.remove("active"));
          btn.classList.add("active", "pop");
          setTimeout(() => btn.classList.remove("pop"), 350);
          Sound.speak(h.say);
        };
      });

      Array.from(grid.children).forEach((c, idx) => c.classList.toggle("active", idx === activeIdx));

      if (speakNow) {
        Sound.speak(`حَرفُ ${p.name}، ${p.word}`);
      }
    }

    list.forEach((p, idx) => {
      const btn = el("button", "phonics-cell" + (idx === 0 ? " active" : ""));
      btn.innerHTML = `
        <span class="phonics-cell-letter">${p.letter}</span>
        <span class="phonics-cell-word">${p.word}</span>`;
      btn.onclick = () => {
        activeIdx = idx;
        renderStage(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      grid.appendChild(btn);
    });

    renderStage(true);
  }

  /* ---------- ملصقاتي وشهادتي ---------- */
  function rewardsPage() {
    const s = Store.get();
    const name = s.player || "العبقري الصغير";
    const stickers = typeof REWARD_STICKERS !== "undefined" ? REWARD_STICKERS : [];
    const unlockedCount = stickers.filter(st => s.stars >= st.need).length;
    const rank = s.stars >= 45 ? "تاج العباقرة 🏆" : s.stars >= 20 ? "قارئ متميّز 🌟" : "بطل التأسيس 🦁";

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="back">→</button>
        <h2>🏅 ملصقاتي وشهادتي</h2>
        <span></span>
      </header>

      <section class="certificate-card" id="certificate">
        <div class="cert-ribbon">🎓 شهادة فخر وتقدير</div>
        <p class="cert-sub">تُمنح هذه الشهادة للبطل المتميّز</p>
        <h3 class="cert-name">${escapeHtml(name)}</h3>
        <div class="cert-rank">${rank}</div>
        <p class="cert-body">لاجتهاده الرائع في تعلّم الحروف العربية ومخارجها والكلمات في منصة <b>عباقرة</b></p>
        <div class="cert-stats">
          <div><b>${s.stars} ⭐</b><span>مجموع النجوم</span></div>
          <div><b>${s.points} 💎</b><span>مجموع النقاط</span></div>
          <div><b>${unlockedCount}/${stickers.length} 🏅</b><span>الملصقات</span></div>
        </div>
        <div class="cert-actions">
          <button class="btn btn-primary" id="cert-speak">🔊 اسمع التهنئة</button>
          <button class="btn btn-ghost" id="cert-print">🖨️ طباعة الشهادة</button>
        </div>
      </section>

      <h3 class="section-title">🌟 ألبوم الملصقات الناطقة (${unlockedCount} من ${stickers.length})</h3>
      <p class="lesson-desc">اضغط على أي ملصق مفتوح لسماع تشجيع البطل بصوت الشابة!</p>
      <section class="stickers-grid" id="stickers-grid"></section>`;
    root().appendChild(view);

    view.querySelector("#back").onclick = () => { Sound.click(); go("#/"); };
    view.querySelector("#cert-speak").onclick = () => {
      Sound.win();
      Sound.speak(typeof CERTIFICATE_PRAISE !== "undefined" ? CERTIFICATE_PRAISE : "مبارك لك يا بطل عباقرة!");
    };
    view.querySelector("#cert-print").onclick = () => {
      Sound.click();
      window.print();
    };

    const grid = view.querySelector("#stickers-grid");
    stickers.forEach(st => {
      const open = s.stars >= st.need;
      const card = el("button", "sticker-card" + (open ? " unlocked" : " locked"));
      card.innerHTML = `
        <div class="sticker-art">${Art.get(st.art)}</div>
        <div class="sticker-title">${st.title}</div>
        <div class="sticker-badge">${open ? "🔊 اضغط للاستماع" : `🔒 تحتاج ${st.need} ⭐`}</div>`;
      card.onclick = () => {
        if (open) {
          card.classList.add("pop");
          setTimeout(() => card.classList.remove("pop"), 350);
          Sound.star();
          Sound.speak(st.say);
        } else {
          Sound.click();
          toast(`⭐ اجمع ${st.need - s.stars} نجمة إضافية لفتح هذا الملصق!`);
        }
      };
      grid.appendChild(card);
    });
  }

  /* ---------- صفحة جلسات الطلاب (كل اسم له جلسة وتقدّم مستقل) ---------- */
  function profilesPage() {
    const cur = Store.get();
    const list = Store.listProfiles();
    const avatars = Store.AVATARS || ["🦁", "🦋", "🚀", "🧸", "🌟", "👑", "🐰", "🐬", "🍓", "🦊"];
    let pickedAvatar = avatars[list.length % avatars.length];

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="back">→</button>
        <h2>👥 جلسات الطلاب وحفظ التقدّم</h2>
        <button class="btn-session-mini" id="go-teacher-top" title="لوحة المعلم">👨‍🏫 لوحة المعلم</button>
      </header>

      <button class="feature-card" id="go-teacher-banner" style="--fc:#0ea5e9;width:100%;margin-bottom:14px">
        <span class="feature-icon">👨‍🏫</span>
        <span class="feature-body">
          <h3>إنشاء جلسة للمعلم وإرسال الرابط للطلاب + لوحة المعلم (Excel)</h3>
          <p>أنشئ رابط دعوة وأرسله للطلاب عبر واتساب، وتابع درجاتهم ونجومهم مباشرة مع تصدير Excel</p>
        </span>
        <span class="lesson-arrow">‹</span>
      </button>

      <section class="profile-create-card">
        <h3>➕ فتح جلسة طالب جديدة (أو التبديل بالاسم)</h3>
        <p class="method-note">كل اسم يحفظ نقاطه ونجومه ودروسه وملصقاته وشهادته في جلسة مستقلة تمامًا</p>
        <div class="avatar-picker" id="avatar-picker">
          ${avatars.map(a => `<button type="button" class="avatar-choice${a === pickedAvatar ? " sel" : ""}" data-av="${a}">${a}</button>`).join("")}
        </div>
        <div class="profile-input-row">
          <input id="new-profile-name" maxlength="30" placeholder="اكتب اسم الطالب (مثال: سارة، عمر، ريم...)" />
          <button class="btn btn-primary" id="btn-add-profile">🚀 دخول الجلسة</button>
        </div>
      </section>

      <h3 class="section-title">🏆 الجلسات المحفوظة على هذا الجهاز (${list.length})</h3>
      <section class="profiles-list" id="profiles-list"></section>`;
    root().appendChild(view);

    view.querySelector("#back").onclick = () => { Sound.click(); go("#/"); };
    view.querySelector("#go-teacher-top").onclick = () => { Sound.click(); go("#/teacher"); };
    view.querySelector("#go-teacher-banner").onclick = () => { Sound.click(); go("#/teacher"); };

    view.querySelectorAll(".avatar-choice").forEach(b => {
      b.onclick = () => {
        Sound.click();
        pickedAvatar = b.dataset.av;
        view.querySelectorAll(".avatar-choice").forEach(x => x.classList.toggle("sel", x === b));
      };
    });

    const nameInput = view.querySelector("#new-profile-name");
    const submitNew = () => {
      const name = (nameInput.value || "").trim();
      if (!name) {
        toast("✍️ اكتب اسم الطالب أولًا");
        nameInput.focus();
        return;
      }
      Store.setPlayer(name, pickedAvatar);
      Sound.star();
      toast(`✅ تم تفعيل جلسة: ${name}`);
      go("#/");
    };
    view.querySelector("#btn-add-profile").onclick = submitNew;
    nameInput.onkeydown = e => { if (e.key === "Enter") submitNew(); };

    const listEl = view.querySelector("#profiles-list");
    list.forEach((p, rankIdx) => {
      const lastL = p.lastLessonId ? findLesson(p.lastLessonId) : null;
      const card = el("div", "profile-card" + (p.isActive ? " active" : ""));
      card.innerHTML = `
        <div class="profile-avatar">${p.avatar || "🦁"}</div>
        <div class="profile-body">
          <div class="profile-head-row">
            <h4>${escapeHtml(p.player || "صديقي")}</h4>
            ${p.isActive ? `<span class="profile-active-badge">🟢 الجلسة النشطة</span>` : `<span class="profile-rank-badge">#${rankIdx + 1}</span>`}
          </div>
          <div class="profile-stats-row">
            <span>⭐ <b>${p.stars}</b> نجمة</span>
            <span>💎 <b>${p.points}</b> نقطة</span>
            <span>📚 <b>${p.lessonsPlayed}</b> دروس</span>
            <span>🎯 <b>${p.accuracy}%</b> دقة</span>
          </div>
          ${lastL ? `<small class="profile-last">📍 آخر درس: ${lastL.icon} ${lastL.title}</small>` : `<small class="profile-last">🆕 جلسة جاهزة للبدء</small>`}
        </div>
        <div class="profile-actions">
          ${p.isActive
            ? `<button class="btn btn-primary btn-sm profile-enter">▶️ متابعة</button>`
            : `<button class="btn btn-ghost btn-sm profile-enter">✅ تفعيل</button>`}
          ${list.length > 1 ? `<button class="btn btn-danger btn-sm profile-del" title="حذف الجلسة">🗑️</button>` : ""}
        </div>`;

      card.querySelector(".profile-enter").onclick = () => {
        Sound.click();
        Store.switchProfile(p.id);
        toast(`👋 مرحبًا ${p.player}!`);
        go("#/");
      };
      const delBtn = card.querySelector(".profile-del");
      if (delBtn) {
        delBtn.onclick = () => {
          if (confirm(`هل تريد حذف جلسة «${p.player}» ونتائجها؟`)) {
            Sound.click();
            Store.deleteProfile(p.id);
            route();
          }
        };
      }
      listEl.appendChild(card);
    });
  }

  /* ---------- لوحة المعلم ومتابعة جميع الطلاب (تزامن سحابي + تصدير Excel) ---------- */
  function teacherPage() {
    let curRoom = Store.getRoom();
    if (!curRoom || !curRoom.code) {
      curRoom = Store.createTeacherRoom("فصل عباقرة");
    }

    const view = el("div", "view fade-in");
    view.innerHTML = `
      <header class="topbar">
        <button class="btn-icon" id="back">→</button>
        <h2>👨‍🏫 لوحة المعلم ومتابعة الطلاب</h2>
        <button class="btn-session-mini" id="btn-sync-now">🔄 مزامنة</button>
      </header>

      <section class="teacher-room-card">
        <div class="tr-head">
          <div>
            <h3>🔗 جلسة المعلم وإرسال الرابط للطلاب</h3>
            <p>أرسل هذا الرابط للطلاب عبر واتساب أو انسخه؛ أول ما يفتحه الطالب يطلب اسمه وتصل درجاته ونجومه إلى هذه اللوحة تلقائيًا.</p>
          </div>
          <div class="tr-code-box">
            <span>رمز الجلسة</span>
            <code id="t-room-code">${escapeHtml(curRoom.code)}</code>
          </div>
        </div>

        <div class="tr-title-row">
          <input id="t-room-title" maxlength="45" value="${escapeHtml(curRoom.title || "فصل عباقرة")}" placeholder="اسم المعلم أو الفصل (مثال: أ. أحمد — روضة أول)" />
          <button type="button" class="btn btn-ghost btn-sm" id="t-btn-save-title">✏️ حفظ الاسم</button>
          <button type="button" class="btn btn-ghost btn-sm" id="t-btn-new-code" title="توليد رمز جلسة جديد">🔄 رمز جديد</button>
        </div>

        <div class="invite-url-row">
          <input id="t-room-url" dir="ltr" readonly value="${escapeHtml(Store.getStudentInviteUrl(curRoom))}" />
          <button type="button" class="btn btn-primary btn-sm" id="t-btn-copy">📋 نسخ رابط الطلاب</button>
        </div>

        <div class="teacher-share-buttons">
          <button type="button" class="btn btn-primary btn-sm" id="t-btn-copy-2">📋 نسخ رابط الطلاب</button>
          <a class="btn btn-wa btn-sm" id="t-btn-wa" href="${escapeHtml(Store.getStudentWhatsAppUrl(curRoom))}" target="_blank" rel="noopener">💬 إرسال الرابط للطلاب (واتساب)</a>
          <button type="button" class="btn btn-ghost btn-sm" id="t-btn-share">📤 مشاركة الرابط</button>
        </div>
      </section>

      <div class="teacher-status-bar" id="teacher-status">
        <span>⏳ جارٍ جلب ومزامنة درجات الطلاب...</span>
      </div>

      <section class="stats" id="teacher-summary">
        <div class="stat"><span class="stat-num" id="ts-count">0</span><span class="stat-lbl">إجمالي الطلاب 👥</span></div>
        <div class="stat"><span class="stat-num" id="ts-stars">0</span><span class="stat-lbl">مجموع النجوم ⭐</span></div>
        <div class="stat"><span class="stat-num" id="ts-plays">0</span><span class="stat-lbl">جولات ملعوبة 🎮</span></div>
        <div class="stat"><span class="stat-num" id="ts-acc">0%</span><span class="stat-lbl">متوسط الدقة 🎯</span></div>
      </section>

      <section class="teacher-toolbar">
        <input id="teacher-search" class="teacher-search" placeholder="🔍 ابحث باسم الطالب أو الدرس..." />
        <div class="teacher-actions">
          <button class="btn btn-primary btn-sm" id="btn-export-csv">📥 تحميل الدرجات (Excel)</button>
          <button class="btn btn-ghost btn-sm" id="btn-export-json">📤 حفظ نسخة احتياطية</button>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer">
            📂 استيراد نسخة
            <input type="file" id="inp-import-json" accept=".json" style="display:none" />
          </label>
        </div>
      </section>

      <section class="profiles-list" id="teacher-list"></section>`;
    root().appendChild(view);

    view.querySelector("#back").onclick = () => { Sound.click(); go("#/profiles"); };

    let allStudents = [];

    function renderStudents(filterText = "") {
      const q = (filterText || "").trim().toLowerCase();
      const listEl = view.querySelector("#teacher-list");
      listEl.innerHTML = "";

      const filtered = allStudents.filter(p => {
        if (!q) return true;
        const name = (p.player || "").toLowerCase();
        const lastL = p.lastLessonId ? findLesson(p.lastLessonId) : null;
        const lTitle = lastL ? (lastL.title || "").toLowerCase() : "";
        return name.includes(q) || lTitle.includes(q);
      });

      if (!filtered.length) {
        listEl.innerHTML = `<div class="lesson-tip" style="text-align:center">لا يوجد طلاب مطابقون للبحث حاليًا.</div>`;
        return;
      }

      filtered.forEach((p, idx) => {
        const lastL = p.lastLessonId ? findLesson(p.lastLessonId) : null;
        const medal = idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`;
        const card = el("div", "profile-card");
        card.innerHTML = `
          <div class="profile-avatar">${p.avatar || "🦁"}</div>
          <div class="profile-body">
            <div class="profile-head-row">
              <h4>${escapeHtml(p.player || "طالب")}</h4>
              <span class="profile-rank-badge">${medal}</span>
            </div>
            <div class="profile-stats-row">
              <span>⭐ <b>${p.stars || 0}</b> نجمة</span>
              <span>💎 <b>${p.points || 0}</b> نقطة</span>
              <span>📚 <b>${p.lessonsPlayed || 0}</b> دروس</span>
              <span>🎮 <b>${p.played || 0}</b> جولات</span>
              <span>🎯 <b>${p.accuracy || 0}%</b> دقة</span>
            </div>
            <small class="profile-last">${lastL ? `📍 آخر درس: ${lastL.icon} ${lastL.title}` : "🆕 لم يبدأ درسًا بعد"}</small>
          </div>
          <div class="profile-actions">
            <button class="btn btn-ghost btn-sm t-open" title="فتح جلسة الطالب">👁️ فتح</button>
            <button class="btn btn-danger btn-sm t-del" title="حذف الطالب">🗑️</button>
          </div>`;

        card.querySelector(".t-open").onclick = () => {
          Sound.click();
          Store.setPlayer(p.player, p.avatar);
          toast(`👋 تم فتح جلسة: ${p.player}`);
          go("#/");
        };
        card.querySelector(".t-del").onclick = async () => {
          if (confirm(`هل تريد حذف سجل الطالب «${p.player}»؟`)) {
            Sound.click();
            await Store.deleteStudentEverywhere(p.player);
            loadAll();
          }
        };
        listEl.appendChild(card);
      });
    }

    function refreshTeacherRoomUI() {
      curRoom = Store.getRoom() || curRoom;
      view.querySelector("#t-room-code").textContent = curRoom.code;
      view.querySelector("#t-room-url").value = Store.getStudentInviteUrl(curRoom);
      view.querySelector("#t-btn-wa").href = Store.getStudentWhatsAppUrl(curRoom);
    }

    function startLiveRoomListener() {
      if (liveUnsub) {
        liveUnsub();
        liveUnsub = null;
      }
      liveUnsub = Store.subscribeRoomLive(prof => {
        loadAll();
        if (prof && prof.player) {
          toast(`🎉 تحديث مباشر من الطالب: ${prof.player}`);
        }
      });
    }

    view.querySelector("#t-btn-save-title").onclick = () => {
      Sound.click();
      const title = (view.querySelector("#t-room-title").value || "").trim() || "فصل عباقرة";
      curRoom = Store.createTeacherRoom(title, curRoom.code);
      refreshTeacherRoomUI();
      toast("✅ تم تحديث اسم الجلسة ورابط الطلاب");
    };

    view.querySelector("#t-btn-new-code").onclick = () => {
      Sound.click();
      const title = (view.querySelector("#t-room-title").value || "").trim() || "فصل عباقرة";
      const reg = Store.regenerateTeacherRoom(title);
      curRoom = Store.createTeacherRoom(reg.title, reg.code);
      refreshTeacherRoomUI();
      startLiveRoomListener();
      loadAll();
      toast(`🔄 تم توليد رمز جلسة جديد: ${curRoom.code}`);
    };

    const copyTeacherLink = () => {
      Sound.click();
      const title = (view.querySelector("#t-room-title").value || "").trim() || curRoom.title || "فصل عباقرة";
      curRoom = Store.createTeacherRoom(title, curRoom.code);
      refreshTeacherRoomUI();
      copyText(Store.getStudentInviteUrl(curRoom), "✅ تم نسخ رابط الطلاب — أرسله لطلابك الآن");
    };
    view.querySelector("#t-btn-copy").onclick = copyTeacherLink;
    view.querySelector("#t-btn-copy-2").onclick = copyTeacherLink;

    view.querySelector("#t-btn-share").onclick = async () => {
      Sound.click();
      const title = (view.querySelector("#t-room-title").value || "").trim() || curRoom.title || "فصل عباقرة";
      curRoom = Store.createTeacherRoom(title, curRoom.code);
      refreshTeacherRoomUI();
      const url = Store.getStudentInviteUrl(curRoom);
      if (navigator.share) {
        try {
          await navigator.share({
            title: `منصة عباقرة — ${curRoom.title}`,
            text: `افتح الرابط واكتب اسمك للانضمام إلى جلسة (${curRoom.title}) في منصة عباقرة التعليمية:`,
            url
          });
          return;
        } catch {}
      }
      copyText(url, "✅ تم نسخ رابط الطلاب — أرسله لطلابك الآن");
    };

    async function loadAll() {
      const statusEl = view.querySelector("#teacher-status");
      const { serverOnline, roomOnline, students } = await Store.fetchAllStudents();
      allStudents = students;

      statusEl.className = "teacher-status-bar " + (serverOnline ? "online" : "local");
      statusEl.innerHTML = roomOnline
        ? `🟢 <b>جلسة المعلم متصلة مباشر (${escapeHtml(curRoom.code)})</b> — كل طالب يفتح الرابط أعلاه ويكتب اسمه تصل درجاته ونجومه تلقائيًا إلى هذه اللوحة`
        : serverOnline
        ? `🟢 <b>المزامنة السحابية مفعّلة</b> — تُحفظ درجات جميع الطلاب تلقائيًا على السيرفر وعلى أجهزتهم`
        : `🟡 <b>وضع الحفظ المحلي</b> — انسخ رابط الجلسة أعلاه وأرسله للطلاب لتصل درجاتهم مباشرة عند توفر الاتصال`;

      const totalStars = students.reduce((a, b) => a + (b.stars || 0), 0);
      const totalPlays = students.reduce((a, b) => a + (b.played || 0), 0);
      const avgAcc = students.length
        ? Math.round(students.reduce((a, b) => a + (b.accuracy || 0), 0) / students.length)
        : 0;

      view.querySelector("#ts-count").textContent = students.length;
      view.querySelector("#ts-stars").textContent = totalStars;
      view.querySelector("#ts-plays").textContent = totalPlays;
      view.querySelector("#ts-acc").textContent = avgAcc + "%";

      renderStudents(view.querySelector("#teacher-search").value);
    }

    view.querySelector("#teacher-search").oninput = e => renderStudents(e.target.value);
    view.querySelector("#btn-sync-now").onclick = () => {
      Sound.click();
      toast("🔄 جارٍ مزامنة بيانات الطلاب...");
      loadAll();
    };

    view.querySelector("#btn-export-csv").onclick = () => {
      Sound.click();
      if (!allStudents.length) {
        toast("لا توجد بيانات طلاب لتصديرها");
        return;
      }
      const header = ["الترتيب", "اسم الطالب", "النجوم", "النقاط", "الدروس", "الجولات", "الدقة %", "آخر درس"];
      const rows = allStudents.map((p, idx) => {
        const lastL = p.lastLessonId ? findLesson(p.lastLessonId) : null;
        const cols = [
          idx + 1,
          p.player || "",
          p.stars || 0,
          p.points || 0,
          p.lessonsPlayed || 0,
          p.played || 0,
          (p.accuracy || 0) + "%",
          lastL ? lastL.title : "—"
        ];
        return cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",");
      });
      const csv = "\uFEFF" + [header.join(","), ...rows].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "درجات-طلاب-عباقرة.csv";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("📥 تم تحميل جدول درجات الطلاب (يفتح في Excel)");
    };

    view.querySelector("#btn-export-json").onclick = () => {
      Sound.click();
      const json = JSON.stringify({ students: allStudents }, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "نسخة-طلاب-عباقرة.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("📤 تم حفظ النسخة الاحتياطية");
    };

    view.querySelector("#inp-import-json").onchange = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const count = Store.importJSON(reader.result);
          toast(`✅ تم استيراد ${count} جلسة طالب`);
          loadAll();
        } catch {
          toast("❌ ملف غير صالح");
        }
      };
      reader.readAsText(file);
    };

    startLiveRoomListener();
    loadAll();
  }

  /* ---------- المسار ---------- */
  function route() {
    const h = location.hash || "#/";
    clearInterval(newsTimer);
    if (liveUnsub) {
      liveUnsub();
      liveUnsub = null;
    }
    root().innerHTML = "";
    window.scrollTo(0, 0);

    let m;
    if (h === "#/welcome") welcomePage("student");
    else if (h === "#/welcome/teacher") welcomePage("teacher");
    else if (h === "#/" || h === "") {
      if (Store.needsWelcome()) {
        const r = Store.getRoom();
        welcomePage(r && r.role === "teacher" ? "teacher" : "student");
      } else {
        home();
      }
    }
    else if (h === "#/settings") settings();
    else if (h === "#/profiles") profilesPage();
    else if (h === "#/teacher") teacherPage();
    else if (h === "#/phonics") phonicsStudio();
    else if (h === "#/rewards") rewardsPage();
    else if ((m = h.match(/^#\/grade\/(.+)$/))) gradeMenu(m[1]);
    else if ((m = h.match(/^#\/lesson\/(.+)$/))) lessonMenu(m[1]);
    else if ((m = h.match(/^#\/play\/(.+)\/(.+)$/))) play(m[1], m[2]);
    else home();
  }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function toast(msg) {
    let t = $("#toast");
    if (!t) {
      t = el("div", "", "");
      t.id = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- الإقلاع ---------- */
  function init() {
    window.addEventListener("hashchange", route);
    route();
    if (Sound.warmup) Sound.warmup();

    /* تثبيت PWA */
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      window.__deferredPrompt = e;
    });

    /* تسجيل عامل الخدمة للعمل بدون إنترنت */
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
