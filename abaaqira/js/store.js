/* ============================================================
   عباقرة - المخزن ونظام الجلسات المتعددة وجلسة المعلم السحابية:
   - كل اسم طالب له جلسة مستقلة تمامًا (نقاط، نجوم، سلسلة، دروس، ملصقات، آخر درس)
   - المعلم ينشئ جلسة خاصة ويشارك رابطها مع الطلاب لتصل درجاتهم مباشرة إلى لوحة المعلم
   - حساب دقيق لتقدّم كل لعبة (٠-٣ نجوم) وكل درس وكل صف
   ============================================================ */

const Store = (() => {
  const KEY_V2 = "abaaqira_sessions_v2";
  const KEY_V1 = "abaaqira_v1";
  const KEY_ROOM = "abaaqira_room_v1";
  const KEY_ONBOARDED = "abaaqira_onboarded_v1";
  const KEY_ROOM_CACHE_PREFIX = "abaaqira_room_students_v1_";
  const SESSION_STARTED_KEY = "abaaqira_session_started_v1";

  const AVATARS = ["🦁", "🦋", "🚀", "🧸", "🌟", "👑", "🐰", "🐬", "🍓", "🦊"];

  function normalizeRoomCode(raw) {
    const clean = String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean) return "";
    if (/^\d{3,6}$/.test(clean)) return "ABQ-" + clean;
    if (/^ABQ[A-Z0-9]+$/.test(clean)) return "ABQ-" + clean.slice(3);
    return clean.slice(0, 14);
  }

  function roomTopic(code) {
    const norm = normalizeRoomCode(code).replace(/[^A-Z0-9]/g, "").toLowerCase();
    return norm ? "vaqeno_abq_" + norm : "";
  }

  function loadRoom() {
    try {
      const raw = localStorage.getItem(KEY_ROOM);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.code) {
          parsed.code = normalizeRoomCode(parsed.code);
          return parsed;
        }
      }
    } catch {}
    return null;
  }

  let currentRoom = loadRoom();
  let urlInvitePending = false;

  /* التقاط رمز جلسة المعلم من الرابط عند فتح المنصة (?room=ABQ-1234&t=...) */
  function detectRoomFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      let code = params.get("room") || params.get("code") || "";
      let title = params.get("t") || params.get("class") || params.get("teacher") || "";
      if (!code && window.location.hash && window.location.hash.includes("?")) {
        const q = window.location.hash.split("?")[1];
        const hp = new URLSearchParams(q);
        code = hp.get("room") || hp.get("code") || "";
        title = title || hp.get("t") || hp.get("class") || "";
      }
      const norm = normalizeRoomCode(code);
      if (norm) {
        const isSameTeacher =
          currentRoom && currentRoom.code === norm && currentRoom.role === "teacher";
        currentRoom = {
          code: norm,
          title: (title || (currentRoom && currentRoom.code === norm ? currentRoom.title : "") || "جلسة المعلم").trim().slice(0, 50),
          role: isSameTeacher ? "teacher" : "student",
          createdAt: (currentRoom && currentRoom.createdAt) || Date.now()
        };
        localStorage.setItem(KEY_ROOM, JSON.stringify(currentRoom));
        if (!isSameTeacher) {
          urlInvitePending = true;
          sessionStorage.removeItem(SESSION_STARTED_KEY);
        }
        /* جلب اسم جلسة المعلم من القناة السحابية إن لم يكن في الرابط */
        const topic = roomTopic(norm);
        if (topic && typeof fetch === "function") {
          fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`)
            .then(r => (r.ok ? r.text() : ""))
            .then(txt => {
              let foundTitle = "";
              txt.split("\n").filter(Boolean).forEach(line => {
                try {
                  const ev = JSON.parse(line);
                  if (ev && ev.message) {
                    const msg = JSON.parse(ev.message);
                    if (msg && msg.t === "room_init" && msg.title) foundTitle = msg.title;
                    else if (msg && msg.roomTitle && !foundTitle) foundTitle = msg.roomTitle;
                  }
                } catch {}
              });
              if (foundTitle && currentRoom && currentRoom.code === norm) {
                currentRoom.title = String(foundTitle).trim().slice(0, 50);
                localStorage.setItem(KEY_ROOM, JSON.stringify(currentRoom));
                const b = document.querySelector(".room-invite-txt b");
                if (b) b.textContent = "أنت في جلسة: " + currentRoom.title;
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
  }

  detectRoomFromUrl();

  function blankProfile(name = "صديقي", avatar = "🦁") {
    const id = "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    return {
      id,
      player: (name || "صديقي").trim().slice(0, 30) || "صديقي",
      avatar: avatar || "🦁",
      points: 0,
      stars: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      wrong: 0,
      played: 0,
      lastLessonId: "",
      room: currentRoom ? currentRoom.code : "",
      updatedAt: Date.now(),
      lessons: {} // { [lessonId]: { [gameId]: { best, stars (0..3), plays } } }
    };
  }

  function normalizeProfile(p) {
    const base = blankProfile(p.player || "صديقي", p.avatar || "🦁");
    const merged = Object.assign(base, p);
    merged.lessons = merged.lessons && typeof merged.lessons === "object" ? merged.lessons : {};
    let totalStars = 0;
    Object.values(merged.lessons).forEach(lObj => {
      if (!lObj || typeof lObj !== "object") return;
      Object.values(lObj).forEach(cell => {
        if (!cell || typeof cell !== "object") return;
        const plays = Math.max(1, cell.plays || 1);
        if (cell.stars > 3) {
          cell.stars = Math.min(3, Math.max(1, Math.round(cell.stars / plays)));
        }
        cell.stars = Math.max(0, Math.min(3, cell.stars || 0));
        totalStars += cell.stars;
      });
    });
    merged.stars = Math.max(totalStars, merged.stars > totalStars && totalStars === 0 ? merged.stars : totalStars);
    return merged;
  }

  function loadState() {
    try {
      const rawV2 = localStorage.getItem(KEY_V2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        if (parsed && parsed.profiles && typeof parsed.profiles === "object") {
          const profiles = {};
          Object.entries(parsed.profiles).forEach(([k, v]) => {
            if (v && typeof v === "object") {
              const norm = normalizeProfile(v);
              norm.id = k;
              profiles[k] = norm;
            }
          });
          const ids = Object.keys(profiles);
          if (ids.length) {
            const activeId = profiles[parsed.activeId] ? parsed.activeId : ids[0];
            return { activeId, profiles };
          }
        }
      }
      const rawV1 = localStorage.getItem(KEY_V1);
      if (rawV1) {
        const old = JSON.parse(rawV1);
        const migrated = normalizeProfile(Object.assign(blankProfile(old.player || "صديقي", "🦁"), old));
        return { activeId: migrated.id, profiles: { [migrated.id]: migrated } };
      }
    } catch {}
    const first = blankProfile("صديقي", "🦁");
    return { activeId: first.id, profiles: { [first.id]: first } };
  }

  let state = loadState();

  function active() {
    if (!state.profiles[state.activeId]) {
      const ids = Object.keys(state.profiles);
      if (ids.length) state.activeId = ids[0];
      else {
        const first = blankProfile("صديقي", "🦁");
        state.profiles[first.id] = first;
        state.activeId = first.id;
      }
    }
    return state.profiles[state.activeId];
  }

  let syncTimer = null;

  function mergeRemoteIntoLocal(localProf, remoteProf) {
    if (!remoteProf || typeof remoteProf !== "object") return false;
    let changed = false;
    if (remoteProf.avatar && !localProf.avatar) {
      localProf.avatar = remoteProf.avatar;
      changed = true;
    }
    if ((remoteProf.points || 0) > (localProf.points || 0)) {
      localProf.points = remoteProf.points;
      changed = true;
    }
    if ((remoteProf.bestStreak || 0) > (localProf.bestStreak || 0)) {
      localProf.bestStreak = remoteProf.bestStreak;
      changed = true;
    }
    if ((remoteProf.correct || 0) > (localProf.correct || 0)) {
      localProf.correct = remoteProf.correct;
      changed = true;
    }
    if ((remoteProf.wrong || 0) > (localProf.wrong || 0)) {
      localProf.wrong = remoteProf.wrong;
      changed = true;
    }
    if ((remoteProf.played || 0) > (localProf.played || 0)) {
      localProf.played = remoteProf.played;
      changed = true;
    }
    if (remoteProf.lastLessonId && (!localProf.lastLessonId || (remoteProf.updatedAt || 0) >= (localProf.updatedAt || 0))) {
      if (localProf.lastLessonId !== remoteProf.lastLessonId) {
        localProf.lastLessonId = remoteProf.lastLessonId;
        changed = true;
      }
    }
    const rLessons = remoteProf.lessons || {};
    if (!localProf.lessons) localProf.lessons = {};
    Object.entries(rLessons).forEach(([lid, games]) => {
      if (!games || typeof games !== "object") return;
      if (!localProf.lessons[lid]) localProf.lessons[lid] = {};
      Object.entries(games).forEach(([gid, cell]) => {
        if (!cell || typeof cell !== "object") return;
        const curCell = localProf.lessons[lid][gid] || { best: 0, stars: 0, plays: 0 };
        const nb = Math.max(curCell.best || 0, cell.best || 0);
        const ns = Math.min(3, Math.max(curCell.stars || 0, cell.stars || 0));
        const np = Math.max(curCell.plays || 0, cell.plays || 0);
        if (nb !== curCell.best || ns !== curCell.stars || np !== curCell.plays) {
          localProf.lessons[lid][gid] = { best: nb, stars: ns, plays: np };
          changed = true;
        }
      });
    });
    if (changed) {
      recalcTotalStars(localProf);
      try {
        localStorage.setItem(KEY_V2, JSON.stringify(state));
        localStorage.setItem(KEY_V1, JSON.stringify(active()));
      } catch {}
    }
    return changed;
  }

  /* حفظ قائمة طلاب جلسة المعلم محليًا لضمان بقائها دائمة على جهاز المعلم */
  function loadRoomCache(code) {
    const norm = normalizeRoomCode(code);
    if (!norm) return {};
    try {
      const raw = localStorage.getItem(KEY_ROOM_CACHE_PREFIX + norm);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {}
    return {};
  }

  function saveRoomCache(code, mapObj) {
    const norm = normalizeRoomCode(code);
    if (!norm) return;
    try {
      localStorage.setItem(KEY_ROOM_CACHE_PREFIX + norm, JSON.stringify(mapObj || {}));
    } catch {}
  }

  function mergeStudentIntoRoomCache(code, studentProf) {
    const norm = normalizeRoomCode(code);
    if (!norm || !studentProf || !studentProf.player) return;
    const name = String(studentProf.player).trim();
    if (!name || name === "صديقي") return;
    const key = name.toLowerCase();
    const cache = loadRoomCache(norm);
    const existing = cache[key] ? normalizeProfile(cache[key]) : blankProfile(name, studentProf.avatar || "🦁");
    if (studentProf.avatar) existing.avatar = studentProf.avatar;
    existing.room = norm;
    mergeRemoteIntoLocal(existing, studentProf);
    recalcTotalStars(existing);
    existing.updatedAt = Math.max(existing.updatedAt || 0, studentProf.updatedAt || Date.now());
    cache[key] = existing;
    saveRoomCache(norm, cache);
  }

  /* إرسال تقدم الطالب إلى قناة جلسة المعلم السحابية + api.php إن وُجد */
  function syncToServer(immediate = false) {
    if (typeof fetch !== "function") return Promise.resolve(null);
    const run = async () => {
      const cur = active();
      const profiles = Object.values(state.profiles).filter(
        p => p && p.player && p.player.trim() && p.player.trim() !== "صديقي"
      );

      let roomSynced = false;
      const roomCode = (currentRoom && currentRoom.code) || cur.room || "";
      const topic = roomTopic(roomCode);
      if (topic && cur.player && cur.player.trim() && cur.player.trim() !== "صديقي") {
        cur.room = normalizeRoomCode(roomCode);
        mergeStudentIntoRoomCache(cur.room, cur);
        try {
          const r = await fetch("https://ntfy.sh/" + topic, {
            method: "POST",
            body: JSON.stringify({
              t: "sync",
              room: cur.room,
              roomTitle: (currentRoom && currentRoom.title) || "",
              ts: Date.now(),
              profile: cur
            })
          });
          roomSynced = r.ok;
        } catch {}
      }

      if (!profiles.length) return { ok: roomSynced };
      try {
        const r = await fetch("./api.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", profile: cur, profiles })
        });
        if (r.ok) {
          const res = await r.json();
          if (res && res.ok && res.profile) {
            mergeRemoteIntoLocal(cur, res.profile);
          }
          return res;
        }
      } catch {}
      return { ok: roomSynced };
    };
    if (immediate) return run();
    clearTimeout(syncTimer);
    syncTimer = setTimeout(run, 250);
    return Promise.resolve(null);
  }

  async function pullPlayerFromServer(name) {
    if (typeof fetch !== "function" || !name || name === "صديقي") return null;
    const clean = name.trim().toLowerCase();

    /* جلب من قناة جلسة المعلم إن كان الطالب منضمًا لجلسة */
    const roomCode = currentRoom && currentRoom.code;
    const topic = roomTopic(roomCode);
    if (topic) {
      try {
        const r = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
        if (r.ok) {
          const txt = await r.text();
          const lines = txt.split("\n").filter(Boolean);
          lines.forEach(line => {
            try {
              const ev = JSON.parse(line);
              if (ev && ev.event === "message" && ev.message) {
                const msg = JSON.parse(ev.message);
                if (msg && msg.t === "sync" && msg.profile && msg.profile.player) {
                  mergeStudentIntoRoomCache(roomCode, msg.profile);
                  if (String(msg.profile.player).trim().toLowerCase() === clean) {
                    const target = Object.values(state.profiles).find(
                      p => (p.player || "").trim().toLowerCase() === clean
                    );
                    if (target) mergeRemoteIntoLocal(target, msg.profile);
                  }
                }
              }
            } catch {}
          });
        }
      } catch {}
    }

    try {
      const r = await fetch(`./api.php?action=get&player=${encodeURIComponent(name)}`);
      if (r.ok) {
        const res = await r.json();
        if (res && res.ok && res.profile) {
          const target = Object.values(state.profiles).find(
            p => (p.player || "").trim().toLowerCase() === clean
          );
          if (target) mergeRemoteIntoLocal(target, res.profile);
        }
        return res;
      }
    } catch {}
    return null;
  }

  function save() {
    try {
      const cur = active();
      cur.updatedAt = Date.now();
      if (currentRoom && currentRoom.code) cur.room = currentRoom.code;
      localStorage.setItem(KEY_V2, JSON.stringify(state));
      localStorage.setItem(KEY_V1, JSON.stringify(cur));
      syncToServer(false);
    } catch {}
  }

  function recalcTotalStars(prof) {
    let sum = 0;
    Object.values(prof.lessons || {}).forEach(lObj => {
      Object.values(lObj || {}).forEach(cell => {
        sum += Math.max(0, Math.min(3, (cell && cell.stars) || 0));
      });
    });
    prof.stars = sum;
  }

  function availableGamesForLesson(lessonId) {
    if (typeof findLesson === "function" && typeof GAMES !== "undefined" && typeof GAME_HAS !== "undefined") {
      const l = findLesson(lessonId);
      if (l) return GAMES.filter(g => !GAME_HAS[g.id] || GAME_HAS[g.id](l));
    }
    return [{ id: "match" }, { id: "quiz" }, { id: "tf" }];
  }

  function lessonStarsForProfile(prof, lessonId) {
    const avail = availableGamesForLesson(lessonId);
    const lData = (prof.lessons && prof.lessons[lessonId]) || {};
    let stars = 0, doneGames = 0;
    avail.forEach(g => {
      const cell = lData[g.id];
      if (cell && cell.plays > 0) {
        doneGames++;
        stars += Math.max(0, Math.min(3, cell.stars || 0));
      }
    });
    const totalGames = avail.length;
    const max = totalGames * 3;
    const pct = max ? Math.round((stars / max) * 100) : 0;
    return {
      stars,
      max,
      doneGames,
      totalGames,
      pct,
      completed: totalGames > 0 && doneGames === totalGames
    };
  }

  return {
    AVATARS,
    normalizeRoomCode,
    get: () => active(),

    /* هل توجد جلسات طلاب حقيقية محفوظة على هذا الجهاز؟ */
    hasRealProfiles() {
      return Object.values(state.profiles).some(
        p => p && p.player && p.player.trim() && p.player.trim() !== "صديقي"
      );
    },

    /* هل يحتاج المستخدم شاشة الترحيب (اختيار اسم الطالب أو إنشاء جلسة معلم)؟ */
    needsWelcome() {
      try {
        const params = new URLSearchParams(window.location.search || "");
        if (params.get("skipWelcome") === "1") return false;
      } catch {}
      if (urlInvitePending) return true;
      const cur = active();
      if (!cur.player || cur.player.trim() === "صديقي") return true;
      if (sessionStorage.getItem(SESSION_STARTED_KEY) !== "1") return true;
      return false;
    },

    markSessionStarted() {
      urlInvitePending = false;
      try {
        localStorage.setItem(KEY_ONBOARDED, "1");
        sessionStorage.setItem(SESSION_STARTED_KEY, "1");
      } catch {}
    },

    /* إدارة جلسة المعلم ورابط دعوة الطلاب */
    getRoom() {
      return currentRoom;
    },

    createTeacherRoom(title = "فصل عباقرة", customCode = "") {
      const cleanTitle = (title || "فصل عباقرة").trim().slice(0, 50) || "فصل عباقرة";
      const code =
        normalizeRoomCode(customCode) ||
        (currentRoom && currentRoom.role === "teacher" && currentRoom.code
          ? currentRoom.code
          : "ABQ-" + Math.floor(1000 + Math.random() * 9000));
      currentRoom = {
        code,
        title: cleanTitle,
        role: "teacher",
        createdAt: Date.now()
      };
      try {
        localStorage.setItem(KEY_ROOM, JSON.stringify(currentRoom));
        localStorage.setItem(KEY_ONBOARDED, "1");
        sessionStorage.setItem(SESSION_STARTED_KEY, "1");
      } catch {}
      const topic = roomTopic(code);
      if (topic && typeof fetch === "function") {
        fetch("https://ntfy.sh/" + topic, {
          method: "POST",
          body: JSON.stringify({ t: "room_init", room: code, title: cleanTitle, ts: Date.now() })
        }).catch(() => {});
      }
      return currentRoom;
    },

    regenerateTeacherRoom(title = "") {
      const cleanTitle =
        (title || (currentRoom && currentRoom.title) || "فصل عباقرة").trim().slice(0, 50) || "فصل عباقرة";
      const code = "ABQ-" + Math.floor(1000 + Math.random() * 9000);
      currentRoom = {
        code,
        title: cleanTitle,
        role: "teacher",
        createdAt: Date.now()
      };
      try {
        localStorage.setItem(KEY_ROOM, JSON.stringify(currentRoom));
      } catch {}
      return currentRoom;
    },

    joinStudentRoom(code, title = "") {
      const norm = normalizeRoomCode(code);
      if (!norm) return null;
      currentRoom = {
        code: norm,
        title: (title || (currentRoom && currentRoom.code === norm ? currentRoom.title : "") || "جلسة المعلم")
          .trim()
          .slice(0, 50),
        role: "student",
        createdAt: Date.now()
      };
      try {
        localStorage.setItem(KEY_ROOM, JSON.stringify(currentRoom));
      } catch {}
      const cur = active();
      cur.room = norm;
      save();
      syncToServer(true);
      return currentRoom;
    },

    leaveRoom() {
      currentRoom = null;
      urlInvitePending = false;
      try {
        localStorage.removeItem(KEY_ROOM);
      } catch {}
    },

    getStudentInviteUrl(roomObj = currentRoom) {
      const r = roomObj || currentRoom;
      if (!r || !r.code) return "https://vaqenoo.com/abaaqira/";
      let base = "https://vaqenoo.com/abaaqira/";
      try {
        const loc = window.location;
        if (
          loc &&
          /^https?:$/i.test(loc.protocol) &&
          loc.hostname !== "localhost" &&
          loc.hostname !== "127.0.0.1"
        ) {
          base = loc.origin + loc.pathname.replace(/index\.html$/i, "");
          if (!base.endsWith("/")) base += "/";
        }
      } catch {}
      return `${base}?room=${encodeURIComponent(r.code)}`;
    },

    getStudentWhatsAppUrl(roomObj = currentRoom) {
      const r = roomObj || currentRoom;
      const url = this.getStudentInviteUrl(r);
      const title = (r && r.title) || "فصل عباقرة";
      const code = (r && r.code) || "";
      const msg =
        `🎓 مرحبًا بكم في منصة *عباقرة* التعليمية\n` +
        `🏫 جلسة: *${title}*\n` +
        (code ? `🔑 رمز الجلسة: *${code}*\n` : "") +
        `✍️ افتح الرابط واكتب اسمك لتبدأ اللعب ويصل تقدّمك ونجومك لمعلمك تلقائيًا:\n${url}`;
      return `https://wa.me/?text=${encodeURIComponent(msg)}`;
    },

    /* تبديل إلى جلسة الاسم إن وُجدت، أو إنشاء جلسة مستقلة جديدة لهذا الاسم */
    setPlayer(name, avatar) {
      const clean = (name || "").trim().slice(0, 30);
      if (!clean) return active().player;

      this.markSessionStarted();

      const existing = Object.values(state.profiles).find(
        p => (p.player || "").trim().toLowerCase() === clean.toLowerCase()
      );
      if (existing) {
        state.activeId = existing.id;
        if (avatar) existing.avatar = avatar;
        if (currentRoom && currentRoom.code) existing.room = currentRoom.code;
        save();
        syncToServer(true);
        pullPlayerFromServer(clean);
        return existing.player;
      }

      const cur = active();
      if ((cur.player === "صديقي" || !cur.player) && cur.played === 0 && cur.points === 0) {
        cur.player = clean;
        if (avatar) cur.avatar = avatar;
        if (currentRoom && currentRoom.code) cur.room = currentRoom.code;
        save();
        syncToServer(true);
        pullPlayerFromServer(clean);
        return cur.player;
      }

      const nextAvatar = avatar || AVATARS[Object.keys(state.profiles).length % AVATARS.length];
      const created = blankProfile(clean, nextAvatar);
      if (currentRoom && currentRoom.code) created.room = currentRoom.code;
      state.profiles[created.id] = created;
      state.activeId = created.id;
      save();
      syncToServer(true);
      pullPlayerFromServer(clean);
      return created.player;
    },

    updateActiveProfile({ name, avatar }) {
      const cur = active();
      const clean = (name || "").trim().slice(0, 30);
      if (clean) cur.player = clean;
      if (avatar) cur.avatar = avatar;
      save();
      return cur;
    },

    listProfiles() {
      const curId = active().id;
      return Object.values(state.profiles)
        .filter(p => p && p.player && (p.player !== "صديقي" || Object.keys(state.profiles).length === 1))
        .map(p => {
          const t = (p.correct || 0) + (p.wrong || 0);
          const acc = t ? Math.round((p.correct / t) * 100) : 0;
          const lessonsPlayed = Object.keys(p.lessons || {}).length;
          return {
            ...p,
            isActive: p.id === curId,
            accuracy: acc,
            lessonsPlayed
          };
        })
        .sort((a, b) => (b.isActive - a.isActive) || (b.stars - a.stars) || ((b.updatedAt || 0) - (a.updatedAt || 0)));
    },

    switchProfile(id) {
      if (state.profiles[id]) {
        state.activeId = id;
        this.markSessionStarted();
        save();
        syncToServer(true);
      }
      return active();
    },

    deleteProfile(id) {
      if (!state.profiles[id]) return active();
      delete state.profiles[id];
      const ids = Object.keys(state.profiles);
      if (!ids.length) {
        const first = blankProfile("صديقي", "🦁");
        state.profiles[first.id] = first;
        state.activeId = first.id;
      } else if (state.activeId === id) {
        state.activeId = ids[0];
      }
      save();
      return active();
    },

    setLastLesson(lessonId) {
      const cur = active();
      cur.lastLessonId = lessonId || "";
      save();
    },

    record({ lessonId, gameId, score, stars, correct, wrong }) {
      const data = active();
      const clampedStars = Math.max(0, Math.min(3, stars || 0));
      data.points += score;
      data.correct += correct;
      data.wrong += wrong;
      data.played += 1;
      data.lastLessonId = lessonId;

      if (!data.lessons[lessonId]) data.lessons[lessonId] = {};
      const cell = data.lessons[lessonId][gameId] ||
        (data.lessons[lessonId][gameId] = { best: 0, stars: 0, plays: 0 });
      cell.plays += 1;
      cell.stars = Math.max(cell.stars || 0, clampedStars);
      if (score > cell.best) cell.best = score;

      recalcTotalStars(data);
      save();
      return data;
    },

    hitStreak() {
      const data = active();
      data.streak += 1;
      if (data.streak > data.bestStreak) data.bestStreak = data.streak;
      save();
      return data.streak;
    },

    resetStreak() {
      const data = active();
      data.streak = 0;
      save();
      return 0;
    },

    streakMultiplier() {
      const s = active().streak;
      if (s >= 8) return 3;
      if (s >= 5) return 2;
      if (s >= 3) return 1.5;
      return 1;
    },

    lessonStars(lessonId) {
      return lessonStarsForProfile(active(), lessonId);
    },

    gradeProgress(grade) {
      const prof = active();
      let stars = 0, max = 0, doneLessons = 0, doneGames = 0, totalGames = 0, nextLesson = null;
      (grade.lessons || []).forEach(l => {
        const st = lessonStarsForProfile(prof, l.id);
        stars += st.stars;
        max += st.max;
        doneGames += st.doneGames;
        totalGames += st.totalGames;
        if (st.completed) doneLessons++;
        else if (!nextLesson) nextLesson = l;
      });
      const totalLessons = (grade.lessons || []).length;
      const pct = max ? Math.round((stars / max) * 100) : 0;
      return {
        stars,
        max,
        doneLessons,
        totalLessons,
        doneGames,
        totalGames,
        pct,
        nextLesson: nextLesson || (grade.lessons && grade.lessons[0]) || null
      };
    },

    resetAll() {
      const cur = active();
      const fresh = blankProfile(cur.player, cur.avatar);
      fresh.id = cur.id;
      state.profiles[cur.id] = fresh;
      save();
      return fresh;
    },

    syncNow: () => syncToServer(true),

    /* جلب جميع الطلاب (من قناة جلسة المعلم السحابية + api.php + الجهاز المحلي) */
    async fetchAllStudents() {
      await syncToServer(true);
      const byName = new Map();
      const enrich = p => {
        const norm = normalizeProfile(p);
        const t = (norm.correct || 0) + (norm.wrong || 0);
        const accuracy = t ? Math.round(((norm.correct || 0) / t) * 100) : 0;
        const lessonsPlayed = Object.keys(norm.lessons || {}).length;
        return {
          ...norm,
          stars: norm.stars || 0,
          points: norm.points || 0,
          played: norm.played || 0,
          accuracy,
          lessonsPlayed
        };
      };

      const mergeEntry = sp => {
        if (!sp || !sp.player) return;
        const name = String(sp.player).trim();
        if (!name || name === "صديقي") return;
        const key = name.toLowerCase();
        const prev = byName.get(key);
        if (!prev) {
          byName.set(key, enrich(sp));
        } else {
          const combined = normalizeProfile(prev);
          mergeRemoteIntoLocal(combined, sp);
          combined.updatedAt = Math.max(prev.updatedAt || 0, sp.updatedAt || 0);
          byName.set(key, enrich(combined));
        }
      };

      Object.values(state.profiles).forEach(mergeEntry);

      let serverOnline = false;
      let roomOnline = false;

      /* 1) جلب طلاب جلسة المعلم السحابية */
      const roomCode = currentRoom && currentRoom.code;
      if (roomCode) {
        const cached = loadRoomCache(roomCode);
        Object.values(cached).forEach(mergeEntry);
        const topic = roomTopic(roomCode);
        if (topic && typeof fetch === "function") {
          try {
            const r = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
            if (r.ok) {
              roomOnline = true;
              const txt = await r.text();
              const deletedKeys = new Set();
              txt.split("\n").filter(Boolean).forEach(line => {
                try {
                  const ev = JSON.parse(line);
                  if (ev && ev.event === "message" && ev.message) {
                    const msg = JSON.parse(ev.message);
                    if (msg && msg.t === "sync" && msg.profile && msg.profile.player) {
                      const k = String(msg.profile.player).trim().toLowerCase();
                      deletedKeys.delete(k);
                      mergeStudentIntoRoomCache(roomCode, msg.profile);
                      mergeEntry(msg.profile);
                    } else if (msg && msg.t === "delete" && msg.player) {
                      const k = String(msg.player).trim().toLowerCase();
                      deletedKeys.add(k);
                    }
                  }
                } catch {}
              });
              if (deletedKeys.size) {
                const c = loadRoomCache(roomCode);
                deletedKeys.forEach(k => {
                  byName.delete(k);
                  delete c[k];
                });
                saveRoomCache(roomCode, c);
              }
            }
          } catch {}
        }
      }

      /* 2) جلب من api.php إن توفّر على الاستضافة */
      if (typeof fetch === "function") {
        try {
          const r = await fetch("./api.php?action=list");
          if (r.ok) {
            const data = await r.json();
            if (data && data.ok && Array.isArray(data.students)) {
              serverOnline = true;
              data.students.forEach(mergeEntry);
            }
          }
        } catch {}
      }

      const students = Array.from(byName.values()).sort(
        (a, b) => (b.stars - a.stars) || (b.points - a.points) || ((b.updatedAt || 0) - (a.updatedAt || 0))
      );
      return { serverOnline: serverOnline || roomOnline, roomOnline, students };
    },

    /* استماع لحظي مباشر لوصول الطلاب وتقدمهم في لوحة المعلم */
    subscribeRoomLive(onStudentSync) {
      const roomCode = currentRoom && currentRoom.code;
      const topic = roomTopic(roomCode);
      if (
        !topic ||
        typeof EventSource === "undefined" ||
        (typeof navigator !== "undefined" && /Headless/i.test(navigator.userAgent || ""))
      ) {
        return () => {};
      }
      let es = null;
      try {
        es = new EventSource(`https://ntfy.sh/${topic}/sse`);
        es.onmessage = e => {
          try {
            const ev = JSON.parse(e.data);
            if (ev && ev.message) {
              const msg = JSON.parse(ev.message);
              if (msg && msg.t === "sync" && msg.profile && msg.profile.player) {
                mergeStudentIntoRoomCache(roomCode, msg.profile);
                if (typeof onStudentSync === "function") onStudentSync(msg.profile);
              } else if (msg && msg.t === "delete" && msg.player) {
                if (typeof onStudentSync === "function") onStudentSync(null);
              }
            }
          } catch {}
        };
      } catch {}
      return () => {
        try {
          if (es) es.close();
        } catch {}
      };
    },

    async deleteStudentEverywhere(player) {
      const key = (player || "").trim().toLowerCase();
      Object.values(state.profiles).forEach(p => {
        if ((p.player || "").trim().toLowerCase() === key) {
          this.deleteProfile(p.id);
        }
      });
      const roomCode = currentRoom && currentRoom.code;
      if (roomCode && key) {
        const cache = loadRoomCache(roomCode);
        delete cache[key];
        saveRoomCache(roomCode, cache);
        const topic = roomTopic(roomCode);
        if (topic && typeof fetch === "function") {
          fetch("https://ntfy.sh/" + topic, {
            method: "POST",
            body: JSON.stringify({ t: "delete", room: roomCode, player, ts: Date.now() })
          }).catch(() => {});
        }
      }
      if (typeof fetch === "function" && key) {
        try {
          await fetch("./api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", player })
          });
        } catch {}
      }
    },

    exportJSON() {
      return JSON.stringify(state, null, 2);
    },

    importJSON(raw) {
      const parsed = JSON.parse(raw);
      const list = parsed.profiles
        ? Object.values(parsed.profiles)
        : Array.isArray(parsed.students)
        ? parsed.students
        : [];
      let count = 0;
      list.forEach(p => {
        if (!p || !p.player) return;
        const clean = String(p.player).trim();
        if (!clean) return;
        let target = Object.values(state.profiles).find(
          x => (x.player || "").trim().toLowerCase() === clean.toLowerCase()
        );
        if (!target) {
          target = blankProfile(clean, p.avatar || "🦁");
          state.profiles[target.id] = target;
        }
        mergeRemoteIntoLocal(target, p);
        if (currentRoom && currentRoom.code) {
          mergeStudentIntoRoomCache(currentRoom.code, target);
        }
        count++;
      });
      save();
      return count;
    }
  };
})();
