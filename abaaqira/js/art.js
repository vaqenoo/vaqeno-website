/* ============================================================
   عباقرة - مكتبة الرسوم (SVG)
   رسوم ملوّنة مرسومة بالكامل - لا تحتاج أي ملفات خارجية
   الاستخدام: Art.get("cat") أو Art.get("num_3") أو Art.get("letter_ب")
   ============================================================ */

const Art = (() => {
  const O = "#1f2937";

  const wrap = inner =>
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  /* ---------- الحيوانات ---------- */
  const cat = `
    <ellipse cx="50" cy="60" rx="28" ry="25" fill="#fb923c" stroke="${O}" stroke-width="2.5"/>
    <path d="M26 40 L21 17 L43 30 Z" fill="#fb923c" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M74 40 L79 17 L57 30 Z" fill="#fb923c" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M28 36 L25 24 L37 31 Z" fill="#fda4af"/>
    <path d="M72 36 L75 24 L63 31 Z" fill="#fda4af"/>
    <circle cx="40" cy="56" r="4.5" fill="${O}"/><circle cx="60" cy="56" r="4.5" fill="${O}"/>
    <circle cx="41.5" cy="54.4" r="1.5" fill="#fff"/><circle cx="61.5" cy="54.4" r="1.5" fill="#fff"/>
    <path d="M50 64 l-4.5 3.5 h9 z" fill="#ec4899"/>
    <path d="M50 67.5 v3 M50 70.5 q-5 5 -9 1 M50 70.5 q5 5 9 1" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M18 56 h14 M18 62 h14 M68 56 h14 M68 62 h14" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>`;

  const dog = `
    <ellipse cx="50" cy="60" rx="27" ry="24" fill="#f0a24a" stroke="${O}" stroke-width="2.5"/>
    <path d="M27 42 Q13 47 16 68 Q26 60 32 52 Z" fill="#a16207" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M73 42 Q87 47 84 68 Q74 60 68 52 Z" fill="#a16207" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="41" cy="55" r="4" fill="${O}"/><circle cx="59" cy="55" r="4" fill="${O}"/>
    <circle cx="42.4" cy="53.6" r="1.4" fill="#fff"/><circle cx="60.4" cy="53.6" r="1.4" fill="#fff"/>
    <ellipse cx="50" cy="65" rx="6" ry="4.5" fill="${O}"/>
    <path d="M50 69.5 v3.5 M50 73 q-6 5 -10 0 M50 73 q6 5 10 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M45 78 q5 7 10 0 q-5 4 -10 0" fill="#ec4899"/>`;

  const bird = `
    <ellipse cx="47" cy="57" rx="26" ry="22" fill="#38bdf8" stroke="${O}" stroke-width="2.5"/>
    <path d="M28 60 L12 66 L28 72 Z" fill="#38bdf8" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="67" cy="38" r="15" fill="#38bdf8" stroke="${O}" stroke-width="2.5"/>
    <path d="M81 35 l14 4 -14 5 z" fill="#f59e0b" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="69" cy="35" r="3.2" fill="${O}"/><circle cx="70.2" cy="33.9" r="1.1" fill="#fff"/>
    <path d="M38 54 q14 -7 23 6 q-15 8 -23 -6" fill="#0ea5e9" stroke="${O}" stroke-width="2"/>
    <path d="M42 78 l-2 9 M54 78 l2 9" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>`;

  const fish = `
    <ellipse cx="46" cy="54" rx="30" ry="21" fill="#fb7185" stroke="${O}" stroke-width="2.5"/>
    <path d="M75 54 l19 -15 v30 z" fill="#fb7185" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M38 35 q9 -13 20 -3" fill="#fb7185" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="30" cy="50" r="4.5" fill="${O}"/><circle cx="31.4" cy="48.6" r="1.4" fill="#fff"/>
    <path d="M22 60 q6 4 12 1" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M54 39 q6 15 0 30" stroke="#e11d48" stroke-width="2" fill="none"/>
    <circle cx="60" cy="49" r="3.5" fill="#fda4af"/><circle cx="67" cy="58" r="3" fill="#fda4af"/>`;

  const rabbit = `
    <ellipse cx="36" cy="30" rx="7" ry="18" fill="#f8fafc" stroke="${O}" stroke-width="2.5" transform="rotate(-12 36 30)"/>
    <ellipse cx="64" cy="30" rx="7" ry="18" fill="#f8fafc" stroke="${O}" stroke-width="2.5" transform="rotate(12 64 30)"/>
    <ellipse cx="36" cy="31" rx="3.5" ry="12" fill="#f9a8d4" transform="rotate(-12 36 31)"/>
    <ellipse cx="64" cy="31" rx="3.5" ry="12" fill="#f9a8d4" transform="rotate(12 64 31)"/>
    <circle cx="50" cy="63" r="26" fill="#f8fafc" stroke="${O}" stroke-width="2.5"/>
    <circle cx="41" cy="59" r="4" fill="${O}"/><circle cx="59" cy="59" r="4" fill="${O}"/>
    <circle cx="42.3" cy="57.7" r="1.3" fill="#fff"/><circle cx="60.3" cy="57.7" r="1.3" fill="#fff"/>
    <path d="M50 66 l-4 3.5 h8 z" fill="#f472b6"/>
    <path d="M50 69.5 v2.5 M50 72 q-5 5 -9 1 M50 72 q5 5 9 1" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M24 65 h12 M24 71 h12 M64 65 h12 M64 71 h12" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>`;

  const lion = `
    <circle cx="50" cy="12" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="77" cy="23" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="88" cy="50" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="77" cy="77" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="50" cy="88" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="23" cy="77" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="12" cy="50" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="23" cy="23" r="10" fill="#b45309" stroke="${O}" stroke-width="2.5"/>
    <circle cx="50" cy="50" r="36" fill="#d97706" stroke="${O}" stroke-width="2.5"/>
    <circle cx="50" cy="52" r="26" fill="#fcd34d" stroke="${O}" stroke-width="2.5"/>
    <circle cx="41" cy="47" r="4" fill="${O}"/><circle cx="59" cy="47" r="4" fill="${O}"/>
    <circle cx="42.3" cy="45.7" r="1.3" fill="#fff"/><circle cx="60.3" cy="45.7" r="1.3" fill="#fff"/>
    <path d="M50 56 l-5 4 h10 z" fill="#92400e"/>
    <path d="M50 60 v3 M50 63 q-6 6 -11 1 M50 63 q6 6 11 1" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  const elephant = `
    <ellipse cx="23" cy="52" rx="14" ry="18" fill="#94a3b8" stroke="${O}" stroke-width="2.5"/>
    <ellipse cx="77" cy="52" rx="14" ry="18" fill="#94a3b8" stroke="${O}" stroke-width="2.5"/>
    <circle cx="50" cy="47" r="26" fill="#cbd5e1" stroke="${O}" stroke-width="2.5"/>
    <path d="M50 62 q3 18 -10 23 q-9 3 -7 -6 q3 -10 5 -19" fill="#cbd5e1" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="40" cy="43" r="4" fill="${O}"/><circle cx="60" cy="43" r="4" fill="${O}"/>
    <circle cx="41.3" cy="41.7" r="1.3" fill="#fff"/><circle cx="61.3" cy="41.7" r="1.3" fill="#fff"/>
    <path d="M34 54 q6 4 11 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  const duck = `
    <ellipse cx="47" cy="64" rx="30" ry="20" fill="#fde047" stroke="${O}" stroke-width="2.5"/>
    <path d="M17 66 L5 70 L17 75 Z" fill="#fde047" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="67" cy="36" r="16" fill="#fde047" stroke="${O}" stroke-width="2.5"/>
    <path d="M81 33 q13 2 13 8 q-7 5 -13 1 z" fill="#fb923c" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="69" cy="32" r="3.4" fill="${O}"/><circle cx="70.2" cy="30.9" r="1.1" fill="#fff"/>
    <path d="M33 60 q17 -8 29 4 q-15 10 -29 -4" fill="#facc15" stroke="${O}" stroke-width="2"/>`;

  const frog = `
    <ellipse cx="50" cy="66" rx="32" ry="21" fill="#4ade80" stroke="${O}" stroke-width="2.5"/>
    <circle cx="34" cy="34" r="13" fill="#4ade80" stroke="${O}" stroke-width="2.5"/>
    <circle cx="66" cy="34" r="13" fill="#4ade80" stroke="${O}" stroke-width="2.5"/>
    <circle cx="34" cy="34" r="7" fill="#fff"/><circle cx="66" cy="34" r="7" fill="#fff"/>
    <circle cx="35" cy="35" r="3.5" fill="${O}"/><circle cx="67" cy="35" r="3.5" fill="${O}"/>
    <circle cx="36.2" cy="33.8" r="1.2" fill="#fff"/><circle cx="68.2" cy="33.8" r="1.2" fill="#fff"/>
    <path d="M34 64 q16 12 32 0" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="26" cy="61" r="4.5" fill="#86efac"/><circle cx="74" cy="61" r="4.5" fill="#86efac"/>`;

  const bee = `
    <clipPath id="beeClip"><ellipse cx="50" cy="58" rx="28" ry="22"/></clipPath>
    <ellipse cx="36" cy="32" rx="13" ry="8" fill="#e0f2fe" stroke="${O}" stroke-width="2" transform="rotate(-28 36 32)"/>
    <ellipse cx="64" cy="32" rx="13" ry="8" fill="#e0f2fe" stroke="${O}" stroke-width="2" transform="rotate(28 64 32)"/>
    <path d="M40 20 q-4 -8 -10 -9 M60 20 q4 -8 10 -9" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="29" cy="10" r="3.5" fill="${O}"/><circle cx="71" cy="10" r="3.5" fill="${O}"/>
    <ellipse cx="50" cy="58" rx="28" ry="22" fill="#fde047"/>
    <g clip-path="url(#beeClip)" fill="${O}">
      <rect x="28" y="34" width="9" height="48"/><rect x="46" y="34" width="9" height="48"/><rect x="64" y="34" width="9" height="48"/>
    </g>
    <ellipse cx="50" cy="58" rx="28" ry="22" fill="none" stroke="${O}" stroke-width="2.5"/>
    <circle cx="41" cy="54" r="4" fill="${O}"/><circle cx="59" cy="54" r="4" fill="${O}"/>
    <circle cx="42.3" cy="52.7" r="1.3" fill="#fff"/><circle cx="60.3" cy="52.7" r="1.3" fill="#fff"/>
    <path d="M45 64 q5 5 10 0" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;

  /* ---------- الفواكه ---------- */
  const apple = `
    <path d="M50 32 C30 18 11 33 15 55 C19 77 36 89 50 85 C64 89 81 77 85 55 C89 33 70 18 50 32 Z" fill="#ef4444" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 33 v-13" stroke="#92400e" stroke-width="5" stroke-linecap="round"/>
    <path d="M52 22 q14 -10 24 -2 q-8 12 -24 2" fill="#22c55e" stroke="${O}" stroke-width="2"/>
    <path d="M30 47 q6 -10 14 -13" stroke="#fecaca" stroke-width="5" stroke-linecap="round" fill="none"/>`;

  const banana = `
    <path d="M26 26 Q30 76 74 74" stroke="${O}" stroke-width="23" stroke-linecap="round" fill="none"/>
    <path d="M26 26 Q30 76 74 74" stroke="#fde047" stroke-width="17" stroke-linecap="round" fill="none"/>
    <circle cx="26" cy="26" r="4.5" fill="#92400e"/>
    <circle cx="74" cy="74" r="4.5" fill="#92400e"/>`;

  const orange = `
    <circle cx="50" cy="58" r="30" fill="#fb923c" stroke="${O}" stroke-width="2.5"/>
    <path d="M50 30 v-8" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>
    <path d="M52 24 q13 -9 21 -2 q-7 11 -21 2" fill="#22c55e" stroke="${O}" stroke-width="2"/>
    <circle cx="40" cy="48" r="3" fill="#fed7aa"/><circle cx="53" cy="43" r="2.5" fill="#fed7aa"/><circle cx="61" cy="55" r="3" fill="#fed7aa"/>
    <path d="M34 46 q5 -8 12 -10" stroke="#fed7aa" stroke-width="5" fill="none" stroke-linecap="round"/>`;

  const grapes = `
    <path d="M50 26 v9" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>
    <path d="M52 22 q13 -9 21 -2 q-7 11 -21 2" fill="#22c55e" stroke="${O}" stroke-width="2"/>
    <g fill="#a855f7" stroke="${O}" stroke-width="2">
      <circle cx="50" cy="40" r="9"/><circle cx="36" cy="52" r="9"/><circle cx="64" cy="52" r="9"/>
      <circle cx="50" cy="56" r="9"/><circle cx="43" cy="70" r="9"/><circle cx="57" cy="70" r="9"/><circle cx="50" cy="83" r="9"/>
    </g>`;

  const strawberry = `
    <path d="M50 36 C34 36 20 47 24 64 C28 81 42 89 50 89 C58 89 72 81 76 64 C80 47 66 36 50 36 Z" fill="#ef4444" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M32 36 l8 -10 5 8 5 -10 5 10 5 -8 8 10" fill="#22c55e" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 27 v-8" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>
    <g fill="#fde047">
      <ellipse cx="42" cy="55" rx="2" ry="3"/><ellipse cx="57" cy="51" rx="2" ry="3"/><ellipse cx="50" cy="66" rx="2" ry="3"/>
      <ellipse cx="38" cy="70" rx="2" ry="3"/><ellipse cx="62" cy="68" rx="2" ry="3"/><ellipse cx="50" cy="80" rx="2" ry="3"/>
    </g>`;

  const watermelon = `
    <path d="M12 72 A38 38 0 0 1 88 72 Z" fill="#22c55e" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M21 72 A29 29 0 0 1 79 72 Z" fill="#ef4444"/>
    <g fill="${O}">
      <ellipse cx="40" cy="58" rx="2.5" ry="4"/><ellipse cx="60" cy="58" rx="2.5" ry="4"/>
      <ellipse cx="50" cy="47" rx="2.5" ry="4"/><ellipse cx="33" cy="68" rx="2.5" ry="4"/><ellipse cx="67" cy="68" rx="2.5" ry="4"/>
    </g>`;

  /* ---------- الأشكال ---------- */
  const circleS = `<circle cx="50" cy="50" r="32" fill="#60a5fa" stroke="${O}" stroke-width="3"/>`;
  const squareS = `<rect x="19" y="19" width="62" height="62" rx="6" fill="#f472b6" stroke="${O}" stroke-width="3"/>`;
  const triangleS = `<path d="M50 15 L87 81 H13 Z" fill="#fbbf24" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
  const rectS = `<rect x="13" y="30" width="74" height="40" rx="6" fill="#34d399" stroke="${O}" stroke-width="3"/>`;
  const starS = `<polygon points="50,16 59.4,39 83,41 65,57 70.5,80 50,67 29.5,80 35,57 17,41 40.6,39" fill="#fde047" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;

  /* ---------- الأشخاص (العائلة) ---------- */
  const mom = `
    <path d="M27 90 q3 -30 23 -30 q20 0 23 30 z" fill="#7c3aed" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="50" cy="40" r="22" fill="#7c3aed" stroke="${O}" stroke-width="2.5"/>
    <circle cx="50" cy="45" r="15" fill="#f3c99c" stroke="${O}" stroke-width="2"/>
    <circle cx="44.5" cy="44" r="2.6" fill="${O}"/><circle cx="55.5" cy="44" r="2.6" fill="${O}"/>
    <path d="M46 51 q4 3.5 8 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  const dad = `
    <path d="M27 90 q3 -30 23 -30 q20 0 23 30 z" fill="#1e40af" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="50" cy="40" r="20" fill="#f3c99c" stroke="${O}" stroke-width="2.5"/>
    <path d="M30 37 q3 -18 20 -18 q17 0 20 18 q-8 -9 -20 -9 q-12 0 -20 9" fill="#292524" stroke="${O}" stroke-width="2"/>
    <circle cx="44" cy="41" r="2.6" fill="${O}"/><circle cx="56" cy="41" r="2.6" fill="${O}"/>
    <path d="M45 48 q5 4 10 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  const brother = `
    <path d="M32 90 q3 -23 18 -23 q15 0 18 23 z" fill="#ef4444" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="50" cy="47" r="17" fill="#f3c99c" stroke="${O}" stroke-width="2.5"/>
    <path d="M33 45 q3 -16 17 -16 q14 0 17 16 q-7 -8 -17 -8 q-10 0 -17 8" fill="#292524" stroke="${O}" stroke-width="2"/>
    <circle cx="45" cy="48" r="2.4" fill="${O}"/><circle cx="55" cy="48" r="2.4" fill="${O}"/>
    <path d="M46 54 q4 3.5 8 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  const sister = `
    <path d="M32 90 q3 -23 18 -23 q15 0 18 23 z" fill="#ec4899" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="31" cy="43" r="8" fill="#292524" stroke="${O}" stroke-width="2"/>
    <circle cx="69" cy="43" r="8" fill="#292524" stroke="${O}" stroke-width="2"/>
    <circle cx="50" cy="47" r="17" fill="#f3c99c" stroke="${O}" stroke-width="2.5"/>
    <path d="M33 45 q4 -16 17 -16 q13 0 17 16 q-8 -8 -17 -8 q-9 0 -17 8" fill="#292524" stroke="${O}" stroke-width="2"/>
    <circle cx="45" cy="48" r="2.4" fill="${O}"/><circle cx="55" cy="48" r="2.4" fill="${O}"/>
    <path d="M46 54 q4 3.5 8 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  /* ---------- الأشياء والطبيعة ---------- */
  const house = `
    <path d="M16 49 L50 18 L84 49 Z" fill="#f59e0b" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="64" y="24" width="10" height="16" fill="#dc2626" stroke="${O}" stroke-width="2"/>
    <rect x="24" y="49" width="52" height="36" rx="4" fill="#fde68a" stroke="${O}" stroke-width="2.5"/>
    <rect x="42" y="63" width="16" height="22" rx="3" fill="#92400e" stroke="${O}" stroke-width="2"/>
    <rect x="29" y="56" width="12" height="12" rx="2" fill="#7dd3fc" stroke="${O}" stroke-width="2"/>
    <rect x="59" y="56" width="12" height="12" rx="2" fill="#7dd3fc" stroke="${O}" stroke-width="2"/>`;

  const tree = `
    <rect x="43" y="55" width="14" height="31" rx="4" fill="#92400e" stroke="${O}" stroke-width="2.5"/>
    <circle cx="50" cy="36" r="24" fill="#22c55e" stroke="${O}" stroke-width="2.5"/>
    <circle cx="31" cy="47" r="15" fill="#16a34a" stroke="${O}" stroke-width="2.5"/>
    <circle cx="69" cy="47" r="15" fill="#16a34a" stroke="${O}" stroke-width="2.5"/>`;

  const sun = `
    <path d="M50 6 v14 M50 80 v14 M6 50 h14 M80 50 h14 M19 19 l10 10 M71 71 l10 10 M81 19 l-10 10 M29 71 l-10 10" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="24" fill="#fde047" stroke="${O}" stroke-width="2.5"/>
    <circle cx="43" cy="47" r="3.2" fill="${O}"/><circle cx="57" cy="47" r="3.2" fill="${O}"/>
    <path d="M44 55 q6 5 12 0" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;

  const moon = `
    <path fill-rule="evenodd" fill="#fde047" stroke="${O}" stroke-width="2.5"
      d="M50 14 a36 36 0 1 0 0 72 a36 36 0 1 0 0 -72 M60 24 a26 26 0 1 0 0 52 a26 26 0 1 0 0 -52"/>
    <circle cx="76" cy="24" r="3" fill="#fde047"/><circle cx="84" cy="40" r="2" fill="#fde047"/>`;

  const book = `
    <path d="M50 30 Q36 22 15 26 v45 q21 -4 35 4 z" fill="#60a5fa" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 30 Q64 22 85 26 v45 q-21 -4 -35 4 z" fill="#93c5fd" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 30 v45" stroke="${O}" stroke-width="2.5"/>
    <path d="M24 39 h18 M24 48 h18 M58 39 h18 M58 48 h18" stroke="#eff6ff" stroke-width="2.5" stroke-linecap="round"/>`;

  const school = `
    <path d="M14 41 L50 17 L86 41 Z" fill="#ef4444" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="20" y="41" width="60" height="44" rx="4" fill="#fbbf24" stroke="${O}" stroke-width="2.5"/>
    <rect x="42" y="63" width="16" height="22" rx="3" fill="#92400e" stroke="${O}" stroke-width="2"/>
    <rect x="26" y="49" width="12" height="12" rx="2" fill="#7dd3fc" stroke="${O}" stroke-width="2"/>
    <rect x="62" y="49" width="12" height="12" rx="2" fill="#7dd3fc" stroke="${O}" stroke-width="2"/>
    <path d="M50 17 v-11" stroke="${O}" stroke-width="3" stroke-linecap="round"/>
    <path d="M50 6 h15 v10 h-15" fill="#22c55e" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;

  /* ---------- البالونات (الألوان) ---------- */
  function balloon(hex) {
    return `
      <ellipse cx="50" cy="43" rx="26" ry="32" fill="${hex}" stroke="${O}" stroke-width="2.5"/>
      <path d="M50 75 l-5 8 h10 z" fill="${hex}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 83 q7 9 -2 14" stroke="#94a3b8" stroke-width="2.5" fill="none"/>
      <path d="M36 31 q6 -9 15 -9" stroke="#fff" stroke-width="5" opacity=".65" fill="none" stroke-linecap="round"/>`;
  }

  const BALLOON_COLORS = {
    red: "#ef4444", blue: "#3b82f6", yellow: "#fde047",
    green: "#22c55e", orange: "#f97316", pink: "#ec4899"
  };

  /* ---------- الأرقام والحروف (نص كبير) ---------- */
  const AR_NUM = { "1": "١", "2": "٢", "3": "٣", "4": "٤", "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩", "10": "١٠" };

  function textArt(txt, color) {
    return `
      <rect x="5" y="5" width="90" height="90" rx="20" fill="#ffffff" stroke="${color}" stroke-width="5"/>
      <text x="50" y="54" text-anchor="middle" dominant-baseline="central" font-size="54"
        font-weight="800" fill="${color}" font-family="Tahoma, 'Segoe UI', sans-serif">${txt}</text>`;
  }

  const MAP = {
    cat, dog, bird, fish, rabbit, lion, elephant, duck, frog, bee,
    apple, banana, orange, grapes, strawberry, watermelon,
    grape: grapes,
    circle: circleS, square: squareS, triangle: triangleS, rect: rectS, star: starS,
    mom, dad, brother, sister,
    house, tree, sun, moon, book, school
  };

  function get(key) {
    if (!key) key = "";
    if (key.startsWith("grid:")) {
      /* صفّ حروف متباعدة — للتمييز: «من المختلف؟» */
      const chars = key.slice(5).split(",").map(s => s.trim()).filter(Boolean);
      const n = Math.max(1, chars.length);
      const each = 100 / n;
      const cells = chars.map((c, i) =>
        `<text x="${(each * i + each / 2).toFixed(1)}" y="54" text-anchor="middle" dominant-baseline="central"
           font-size="${Math.min(46, Math.round(each * 0.66))}" font-weight="800" fill="#7c3aed"
           font-family="Tahoma, 'Segoe UI', sans-serif">${c}</text>`).join("");
      const div = chars.slice(1).map((_, i) =>
        `<line x1="${(each * (i + 1)).toFixed(1)}" y1="16" x2="${(each * (i + 1)).toFixed(1)}" y2="84"
           stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>`).join("");
      return wrap(`<rect x="4" y="4" width="92" height="92" rx="16" fill="#ffffff" stroke="#c7d2fe" stroke-width="4"/>${div}${cells}`);
    }
    if (key.startsWith("balloon_")) {
      const c = BALLOON_COLORS[key.slice(8)] || "#94a3b8";
      return wrap(balloon(c));
    }
    if (key.startsWith("num_")) {
      const d = key.slice(4);
      return wrap(textArt(AR_NUM[d] || d, "#4f46e5"));
    }
    if (key.startsWith("letter_")) {
      return wrap(textArt(key.slice(7), "#7c3aed"));
    }
    return wrap(MAP[key] || '<circle cx="50" cy="50" r="30" fill="#cbd5e1" stroke="#1f2937" stroke-width="2.5"/>');
  }

  const has = k =>
    !!k && (!!MAP[k] || k.startsWith("grid:") || k.startsWith("balloon_") ||
            k.startsWith("num_") || k.startsWith("letter_"));

  return { get, has };
})();
