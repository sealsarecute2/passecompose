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
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.goto);
      if (btn.dataset.rush) {
        const rushBtn = document.querySelector(".mode-btn[data-mode='rush']");
        if (rushBtn) rushBtn.click();
      }
    });
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


  // =========================================
  // --- MODE: LE BISTRO RUSH SIMULATION ---
  // =========================================

  // Web Audio Synthesizer
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playBellChime() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      [880, 1760, 3520].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        const amp = idx === 0 ? 0.3 : idx === 1 ? 0.15 : 0.06;
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx === 0 ? 1.4 : 0.8));
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.4);
      });
    } catch (e) {
      console.warn("Audio bell error:", e);
    }
  }

  function playPlateClack() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.warn("Audio clack error:", e);
    }
  }

  function playCheerChime() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.65);
      });
    } catch (e) {
      console.warn("Audio cheer error:", e);
    }
  }

  function playErrorMurmur() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      console.warn("Audio error error:", e);
    }
  }

  const RUSH_SHIFTS = [
    {
      id: 1,
      title: "Service 1 : Le Matin (Petit-Déjeuner)",
      orders: [
        {
          table: "TABLE 1",
          time: "08h15",
          guest: "« Un étudiant pressé s'arrête au comptoir avant son cours : »",
          subject: "Marc",
          verbInfinitive: "boire",
          object: "un bon café au lait.",
          meaning: "to drink (avoir)",
          correctAux: "a",
          correctPP: "bu",
          auxOptions: ["a", "est", "as", "ont"],
          ppOptions: ["bu", "bue", "bus", "bois"],
          explanation: "<strong>Boire</strong> utilise l'auxiliaire <strong>avoir</strong> (Marc <strong>a</strong>) et son participe passé irrégulier est <strong>bu</strong>. Pas d'accord avec le sujet !"
        },
        {
          table: "TABLE 2",
          time: "08h45",
          guest: "« Une famille nombreuse s'installe pour le brunch : »",
          subject: "Les enfants (m. pl.)",
          verbInfinitive: "manger",
          object: "des croissants chauds au beurre.",
          meaning: "to eat (avoir)",
          correctAux: "ont",
          correctPP: "mangé",
          auxOptions: ["ont", "sont", "avons", "a"],
          ppOptions: ["mangé", "mangée", "mangés", "manger"],
          explanation: "Règle d'or du passé composé : avec <strong>avoir</strong>, le participe passé (<strong>mangé</strong>) ne s'accorde JAMAIS avec le sujet, même s'il est pluriel !"
        },
        {
          table: "TABLE 3",
          time: "09h05",
          guest: "« Le serveur crie la commande vers la cuisine : »",
          subject: "La serveuse",
          verbInfinitive: "prendre",
          object: "la commande de la terrasse.",
          meaning: "to take (avoir)",
          correctAux: "a",
          correctPP: "pris",
          auxOptions: ["a", "est", "ont", "s'est"],
          ppOptions: ["pris", "prise", "prit", "prendu"],
          explanation: "<strong>Prendre</strong> fait <strong>a pris</strong> au passé composé avec l'auxiliaire avoir."
        },
        {
          table: "TABLE 4",
          time: "09h30",
          guest: "« Les habitués de la cabane à sucre commandent : »",
          subject: "Nous",
          verbInfinitive: "vouloir",
          object: "du sirop d'érable avec nos crêpes.",
          meaning: "to want (avoir)",
          correctAux: "avons",
          correctPP: "voulu",
          auxOptions: ["avons", "sommes", "avez", "ont"],
          ppOptions: ["voulu", "voulus", "voulue", "voulut"],
          explanation: "<strong>Vouloir</strong> se conjugue avec <strong>avoir</strong> : <em>Nous avons voulu</em>. Aucun accord en nombre ou en genre !"
        },
        {
          table: "TABLE 5",
          time: "10h00",
          guest: "« Ton collègue commis rentre du marché matinal : »",
          subject: "Tu",
          verbInfinitive: "acheter",
          object: "des bagels frais ce matin.",
          meaning: "to buy (avoir)",
          correctAux: "as",
          correctPP: "acheté",
          auxOptions: ["as", "es", "a", "avez"],
          ppOptions: ["acheté", "achetée", "achetés", "achète"],
          explanation: "Verbe régulier en -er : <em>Tu as acheté</em>. L'auxiliaire est <strong>avoir</strong>."
        },
        {
          table: "TABLE 6",
          time: "10h30",
          guest: "« Le chef boulanger sort ses créations dorées : »",
          subject: "Le chef",
          verbInfinitive: "faire",
          object: "des baguettes bien croustillantes.",
          meaning: "to make / do (avoir)",
          correctAux: "a",
          correctPP: "fait",
          auxOptions: ["a", "est", "ont", "s'est"],
          ppOptions: ["fait", "faite", "faits", "faisez"],
          explanation: "<strong>Faire</strong> fait <strong>a fait</strong> au passé composé avec l'auxiliaire avoir."
        }
      ]
    },
    {
      id: 2,
      title: "Service 2 : Le Midi (Déjeuner)",
      orders: [
        {
          table: "TABLE 7",
          time: "12h10",
          guest: "« Une cliente pressée s'en va rapidement : »",
          subject: "Sophie (f. sing.)",
          verbInfinitive: "partir",
          object: "sans son parapluie.",
          meaning: "to leave (DR & MRS VANDERTRAMP)",
          correctAux: "est",
          correctPP: "partie",
          auxOptions: ["est", "a", "s'est", "sont"],
          ppOptions: ["partie", "parti", "parties", "partis"],
          explanation: "<strong>Partir</strong> est un verbe de mouvement (DR & MRS VANDERTRAMP) : auxiliaire <strong>être</strong> + accord obligatoire avec Sophie (fém. sing. = <em>-e</em>) !"
        },
        {
          table: "TABLE 8",
          time: "12h35",
          guest: "« Mes cousins de Gatineau arrivent au bistro : »",
          subject: "Mes cousins (m. pl.)",
          verbInfinitive: "venir",
          object: "dîner sur la terrasse du bistro.",
          meaning: "to come (DR & MRS VANDERTRAMP)",
          correctAux: "sont",
          correctPP: "venus",
          auxOptions: ["sont", "ont", "sommes", "est"],
          ppOptions: ["venus", "venu", "venues", "venue"],
          explanation: "<strong>Venir</strong> se conjugue avec <strong>être</strong> et s'accorde au masculin pluriel (<em>-s</em>) : <em>Mes cousins sont venus</em>."
        },
        {
          table: "TABLE 9",
          time: "13h00",
          guest: "« Deux voyageuses terminent leur déjeuner gourmand : »",
          subject: "Les clientes (f. pl.)",
          verbInfinitive: "aller",
          object: "au festival après le repas.",
          meaning: "to go (DR & MRS VANDERTRAMP)",
          correctAux: "sont",
          correctPP: "allées",
          auxOptions: ["sont", "ont", "sommes", "est"],
          ppOptions: ["allées", "allé", "allée", "allés"],
          explanation: "<strong>Aller</strong> prend <strong>être</strong> et s'accorde avec le sujet féminin pluriel (<em>-es</em>) : <em>Elles sont allées</em>."
        },
        {
          table: "TABLE 10",
          time: "13h20",
          guest: "« Lucas quitte sa table pour féliciter la brigade : »",
          subject: "Lucas (m. sing.)",
          verbInfinitive: "sortir",
          object: "saluer le chef en cuisine.",
          meaning: "to go out (DR & MRS VANDERTRAMP)",
          correctAux: "est",
          correctPP: "sorti",
          auxOptions: ["est", "a", "s'est", "sont"],
          ppOptions: ["sorti", "sortie", "sortis", "sorties"],
          explanation: "<strong>Sortir</strong> (DR & MRS VANDERTRAMP) prend <strong>être</strong> : <em>Lucas est sorti</em> (masculin singulier)."
        },
        {
          table: "TABLE 11",
          time: "13h45",
          guest: "« Notre cliente fidèle fête son anniversaire au restaurant : »",
          subject: "Elle (f. sing.)",
          verbInfinitive: "devenir",
          object: "notre cliente la plus fidèle.",
          meaning: "to become (DR & MRS VANDERTRAMP)",
          correctAux: "est",
          correctPP: "devenue",
          auxOptions: ["est", "a", "s'est", "sont"],
          ppOptions: ["devenue", "devenu", "devenues", "devenus"],
          explanation: "<strong>Devenir</strong> (changement d'état) prend <strong>être</strong> avec accord au féminin singulier (<em>-e</em>) : <em>Elle est devenue</em>."
        },
        {
          table: "TABLE 12",
          time: "14h15",
          guest: "« Attention au piège du midi ! Le gérant prépare la terrasse : »",
          subject: "Le gérant",
          verbInfinitive: "ouvrir",
          object: "la grande baie vitrée ensoleillée.",
          meaning: "to open (Attention : Avoir !)",
          correctAux: "a",
          correctPP: "ouvert",
          auxOptions: ["a", "est", "s'est", "ont"],
          ppOptions: ["ouvert", "ouverte", "ouverts", "ouvertes"],
          explanation: "Attention au piège classique ! <strong>Ouvrir</strong> n'est PAS un verbe de mouvement VANDERTRAMP. Il prend <strong>avoir</strong> (<em>a ouvert</em>), donc aucun accord !"
        }
      ]
    },
    {
      id: 3,
      title: "Service 3 : Le Soir (Le Coup de Feu)",
      orders: [
        {
          table: "TABLE 13",
          time: "18h30",
          guest: "« Les premiers convives de la soirée prennent place : »",
          subject: "Les invités (m. pl.)",
          verbInfinitive: "s'asseoir",
          object: "près de la cheminée.",
          meaning: "to sit down (Réflexif • Être)",
          correctAux: "se sont",
          correctPP: "assis",
          auxOptions: ["se sont", "ont", "sont", "s'ont"],
          ppOptions: ["assis", "assise", "assises", "assit"],
          explanation: "<strong>S'asseoir</strong> est pronominal (100% <strong>être</strong>). Au masculin pluriel, comme <em>assis</em> se termine déjà par un -s, on ne rajoute RIEN : <em>se sont assis</em> !"
        },
        {
          table: "TABLE 14",
          time: "19h15",
          guest: "« Deux amies d'enfance s'assoient au comptoir : »",
          subject: "Marie et Clara (f. pl.)",
          verbInfinitive: "s'asseoir",
          object: "au comptoir du chef.",
          meaning: "to sit down (Réflexif féminin pluriel)",
          correctAux: "se sont",
          correctPP: "assises",
          auxOptions: ["se sont", "sont", "ont", "s'ont"],
          ppOptions: ["assises", "assis", "assise", "assisez"],
          explanation: "Pour le féminin pluriel, <em>assis</em> prend le féminin <em>-e</em> puis le pluriel <em>-s</em> : <strong>Marie et Clara se sont assises</strong> !"
        },
        {
          table: "TABLE 15",
          time: "20h00",
          guest: "« La musique en direct commence dans la salle : »",
          subject: "Tous les clients (m. pl.)",
          verbInfinitive: "se taire*",
          object: "pour écouter le pianiste.",
          meaning: "to be quiet (Verbe étoilé * • Réflexif)",
          correctAux: "se sont",
          correctPP: "tus",
          auxOptions: ["se sont", "sont", "ont", "se ont"],
          ppOptions: ["tus", "tu", "tue", "tues"],
          explanation: "Verbe étoilé ! <strong>Se taire*</strong> est réflexif (auxiliaire être) et son participe passé est <em>tu</em>. Au masculin pluriel : <em>Ils se sont tus</em> !"
        },
        {
          table: "TABLE 16",
          time: "20h45",
          guest: "« L'artiste du quartier décore notre panneau : »",
          subject: "L'artiste",
          verbInfinitive: "peindre",
          object: "le menu du soir sur l'ardoise.",
          meaning: "to paint (avoir)",
          correctAux: "a",
          correctPP: "peint",
          auxOptions: ["a", "est", "s'est", "ont"],
          ppOptions: ["peint", "peinte", "peints", "peignit"],
          explanation: "<strong>Peindre</strong> prend l'auxiliaire <strong>avoir</strong> et son participe passé est <strong>peint</strong> (terminaison en -t). Pas d'accord avec le sujet."
        },
        {
          table: "TABLE 17",
          time: "21h15",
          guest: "« La table d'honneur commande le plat traditionnel : »",
          subject: "Le chef",
          verbInfinitive: "cuire",
          object: "une magnifique tourtière québécoise.",
          meaning: "to cook / bake (avoir)",
          correctAux: "a",
          correctPP: "cuit",
          auxOptions: ["a", "est", "ont", "s'est"],
          ppOptions: ["cuit", "cuite", "cuits", "cuisez"],
          explanation: "<strong>Cuire</strong> prend l'auxiliaire avoir : <em>Le chef a cuit</em> (participe passé en -t). Pas d'accord avec le sujet !"
        },
        {
          table: "TABLE 18",
          time: "21h45",
          guest: "« Dernière commande pour le dessert spécial de la maison : »",
          subject: "Nous",
          verbInfinitive: "cueillir*",
          object: "des pommes fraîches pour la tarte.",
          meaning: "to pick / gather (Verbe étoilé * • Avoir)",
          correctAux: "avons",
          correctPP: "cueilli",
          auxOptions: ["avons", "sommes", "avez", "ont"],
          ppOptions: ["cueilli", "cueillis", "cueillie", "cueillu"],
          explanation: "Verbe étoilé ! <strong>Cueillir*</strong> prend <strong>avoir</strong> et se termine en <strong>-i</strong> (<em>cueilli</em>). Pas d'accord au pluriel avec le sujet !"
        }
      ]
    }
  ];

  const CROISSANTS_STORAGE_KEY = "bistroRushCroissants";
  let rushCroissants = parseInt(localStorage.getItem(CROISSANTS_STORAGE_KEY) || "0", 10);
  let rushCurrentShiftId = 1;
  let rushOrderIdx = 0;
  let rushShiftScore = 0;
  let selectedAux = null;
  let selectedPP = null;

  function getChefRank(tips) {
    if (tips >= 40) return "Chef Étoilé du Café 🌟";
    if (tips >= 25) return "Sous-Chef du Bistro ⭐";
    if (tips >= 15) return "Chef de Partie 🍳";
    if (tips >= 6) return "Commis de Cuisine 🥐";
    return "Plongeur du Bistro 🫧";
  }

  function updateRushStatsUI() {
    const rank = getChefRank(rushCroissants);
    const countEl = document.getElementById("rush-croissants-count");
    const rankEl = document.getElementById("rush-chef-rank");
    const homeTipsEl = document.getElementById("home-rush-tips");
    const homeRankEl = document.getElementById("home-rush-rank");

    if (countEl) countEl.textContent = rushCroissants;
    if (rankEl) rankEl.textContent = rank;
    if (homeTipsEl) homeTipsEl.textContent = rushCroissants;
    if (homeRankEl) homeRankEl.textContent = rank;
  }

  function saveRushTips(add) {
    rushCroissants += add;
    localStorage.setItem(CROISSANTS_STORAGE_KEY, rushCroissants.toString());
    updateRushStatsUI();
  }

  function getCurrentShift() {
    return RUSH_SHIFTS.find(s => s.id === rushCurrentShiftId) || RUSH_SHIFTS[0];
  }

  function getCurrentOrder() {
    const shift = getCurrentShift();
    return shift.orders[rushOrderIdx];
  }

  function loadRushOrder(idx) {
    const shift = getCurrentShift();
    rushOrderIdx = idx;
    const order = shift.orders[rushOrderIdx];
    if (!order) return;

    selectedAux = null;
    selectedPP = null;

    document.getElementById("rush-order-num").textContent = `${rushOrderIdx + 1} / ${shift.orders.length}`;
    document.getElementById("ticket-table-name").textContent = order.table;
    document.getElementById("ticket-time-stamp").textContent = `Service de ${order.time}`;
    document.getElementById("ticket-client-quote").textContent = order.guest;
    document.getElementById("ticket-prompt").textContent = `${order.subject} + ${order.verbInfinitive.toUpperCase()}`;
    document.getElementById("ticket-meaning").textContent = order.meaning;

    document.getElementById("plate-subject").textContent = order.subject;
    document.getElementById("plate-object").textContent = order.object;

    const slotAux = document.getElementById("slot-aux");
    slotAux.className = "ingredient-slot slot-empty";
    slotAux.querySelector(".slot-placeholder").style.display = "inline";
    slotAux.querySelector(".slot-val").textContent = "";

    const slotPP = document.getElementById("slot-pp");
    slotPP.className = "ingredient-slot slot-empty";
    slotPP.querySelector(".slot-placeholder").style.display = "inline";
    slotPP.querySelector(".slot-val").textContent = "";

    const shelfAux = document.getElementById("shelf-aux-items");
    const shuffledAux = [...order.auxOptions].sort(() => Math.random() - 0.5);
    shelfAux.innerHTML = shuffledAux.map(opt => `
      <button class="shelf-btn" data-type="aux" data-val="${opt}">${opt}</button>
    `).join("");

    const shelfPP = document.getElementById("shelf-pp-items");
    const shuffledPP = [...order.ppOptions].sort(() => Math.random() - 0.5);
    shelfPP.innerHTML = shuffledPP.map(opt => `
      <button class="shelf-btn" data-type="pp" data-val="${opt}">${opt}</button>
    `).join("");

    shelfAux.querySelectorAll(".shelf-btn").forEach(btn => {
      btn.addEventListener("click", () => selectIngredient("aux", btn.dataset.val));
    });
    shelfPP.querySelectorAll(".shelf-btn").forEach(btn => {
      btn.addEventListener("click", () => selectIngredient("pp", btn.dataset.val));
    });

    document.getElementById("rush-serve-btn").disabled = true;
    document.getElementById("rush-feedback-area").classList.add("hidden");
    document.getElementById("rush-shift-summary").classList.add("hidden");
  }

  function selectIngredient(type, val) {
    playPlateClack();
    if (type === "aux") {
      selectedAux = val;
      const slot = document.getElementById("slot-aux");
      slot.className = "ingredient-slot slot-filled";
      slot.querySelector(".slot-placeholder").style.display = "none";
      slot.querySelector(".slot-val").textContent = val;

      document.querySelectorAll("#shelf-aux-items .shelf-btn").forEach(b => {
        b.classList.toggle("is-selected", b.dataset.val === val);
      });
    } else if (type === "pp") {
      selectedPP = val;
      const slot = document.getElementById("slot-pp");
      slot.className = "ingredient-slot slot-filled";
      slot.querySelector(".slot-placeholder").style.display = "none";
      slot.querySelector(".slot-val").textContent = val;

      document.querySelectorAll("#shelf-pp-items .shelf-btn").forEach(b => {
        b.classList.toggle("is-selected", b.dataset.val === val);
      });
    }

    const canServe = selectedAux !== null && selectedPP !== null;
    document.getElementById("rush-serve-btn").disabled = !canServe;
  }

  function clearPlate() {
    playPlateClack();
    selectedAux = null;
    selectedPP = null;

    const slotAux = document.getElementById("slot-aux");
    slotAux.className = "ingredient-slot slot-empty";
    slotAux.querySelector(".slot-placeholder").style.display = "inline";
    slotAux.querySelector(".slot-val").textContent = "";

    const slotPP = document.getElementById("slot-pp");
    slotPP.className = "ingredient-slot slot-empty";
    slotPP.querySelector(".slot-placeholder").style.display = "inline";
    slotPP.querySelector(".slot-val").textContent = "";

    document.querySelectorAll(".shelf-btn").forEach(b => b.classList.remove("is-selected"));
    document.getElementById("rush-serve-btn").disabled = true;
  }

  document.getElementById("slot-aux").addEventListener("click", () => {
    if (selectedAux) {
      selectedAux = null;
      const slot = document.getElementById("slot-aux");
      slot.className = "ingredient-slot slot-empty";
      slot.querySelector(".slot-placeholder").style.display = "inline";
      slot.querySelector(".slot-val").textContent = "";
      document.querySelectorAll("#shelf-aux-items .shelf-btn").forEach(b => b.classList.remove("is-selected"));
      document.getElementById("rush-serve-btn").disabled = true;
      playPlateClack();
    }
  });

  document.getElementById("slot-pp").addEventListener("click", () => {
    if (selectedPP) {
      selectedPP = null;
      const slot = document.getElementById("slot-pp");
      slot.className = "ingredient-slot slot-empty";
      slot.querySelector(".slot-placeholder").style.display = "inline";
      slot.querySelector(".slot-val").textContent = "";
      document.querySelectorAll("#shelf-pp-items .shelf-btn").forEach(b => b.classList.remove("is-selected"));
      document.getElementById("rush-serve-btn").disabled = true;
      playPlateClack();
    }
  });

  document.getElementById("rush-clear-plate").addEventListener("click", clearPlate);

  function serveOrder() {
    const order = getCurrentOrder();
    if (!order || !selectedAux || !selectedPP) return;

    const isAuxCorrect = selectedAux === order.correctAux;
    const isPPCorrect = selectedPP === order.correctPP;
    const isSuccess = isAuxCorrect && isPPCorrect;

    document.querySelectorAll(".shelf-btn").forEach(b => b.disabled = true);
    document.getElementById("rush-serve-btn").disabled = true;

    const feedbackArea = document.getElementById("rush-feedback-area");
    const statusBadge = document.getElementById("rush-feedback-status");
    const msgEl = document.getElementById("rush-feedback-msg");

    const fullSentence = `${order.subject} ${order.correctAux} ${order.correctPP} ${order.object}`;

    if (isSuccess) {
      playBellChime();
      rushShiftScore++;
      saveRushTips(2);

      feedbackArea.className = "rush-feedback-card ok-feedback";
      statusBadge.textContent = "🛎️ Ding! Commande Parfaite! (+2 🥐)";
      msgEl.innerHTML = `
        <strong>Bravo Chef!</strong> Les clients se régalent : <em>« ${fullSentence} »</em><br><br>
        ${order.explanation}
      `;
    } else {
      playErrorMurmur();
      feedbackArea.className = "rush-feedback-card err-feedback";
      statusBadge.textContent = "⚠️ Oups! Retour en cuisine";

      let tipNote = "";
      if (!isAuxCorrect && !isPPCorrect) {
        tipNote = `L'auxiliaire attendu était <strong>${order.correctAux}</strong> et le participe passé <strong>${order.correctPP}</strong>.`;
      } else if (!isAuxCorrect) {
        tipNote = `Le participe passé était bon, mais l'auxiliaire attendu était <strong>${order.correctAux}</strong>.`;
      } else {
        tipNote = `L'auxiliaire était bon, mais attention à l'accord du participe : <strong>${order.correctPP}</strong> !`;
      }

      msgEl.innerHTML = `
        ${tipNote}<br><br>
        Recette correcte : <em>« ${fullSentence} »</em><br><br>
        ${order.explanation}
      `;
    }

    document.getElementById("rush-listen-btn").onclick = (e) => {
      e.stopPropagation();
      speakFrench(fullSentence);
    };

    feedbackArea.classList.remove("hidden");
  }

  document.getElementById("rush-serve-btn").addEventListener("click", serveOrder);

  function nextRushOrder() {
    const shift = getCurrentShift();
    if (rushOrderIdx + 1 < shift.orders.length) {
      loadRushOrder(rushOrderIdx + 1);
    } else {
      playCheerChime();
      document.getElementById("rush-feedback-area").classList.add("hidden");
      document.getElementById("rush-shift-summary").classList.remove("hidden");

      const scoreEl = document.getElementById("rush-shift-score");
      const badgeEl = document.getElementById("rush-shift-badge");
      const tipsEarnedEl = document.getElementById("rush-tips-earned");

      scoreEl.textContent = `${rushShiftScore} / ${shift.orders.length}`;

      const isPerfect = rushShiftScore === shift.orders.length;
      if (isPerfect) {
        saveRushTips(3);
        badgeEl.textContent = "🌟 Service Étoilé (Bonus +3 🥐)!";
        tipsEarnedEl.textContent = `Score parfait! Tu as gagné ${rushShiftScore * 2 + 3} croissants de pourboire!`;
      } else {
        badgeEl.textContent = rushShiftScore >= 4 ? "Très bon service!" : "Service d'apprentissage";
        tipsEarnedEl.textContent = `Tu as gagné ${rushShiftScore * 2} croissants de pourboire lors de ce service.`;
      }
    }
  }

  document.getElementById("rush-next-btn").addEventListener("click", nextRushOrder);

  const shiftSelect = document.getElementById("rush-shift-select");
  if (shiftSelect) {
    shiftSelect.addEventListener("change", () => {
      rushCurrentShiftId = parseInt(shiftSelect.value, 10);
      rushShiftScore = 0;
      loadRushOrder(0);
    });
  }

  document.getElementById("rush-replay-shift-btn").addEventListener("click", () => {
    rushShiftScore = 0;
    loadRushOrder(0);
  });

  document.getElementById("rush-next-shift-btn").addEventListener("click", () => {
    rushCurrentShiftId = (rushCurrentShiftId % RUSH_SHIFTS.length) + 1;
    if (shiftSelect) shiftSelect.value = rushCurrentShiftId.toString();
    rushShiftScore = 0;
    loadRushOrder(0);
  });

  const soundToggleBtn = document.getElementById("rush-sound-toggle");
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      soundToggleBtn.textContent = soundEnabled ? "🔔 Son : Oui" : "🔕 Son : Non";
    });
  }
  // --- Initialize App ---
  updateRushStatsUI();
  loadRushOrder(0);
  updateProgressUI();
  renderVerbGrid();
  buildFlashcardDeck();
  nextSorterQuestion();
  nextAccordsQuestion();
  startNewQuiz();
});
