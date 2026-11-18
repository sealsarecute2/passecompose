document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "mesVerbesMastered_v1";
  let masteredIds = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));

  function saveMastery() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...masteredIds]));
    updateProgressUI();
    renderVerbGrid();
  }

  function toggleMastered(id) {
    if (masteredIds.has(id)) {
      masteredIds.delete(id);
    } else {
      masteredIds.add(id);
    }
    saveMastery();
  }

  // --- Audio Pronunciation (Text-to-Speech) ---
  function speakFrench(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-CA";
      const voices = window.speechSynthesis.getVoices();
      const caVoice = voices.find(v => v.lang === "fr-CA" || v.lang.replace("_", "-") === "fr-CA");
      const frVoice = voices.find(v => v.lang && v.lang.startsWith("fr"));
      if (caVoice) utterance.voice = caVoice;
      else if (frVoice) utterance.voice = frVoice;
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
  }

  // --- Navigation Tabs ---
  const navButtons = document.querySelectorAll(".nav-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  function switchTab(tabName) {
    navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabName));
    tabPanels.forEach(panel => panel.classList.toggle("active", panel.id === `tab-${tabName}`));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.goto));
  });

  // --- Progress UI ---
  function updateProgressUI() {
    const count = masteredIds.size;
    const pct = Math.round((count / VERBS.length) * 100);
    document.getElementById("mastery-count").textContent = `${count} / ${VERBS.length}`;
    document.getElementById("mastery-percent").textContent = `${pct}%`;
    document.getElementById("mastery-bar").style.width = `${pct}%`;
  }

  document.getElementById("reset-progress-btn").addEventListener("click", () => {
    if (confirm("Reset your saved mastery progress for all 50 verbs?")) {
      masteredIds.clear();
      saveMastery();
    }
  });

  // --- 50 Verbs Grid & Filters ---
  let activeFilter = "all";
  let searchQuery = "";
  const verbsGrid = document.getElementById("verbs-grid");
  const searchInput = document.getElementById("verb-search");

  function getBadgeHTML(verb) {
    if (verb.reflexive) return `<span class="pill pill-reflexive">Reflexive • Être</span>`;
    if (verb.aux === "etre") return `<span class="pill pill-etre">Être</span>`;
    return `<span class="pill pill-avoir">Avoir</span>`;
  }

  function renderVerbGrid() {
    const filtered = VERBS.filter(v => {
      if (activeFilter === "avoir" && v.aux !== "avoir") return false;
      if (activeFilter === "etre" && (v.aux !== "etre" || v.reflexive)) return false;
      if (activeFilter === "reflexive" && !v.reflexive) return false;
      if (activeFilter === "starred" && !v.starred) return false;
      if (activeFilter === "unmastered" && masteredIds.has(v.id)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.infinitive.toLowerCase().includes(q) ||
          v.english.toLowerCase().includes(q) ||
          v.pp.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (filtered.length === 0) {
      verbsGrid.innerHTML = `<p>No verbs match your search/filter.</p>`;
      return;
    }

    verbsGrid.innerHTML = filtered.map(v => {
      const isMastered = masteredIds.has(v.id);
      return `
        <div class="verb-card ${isMastered ? "is-mastered" : ""}" data-verb-id="${v.id}">
          <div>
            <div class="verb-card-top">
              <span class="verb-num">#${v.id}</span>
              <div>
                ${v.starred ? `<span class="pill pill-star">*</span>` : ""}
                ${getBadgeHTML(v)}
              </div>
            </div>
            <h3>${formatVerbTitle(v)}</h3>
            <p class="verb-eng">${v.english}</p>
          </div>
          <div class="verb-pp-line">
            <span>PP: <strong>${v.pp}</strong>${v.aux === "etre" ? "(e)(s)" : ""}</span>
            <span>${isMastered ? "✅" : "→"}</span>
          </div>
        </div>
      `;
    }).join("");

    verbsGrid.querySelectorAll(".verb-card").forEach(card => {
      card.addEventListener("click", () => openVerbModal(Number(card.dataset.verbId)));
    });
  }

  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    renderVerbGrid();
  });

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderVerbGrid();
    });
  });

  // --- Verb Detail Modal ---
  const modal = document.getElementById("verb-modal");
  let currentModalVerbId = null;

  function openVerbModal(verbId) {
    const v = VERBS.find(item => item.id === verbId);
    if (!v) return;
    currentModalVerbId = v.id;

    document.getElementById("modal-badges").innerHTML = `
      ${getBadgeHTML(v)}
      ${v.starred ? `<span class="pill pill-star">Verbe Étoilé *</span>` : ""}
      ${v.impersonal ? `<span class="pill pill-star">Impersonal (Il only)</span>` : ""}
    `;
    document.getElementById("modal-title").textContent = formatVerbTitle(v);
    document.getElementById("modal-english").textContent = v.english;
    document.getElementById("modal-pp").textContent = v.pp;

    const noteEl = document.getElementById("modal-agreement-note");
    if (v.impersonal) {
      noteEl.textContent = "Impersonal verb: only conjugates with 'Il' (singular masculine).";
    } else if (v.aux === "etre") {
      const mPl = getAgreedParticiple(v, false, true);
      noteEl.textContent = `Agrees with subject: ${v.pp} (m.s.) • ${v.pp}e (f.s.) • ${mPl} (m.pl.) • ${v.pp}es (f.pl.)`;
    } else {
      noteEl.textContent = "Uses Avoir: past participle does NOT change to match the subject.";
    }

    const tbody = document.getElementById("modal-conj-tbody");
    if (v.impersonal) {
      tbody.innerHTML = `<tr><td>Il (impersonnel)</td><td><strong>Il a ${v.pp}</strong></td></tr>`;
    } else {
      const modalRows = [
        { label: "Je", forms: v.aux === "etre" ? `${conjugatePasséComposé(v, SUBJECTS[0])} (e)` : conjugatePasséComposé(v, SUBJECTS[0]) },
        { label: "Tu", forms: v.aux === "etre" ? `${conjugatePasséComposé(v, SUBJECTS[2])} (e)` : conjugatePasséComposé(v, SUBJECTS[2]) },
        { label: "Il / On", forms: conjugatePasséComposé(v, SUBJECTS[4]) },
        { label: "Elle", forms: conjugatePasséComposé(v, SUBJECTS[5]) },
        { label: "Nous", forms: v.aux === "etre" ? `${conjugatePasséComposé(v, SUBJECTS[6])} / ${getAgreedParticiple(v, true, true)}` : conjugatePasséComposé(v, SUBJECTS[6]) },
        { label: "Vous", forms: v.aux === "etre" ? `${conjugatePasséComposé(v, SUBJECTS[8])} (f.pl: ${getAgreedParticiple(v, true, true)})` : conjugatePasséComposé(v, SUBJECTS[8]) },
        { label: "Ils", forms: conjugatePasséComposé(v, SUBJECTS[9]) },
        { label: "Elles", forms: conjugatePasséComposé(v, SUBJECTS[10]) }
      ];
      tbody.innerHTML = modalRows.map(r => `<tr><td>${r.label}</td><td><strong>${r.forms}</strong></td></tr>`).join("");
    }

    document.getElementById("modal-ex-fr").textContent = v.exFr;
    document.getElementById("modal-ex-en").textContent = v.exEn;

    const listenBtn = document.getElementById("modal-listen-btn");
    if (listenBtn) {
      listenBtn.onclick = (e) => {
        e.stopPropagation();
        speakFrench(`${v.infinitive}. Participe passé : ${v.pp}`);
      };
    }
    const speakExBtn = document.getElementById("modal-speak-ex-btn");
    if (speakExBtn) {
      speakExBtn.onclick = (e) => {
        e.stopPropagation();
        speakFrench(v.exFr);
      };
    }

    updateModalMasterBtn();
    modal.classList.remove("hidden");
    }

  function updateModalMasterBtn() {
    const btn = document.getElementById("modal-master-btn");
    const mastered = masteredIds.has(currentModalVerbId);
    btn.textContent = mastered ? "✅ Mastered (Click to Unmark)" : "⭐ Mark as Mastered";
  }

  document.getElementById("modal-master-btn").addEventListener("click", () => {
    if (currentModalVerbId !== null) {
      toggleMastered(currentModalVerbId);
      updateModalMasterBtn();
      updateFlashcardMasterBtn();
    }
  });

  document.getElementById("modal-close").addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") modal.classList.add("hidden");
  });

  // --- Practice Sub-Navigation ---
  const modeBtns = document.querySelectorAll(".mode-btn");
  const practicePanels = document.querySelectorAll(".practice-panel");

  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      practicePanels.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`mode-${btn.dataset.mode}`).classList.add("active");
    });
  });

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- MODE 1: FLASHCARDS ---
  let fcDeck = [...VERBS];
  let fcIndex = 0;
  let fcCurrentSubj = SUBJECTS[4];
  const flashcardEl = document.getElementById("flashcard");
  const deckSelect = document.getElementById("fc-deck-select");

  function buildFlashcardDeck() {
    const mode = deckSelect.value;
    if (mode === "etre-all") fcDeck = VERBS.filter(v => v.aux === "etre");
    else if (mode === "starred") fcDeck = VERBS.filter(v => v.starred);
    else if (mode === "unmastered") fcDeck = VERBS.filter(v => !masteredIds.has(v.id));
    else fcDeck = [...VERBS];

    if (fcDeck.length === 0) fcDeck = [...VERBS];
    fcIndex = 0;
    renderFlashcard();
  }

  function renderFlashcard() {
    flashcardEl.classList.remove("flipped");
    const v = fcDeck[fcIndex];
    fcCurrentSubj = v.impersonal ? SUBJECTS[4] : randomItem(SUBJECTS);

    document.getElementById("fc-counter").textContent = `${fcIndex + 1} / ${fcDeck.length}`;
    document.getElementById("fc-badge").textContent = `Verb #${v.id}`;
    document.getElementById("fc-prompt").textContent = formatVerbTitle(v);
    document.getElementById("fc-subprompt").textContent = v.impersonal
      ? "Subject: Il (impersonal)"
      : `Subject: ${fcCurrentSubj.label}`;

    const auxBadge = document.getElementById("fc-aux-badge");
    auxBadge.className = `pill ${v.reflexive ? "pill-reflexive" : v.aux === "etre" ? "pill-etre" : "pill-avoir"}`;
    auxBadge.textContent = v.reflexive ? "Reflexive • Être" : v.aux === "etre" ? "Être" : "Avoir";

    document.getElementById("fc-answer").textContent = conjugatePasséComposé(v, fcCurrentSubj);
    document.getElementById("fc-meaning").innerHTML = `${v.english} • past participle: <strong>${v.pp}</strong>`;
    document.getElementById("fc-example").textContent = v.exFr;

    const fcListenBtn = document.getElementById("fc-listen-btn");
    if (fcListenBtn) {
      fcListenBtn.onclick = (e) => {
        e.stopPropagation();
        speakFrench(`${conjugatePasséComposé(v, fcCurrentSubj)}. ${v.exFr}`);
      };
    }

    updateFlashcardMasterBtn();
  }

  function updateFlashcardMasterBtn() {
    const v = fcDeck[fcIndex];
    if (!v) return;
    const btn = document.getElementById("fc-toggle-master");
    btn.textContent = masteredIds.has(v.id) ? "✅ Mastered" : "⭐ Mark Mastered";
  }

  flashcardEl.addEventListener("click", () => flashcardEl.classList.toggle("flipped"));
  flashcardEl.addEventListener("keydown", e => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flashcardEl.classList.toggle("flipped");
    }
  });

  document.getElementById("fc-next").addEventListener("click", () => {
    fcIndex = (fcIndex + 1) % fcDeck.length;
    renderFlashcard();
  });

  document.getElementById("fc-prev").addEventListener("click", () => {
    fcIndex = (fcIndex - 1 + fcDeck.length) % fcDeck.length;
    renderFlashcard();
  });

  document.getElementById("fc-toggle-master").addEventListener("click", () => {
    toggleMastered(fcDeck[fcIndex].id);
    updateFlashcardMasterBtn();
  });

  deckSelect.addEventListener("change", buildFlashcardDeck);

  // --- MODE 2: AVOIR OU ÊTRE SPEED SORTER ---
  let sorterVerb = null;
  let sorterScore = 0;
  let sorterStreak = 0;
  const sorterFeedback = document.getElementById("sorter-feedback");
  const sorterNextBtn = document.getElementById("sorter-next");

  function nextSorterQuestion() {
    // Weight Être/Reflexive slightly higher so students get good variety (40% Être, 60% Avoir)
    const etrePool = VERBS.filter(v => v.aux === "etre");
    const avoirPool = VERBS.filter(v => v.aux === "avoir");
    sorterVerb = Math.random() < 0.4 ? randomItem(etrePool) : randomItem(avoirPool);

    document.getElementById("sorter-verb").textContent = formatVerbTitle(sorterVerb);
    document.getElementById("sorter-english").textContent = sorterVerb.english;
    sorterFeedback.classList.add("hidden");
    sorterNextBtn.classList.add("hidden");
    document.getElementById("btn-choose-avoir").disabled = false;
    document.getElementById("btn-choose-etre").disabled = false;
  }

  function answerSorter(choice) {
    document.getElementById("btn-choose-avoir").disabled = true;
    document.getElementById("btn-choose-etre").disabled = true;

    const correct = choice === sorterVerb.aux;
    let reason = "";
    if (sorterVerb.reflexive) {
      reason = `<strong>${sorterVerb.infinitive}</strong> is a reflexive verb, so it ALWAYS takes <strong>être</strong>!`;
    } else if (sorterVerb.aux === "etre") {
      reason = `<strong>${sorterVerb.infinitive}</strong> is a DR & MRS VANDERTRAMP verb, so it takes <strong>être</strong> (e.g., <em>Elle est ${sorterVerb.pp}e</em>).`;
    } else {
      reason = `<strong>${sorterVerb.infinitive}</strong> is not reflexive or Vandertramp, so it takes <strong>avoir</strong> (e.g., <em>Il a ${sorterVerb.pp}</em>).`;
    }

    if (correct) {
      sorterScore++;
      sorterStreak++;
      sorterFeedback.className = "feedback-box ok";
      sorterFeedback.innerHTML = `✅ <strong>Bravo!</strong> ${reason}`;
    } else {
      sorterStreak = 0;
      sorterFeedback.className = "feedback-box err";
      sorterFeedback.innerHTML = `❌ <strong>Pas tout à fait!</strong> ${reason}`;
    }

    document.getElementById("sorter-score").textContent = sorterScore;
    document.getElementById("sorter-streak").textContent = sorterStreak;
    sorterFeedback.classList.remove("hidden");
    sorterNextBtn.classList.remove("hidden");
  }

  document.getElementById("btn-choose-avoir").addEventListener("click", () => answerSorter("avoir"));
  document.getElementById("btn-choose-etre").addEventListener("click", () => answerSorter("etre"));
  sorterNextBtn.addEventListener("click", nextSorterQuestion);

  // --- MODE 3: ATELIER DES ACCORDS (AGREEMENT BUILDER) ---
  let accordsScore = 0;
  let accordsStreak = 0;
  const namedSubjects = [
    { display: "Marie (f. sing.)", subj: SUBJECTS[5] },
    { display: "Sophie et Clara (f. pl.)", subj: SUBJECTS[10] },
    { display: "Marc et Luc (m. pl.)", subj: SUBJECTS[9] },
    { display: "Thomas (m. sing.)", subj: SUBJECTS[4] },
    { display: "Nous (f. pl.)", subj: SUBJECTS[7] },
    { display: "Tu (f. sing.)", subj: SUBJECTS[3] }
  ];

  function nextAccordsQuestion() {
    // 70% Être/Reflexive agreement practice, 30% Avoir trap check (no agreement!)
    const etreVerbs = VERBS.filter(v => v.aux === "etre");
    const avoirVerbs = VERBS.filter(v => v.aux === "avoir" && !v.impersonal);
    const verb = Math.random() < 0.7 ? randomItem(etreVerbs) : randomItem(avoirVerbs);
    const chosen = randomItem(namedSubjects);
    const s = chosen.subj;

    document.getElementById("accords-prompt").textContent = `${chosen.display} + ${formatVerbTitle(verb)}`;
    document.getElementById("accords-meaning").textContent = `${verb.english} (past participle: ${verb.pp})`;

    const correctForm = conjugatePasséComposé(verb, s);

    // Build 3 realistic distractors targeting common Grade 9 mistakes
    const distractors = new Set();
    if (verb.reflexive) {
      distractors.add(`${s.reflEtre} ${verb.pp}`);
      distractors.add(`${s.reflEtre} ${verb.pp}e`);
      distractors.add(`${s.reflEtre} ${verb.pp}es`);
      distractors.add(`${s.etre} ${getAgreedParticiple(verb, s.fem, s.plural)}`); // missing reflexive pronoun
      distractors.add(`${s.avoir} ${verb.pp}`);
    } else if (verb.aux === "etre") {
      distractors.add(`${s.etre} ${verb.pp}`);
      distractors.add(`${s.etre} ${verb.pp}e`);
      distractors.add(`${s.etre} ${verb.pp}s`);
      distractors.add(`${s.etre} ${verb.pp}es`);
      distractors.add(`${s.avoir} ${verb.pp}`);
    } else {
      // Avoir traps: adding feminine/plural endings or using être
      distractors.add(`${s.avoir} ${verb.pp}e`);
      distractors.add(`${s.avoir} ${verb.pp}s`);
      distractors.add(`${s.avoir} ${verb.pp}es`);
      distractors.add(`${s.etre} ${verb.pp}${s.fem ? "e" : ""}${s.plural ? "s" : ""}`);
    }
    distractors.delete(correctForm);

    const options = [correctForm, ...[...distractors].slice(0, 3)].sort(() => Math.random() - 0.5);
    const optionsEl = document.getElementById("accords-options");
    const feedbackEl = document.getElementById("accords-feedback");
    const nextBtn = document.getElementById("accords-next");

    feedbackEl.classList.add("hidden");
    nextBtn.classList.add("hidden");

    optionsEl.innerHTML = options.map(opt => `<button class="option-choice">${opt}</button>`).join("");

    optionsEl.querySelectorAll(".option-choice").forEach(btn => {
      btn.addEventListener("click", () => {
        optionsEl.querySelectorAll(".option-choice").forEach(b => {
          b.disabled = true;
          if (b.textContent === correctForm) b.classList.add("correct");
        });

        let ruleNote = "";
        if (verb.aux === "avoir") {
          ruleNote = `<strong>${verb.infinitive}</strong> uses <strong>avoir</strong>, so NEVER add <em>-e</em> or <em>-s</em> for the subject! Answer: <strong>${correctForm}</strong>.`;
        } else if (verb.pp.endsWith("s") && !s.fem && s.plural) {
          ruleNote = `<strong>${verb.pp}</strong> already ends in <strong>-s</strong>, so masculine plural stays <strong>${verb.pp}</strong>! Answer: <strong>${correctForm}</strong>.`;
        } else {
          ruleNote = `With <strong>être</strong>${verb.reflexive ? " (reflexive)" : ""}, agree with <em>${chosen.display}</em> → <strong>${correctForm}</strong>.`;
        }

        if (btn.textContent === correctForm) {
          accordsScore++;
          accordsStreak++;
          feedbackEl.className = "feedback-box ok";
          feedbackEl.innerHTML = `✅ <strong>Exactement!</strong> ${ruleNote}`;
        } else {
          btn.classList.add("wrong");
          accordsStreak = 0;
          feedbackEl.className = "feedback-box err";
          feedbackEl.innerHTML = `❌ <strong>Attention!</strong> ${ruleNote}`;
        }

        document.getElementById("accords-score").textContent = accordsScore;
        document.getElementById("accords-streak").textContent = accordsStreak;
        feedbackEl.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
      });
    });
  }

  document.getElementById("accords-next").addEventListener("click", nextAccordsQuestion);

  // --- MODE 4: QUIZ TAPÉ ---
  let quizRound = [];
  let quizIdx = 0;
  let quizScore = 0;
  let quizAnswered = false;

  const quizInput = document.getElementById("quiz-input");
  const quizFeedback = document.getElementById("quiz-feedback");
  const quizNextBtn = document.getElementById("quiz-next");
  const quizSubmitBtn = document.getElementById("quiz-submit");
  const quizLengthSelect = document.getElementById("quiz-length-select");

  if (quizLengthSelect) {
    quizLengthSelect.addEventListener("change", startNewQuiz);
  }

  function startNewQuiz() {
    const qCount = quizLengthSelect ? parseInt(quizLengthSelect.value, 10) : 10;
    const shuffled = [...VERBS].sort(() => Math.random() - 0.5).slice(0, qCount);
    quizRound = shuffled.map(v => ({
      verb: v,
      subj: v.impersonal ? SUBJECTS[4] : randomItem(SUBJECTS)
    }));
    quizIdx = 0;
    quizScore = 0;
    document.getElementById("quiz-summary").classList.add("hidden");
    document.getElementById("quiz-active-area").classList.remove("hidden");
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    quizAnswered = false;
    const item = quizRound[quizIdx];
    document.getElementById("quiz-qnum").textContent = `${quizIdx + 1} / ${quizRound.length}`;
    document.getElementById("quiz-score").textContent = quizScore;

    const subjText = item.verb.impersonal ? "Il (impersonnel)" : item.subj.label;
    document.getElementById("quiz-prompt").textContent = `${subjText} + ${formatVerbTitle(item.verb)}`;
    document.getElementById("quiz-hint").textContent = `Meaning: ${item.verb.english}`;

    quizInput.value = "";
    quizInput.disabled = false;
    quizSubmitBtn.disabled = false;
    quizFeedback.classList.add("hidden");
    quizNextBtn.classList.add("hidden");
    quizInput.focus();
  }

  function normalizeAnswer(str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ");
  }

  document.getElementById("quiz-form").addEventListener("submit", e => {
    e.preventDefault();
    if (quizAnswered) return;
    quizAnswered = true;

    const item = quizRound[quizIdx];
    const expected = conjugatePasséComposé(item.verb, item.subj);
    const userVal = normalizeAnswer(quizInput.value);

    quizInput.disabled = true;
    quizSubmitBtn.disabled = true;

    if (userVal === normalizeAnswer(expected)) {
      quizScore++;
      document.getElementById("quiz-score").textContent = quizScore;
      quizFeedback.className = "feedback-box ok";
      quizFeedback.innerHTML = `✅ <strong>Super!</strong> <em>${expected}</em>`;
    } else {
      quizFeedback.className = "feedback-box err";
      quizFeedback.innerHTML = `❌ <strong>Bonne réponse :</strong> <em>${expected}</em>`;
    }

    quizFeedback.classList.remove("hidden");
    quizNextBtn.textContent = quizIdx === quizRound.length - 1 ? "See Final Score →" : "Next Question →";
    quizNextBtn.classList.remove("hidden");
    quizNextBtn.focus();
  });

  quizNextBtn.addEventListener("click", () => {
    quizIdx++;
    if (quizIdx >= quizRound.length) {
      document.getElementById("quiz-active-area").classList.add("hidden");
      document.getElementById("quiz-summary").classList.remove("hidden");
      document.getElementById("quiz-final-score").textContent = `${quizScore} / ${quizRound.length}`;
      document.getElementById("quiz-final-msg").textContent =
        quizScore >= 9 ? "Incroyable! Tu es un chef du passé composé! 🥐" :
        quizScore >= 7 ? "Très bon travail! Continue comme ça! 🎉" :
        "Bon effort! Révise les leçons et réessaie! 💪";
    } else {
      renderQuizQuestion();
    }
  });

  document.getElementById("quiz-restart").addEventListener("click", startNewQuiz);
  document.getElementById("quiz-play-again").addEventListener("click", startNewQuiz);

  // Accent bar character insertion
  document.querySelectorAll(".accent-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (quizInput.disabled) return;
      const char = btn.dataset.char;
      const start = quizInput.selectionStart;
      const end = quizInput.selectionEnd;
      const val = quizInput.value;
      quizInput.value = val.slice(0, start) + char + val.slice(end);
      quizInput.focus();
      quizInput.setSelectionRange(start + char.length, start + char.length);
    });
  });

  // --- MODE 5: SPEED BLITZ CHALLENGE (60s) ---
  const BLITZ_STORAGE_KEY = "mesVerbesBlitzHighScore";
  let blitzHighScore = parseInt(localStorage.getItem(BLITZ_STORAGE_KEY) || "0", 10);
  let blitzScore = 0;
  let blitzStreak = 0;
  let blitzTimeLeft = 60;
  let blitzTimerId = null;

  const blitzTimerEl = document.getElementById("blitz-timer");
  const blitzScoreEl = document.getElementById("blitz-score");
  const blitzStreakEl = document.getElementById("blitz-streak");
  const blitzHighScoreEl = document.getElementById("blitz-highscore");
  const blitzTimerBar = document.getElementById("blitz-timer-bar");
  const blitzStartScreen = document.getElementById("blitz-start-screen");
  const blitzActiveScreen = document.getElementById("blitz-active-screen");
  const blitzSummary = document.getElementById("blitz-summary");
  const blitzStartBtn = document.getElementById("blitz-start-btn");
  const blitzPlayAgainBtn = document.getElementById("blitz-play-again");
  const blitzOptionsEl = document.getElementById("blitz-options");
  const blitzPromptEl = document.getElementById("blitz-prompt");
  const blitzHintEl = document.getElementById("blitz-hint");
  const blitzFinalScoreEl = document.getElementById("blitz-final-score");
  const blitzSummaryMsgEl = document.getElementById("blitz-summary-msg");
  const blitzRecordBadge = document.getElementById("blitz-record-badge");

  if (blitzHighScoreEl) blitzHighScoreEl.textContent = blitzHighScore;
  if (blitzStartBtn) blitzStartBtn.addEventListener("click", startBlitzGame);
  if (blitzPlayAgainBtn) blitzPlayAgainBtn.addEventListener("click", startBlitzGame);

  function startBlitzGame() {
    blitzScore = 0;
    blitzStreak = 0;
    blitzTimeLeft = 60;
    if (blitzScoreEl) blitzScoreEl.textContent = "0";
    if (blitzStreakEl) blitzStreakEl.textContent = "0";
    if (blitzTimerEl) blitzTimerEl.textContent = "60s";
    if (blitzTimerBar) blitzTimerBar.style.width = "100%";

    if (blitzStartScreen) blitzStartScreen.classList.add("hidden");
    if (blitzSummary) blitzSummary.classList.add("hidden");
    if (blitzActiveScreen) blitzActiveScreen.classList.remove("hidden");

    clearInterval(blitzTimerId);
    blitzTimerId = setInterval(blitzTick, 1000);

    nextBlitzQuestion();
  }

  function blitzTick() {
    blitzTimeLeft--;
    if (blitzTimerEl) blitzTimerEl.textContent = `${blitzTimeLeft}s`;
    const pct = Math.max(0, (blitzTimeLeft / 60) * 100);
    if (blitzTimerBar) blitzTimerBar.style.width = `${pct}%`;

    if (blitzTimeLeft <= 0) {
      endBlitzGame();
    }
  }

  function endBlitzGame() {
    clearInterval(blitzTimerId);
    if (blitzActiveScreen) blitzActiveScreen.classList.add("hidden");
    if (blitzSummary) blitzSummary.classList.remove("hidden");
    if (blitzFinalScoreEl) blitzFinalScoreEl.textContent = blitzScore;

    let isNewHigh = false;
    if (blitzScore > blitzHighScore) {
      blitzHighScore = blitzScore;
      localStorage.setItem(BLITZ_STORAGE_KEY, blitzHighScore.toString());
      if (blitzHighScoreEl) blitzHighScoreEl.textContent = blitzHighScore;
      isNewHigh = true;
    }

    if (blitzRecordBadge) blitzRecordBadge.classList.toggle("hidden", !isNewHigh);

    if (blitzSummaryMsgEl) {
      if (blitzScore >= 25) {
        blitzSummaryMsgEl.textContent = "⚡ Fantastique! Vitesse olympique digne du Tour de France! 🚲🥖";
      } else if (blitzScore >= 15) {
        blitzSummaryMsgEl.textContent = "Bravo! Excellents réflexes sur le passé composé!";
      } else if (blitzScore >= 8) {
        blitzSummaryMsgEl.textContent = "Bon travail! Continue de pratiquer pour booster ta vitesse.";
      } else {
        blitzSummaryMsgEl.textContent = "Bon premier essai! Révise les leçons et réessaie pour battre ton score.";
      }
    }
  }

  function nextBlitzQuestion() {
    const v = randomItem(VERBS);
    const s = v.impersonal ? SUBJECTS[4] : randomItem(SUBJECTS);

    const correct = conjugatePasséComposé(v, s);
    const subjLabel = v.impersonal ? "Il (impersonnel)" : s.label;
    if (blitzPromptEl) blitzPromptEl.textContent = `${subjLabel} + ${formatVerbTitle(v)}`;
    if (blitzHintEl) blitzHintEl.textContent = `${v.english} • (${v.aux === "etre" ? "être" : "avoir"})`;

    const pool = new Set();
    if (v.reflexive) {
      pool.add(`${s.reflEtre} ${v.pp}`);
      pool.add(`${s.reflEtre} ${v.pp}e`);
      pool.add(`${s.reflEtre} ${v.pp}es`);
      pool.add(`${s.avoir} ${v.pp}`);
      pool.add(`${s.etre} ${getAgreedParticiple(v, s.fem, s.plural)}`);
    } else if (v.aux === "etre") {
      pool.add(`${s.etre} ${v.pp}`);
      pool.add(`${s.etre} ${v.pp}e`);
      pool.add(`${s.etre} ${v.pp}s`);
      pool.add(`${s.etre} ${v.pp}es`);
      pool.add(`${s.avoir} ${v.pp}`);
    } else {
      pool.add(`${s.avoir} ${v.pp}e`);
      pool.add(`${s.avoir} ${v.pp}s`);
      pool.add(`${s.avoir} ${v.pp}es`);
      pool.add(`${s.etre} ${v.pp}${s.fem ? "e" : ""}${s.plural ? "s" : ""}`);
    }
    pool.delete(correct);

    const choices = [correct, ...[...pool].slice(0, 3)].sort(() => Math.random() - 0.5);

    if (blitzOptionsEl) {
      blitzOptionsEl.innerHTML = choices.map(opt => `
        <button class="blitz-choice-btn">${opt}</button>
      `).join("");

      blitzOptionsEl.querySelectorAll(".blitz-choice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          blitzOptionsEl.querySelectorAll(".blitz-choice-btn").forEach(b => b.disabled = true);
          if (btn.textContent === correct) {
            blitzScore++;
            blitzStreak++;
            btn.classList.add("flash-correct");
          } else {
            blitzStreak = 0;
            btn.classList.add("flash-wrong");
            blitzOptionsEl.querySelectorAll(".blitz-choice-btn").forEach(b => {
              if (b.textContent === correct) b.classList.add("flash-correct");
            });
          }
          if (blitzScoreEl) blitzScoreEl.textContent = blitzScore;
          if (blitzStreakEl) blitzStreakEl.textContent = blitzStreak;

          setTimeout(() => {
            if (blitzTimeLeft > 0) nextBlitzQuestion();
          }, 200);
        });
      });
    }
  }

  // --- Initialize App ---
  updateProgressUI();
  renderVerbGrid();
  buildFlashcardDeck();
  nextSorterQuestion();
  nextAccordsQuestion();
  startNewQuiz();
});
