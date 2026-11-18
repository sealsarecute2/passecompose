bplist00�XUTI-Data�[public.htmlO^	<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body>document.addEventListener("DOMContentLoaded", () =&gt; {
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

  // --- Navigation Tabs ---
  const navButtons = document.querySelectorAll(".nav-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  function switchTab(tabName) {
    navButtons.forEach(btn =&gt; btn.classList.toggle("active", btn.dataset.tab === tabName));
    tabPanels.forEach(panel =&gt; panel.classList.toggle("active", panel.id === `tab-${tabName}`));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navButtons.forEach(btn =&gt; {
    btn.addEventListener("click", () =&gt; switchTab(btn.dataset.tab));
  });

  document.querySelectorAll("[data-goto]").forEach(btn =&gt; {
    btn.addEventListener("click", () =&gt; switchTab(btn.dataset.goto));
  });

  // --- Progress UI ---
  function updateProgressUI() {
    const count = masteredIds.size;
    const pct = Math.round((count / VERBS.length) * 100);
    document.getElementById("mastery-count").textContent = `${count} / ${VERBS.length}`;
    document.getElementById("mastery-percent").textContent = `${pct}%`;
    document.getElementById("mastery-bar").style.width = `${pct}%`;
  }

  document.getElementById("reset-progress-btn").addEventListener("click", () =&gt; {
    if (confirm("Reset your saved mastery progress for all 50 verbs?")) {
      masteredIds.clear();
      saveMastery();
    }
  });

  // --- 50 Verbs Grid &amp; Filters ---
  let activeFilter = "all";
  let searchQuery = "";
  const verbsGrid = document.getElementById("verbs-grid");
  const searchInput = document.getElementById("verb-search");

  function getBadgeHTML(verb) {
    if (verb.reflexive) return `&lt;span class="pill pill-reflexive"&gt;Reflexive • Être&lt;/span&gt;`;
    if (verb.aux === "etre") return `&lt;span class="pill pill-etre"&gt;Être&lt;/span&gt;`;
    return `&lt;span class="pill pill-avoir"&gt;Avoir&lt;/span&gt;`;
  }

  function renderVerbGrid() {
    const filtered = VERBS.filter(v =&gt; {
      if (activeFilter === "avoir" &amp;&amp; v.aux !== "avoir") return false;
      if (activeFilter === "etre" &amp;&amp; (v.aux !== "etre" || v.reflexive)) return false;
      if (activeFilter === "reflexive" &amp;&amp; !v.reflexive) return false;
      if (activeFilter === "starred" &amp;&amp; !v.starred) return false;
      if (activeFilter === "unmastered" &amp;&amp; masteredIds.has(v.id)) return false;

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
      verbsGrid.innerHTML = `&lt;p&gt;No verbs match your search/filter.&lt;/p&gt;`;
      return;
    }

    verbsGrid.innerHTML = filtered.map(v =&gt; {
      const isMastered = masteredIds.has(v.id);
      return `
        &lt;div class="verb-card ${isMastered ? "is-mastered" : ""}" data-verb-id="${v.id}"&gt;
          &lt;div&gt;
            &lt;div class="verb-card-top"&gt;
              &lt;span class="verb-num"&gt;#${v.id}&lt;/span&gt;
              &lt;div&gt;
                ${v.starred ? `&lt;span class="pill pill-star"&gt;*&lt;/span&gt;` : ""}
                ${getBadgeHTML(v)}
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;h3&gt;${formatVerbTitle(v)}&lt;/h3&gt;
            &lt;p class="verb-eng"&gt;${v.english}&lt;/p&gt;
          &lt;/div&gt;
          &lt;div class="verb-pp-line"&gt;
            &lt;span&gt;PP: &lt;strong&gt;${v.pp}&lt;/strong&gt;${v.aux === "etre" ? "(e)(s)" : ""}&lt;/span&gt;
            &lt;span&gt;${isMastered ? "✅" : "→"}&lt;/span&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      `;
    }).join("");

    verbsGrid.querySelectorAll(".verb-card").forEach(card =&gt; {
      card.addEventListener("click", () =&gt; openVerbModal(Number(card.dataset.verbId)));
    });
  }

  searchInput.addEventListener("input", e =&gt; {
    searchQuery = e.target.value.trim();
    renderVerbGrid();
  });

  document.querySelectorAll(".filter-btn").forEach(btn =&gt; {
    btn.addEventListener("click", () =&gt; {
      document.querySelectorAll(".filter-btn").forEach(b =&gt; b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderVerbGrid();
    });
  });

  // --- Verb Detail Modal ---
  const modal = document.getElementById("verb-modal");
  let currentModalVerbId = null;

  function openVerbModal(verbId) {
    const v = VERBS.find(item =&gt; item.id === verbId);
    if (!v) return;
    currentModalVerbId = v.id;

    document.getElementById("modal-badges").innerHTML = `
      ${getBadgeHTML(v)}
      ${v.starred ? `&lt;span class="pill pill-star"&gt;Verbe Étoilé *&lt;/span&gt;` : ""}
      ${v.impersonal ? `&lt;span class="pill pill-star"&gt;Impersonal (Il only)&lt;/span&gt;` : ""}
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
      tbody.innerHTML = `&lt;tr&gt;&lt;td&gt;Il (impersonnel)&lt;/td&gt;&lt;td&gt;&lt;strong&gt;Il a ${v.pp}&lt;/strong&gt;&lt;/td&gt;&lt;/tr&gt;`;
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
      tbody.innerHTML = modalRows.map(r =&gt; `&lt;tr&gt;&lt;td&gt;${r.label}&lt;/td&gt;&lt;td&gt;&lt;strong&gt;${r.forms}&lt;/strong&gt;&lt;/td&gt;&lt;/tr&gt;`).join("");
    }

    document.getElementById("modal-ex-fr").textContent = v.exFr;
    document.getElementById("modal-ex-en").textContent = v.exEn;
    updateModalMasterBtn();

    modal.classList.remove("hidden");
  }

  function updateModalMasterBtn() {
    const btn = document.getElementById("modal-master-btn");
    const mastered = masteredIds.has(currentModalVerbId);
    btn.textContent = mastered ? "✅ Mastered (Click to Unmark)" : "⭐ Mark as Mastered";
  }

  document.getElementById("modal-master-btn").addEventListener("click", () =&gt; {
    if (currentModalVerbId !== null) {
      toggleMastered(currentModalVerbId);
      updateModalMasterBtn();
      updateFlashcardMasterBtn();
    }
  });

  document.getElementById("modal-close").addEventListener("click", () =&gt; modal.classList.add("hidden"));
  modal.addEventListener("click", e =&gt; {
    if (e.target === modal) modal.classList.add("hidden");
  });
  document.addEventListener("keydown", e =&gt; {
    if (e.key === "Escape") modal.classList.add("hidden");
  });

  // --- Practice Sub-Navigation ---
  const modeBtns = document.querySelectorAll(".mode-btn");
  const practicePanels = document.querySelectorAll(".practice-panel");

  modeBtns.forEach(btn =&gt; {
    btn.addEventListener("click", () =&gt; {
      modeBtns.forEach(b =&gt; b.classList.remove("active"));
      practicePanels.forEach(p =&gt; p.classList.remove("active"));
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
    if (mode === "etre-all") fcDeck = VERBS.filter(v =&gt; v.aux === "etre");
    else if (mode === "starred") fcDeck = VERBS.filter(v =&gt; v.starred);
    else if (mode === "unmastered") fcDeck = VERBS.filter(v =&gt; !masteredIds.has(v.id));
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
    document.getElementById("fc-meaning").innerHTML = `${v.english} • past participle: &lt;strong&gt;${v.pp}&lt;/strong&gt;`;
    document.getElementById("fc-example").textContent = v.exFr;
    updateFlashcardMasterBtn();
  }

  function updateFlashcardMasterBtn() {
    const v = fcDeck[fcIndex];
    if (!v) return;
    const btn = document.getElementById("fc-toggle-master");
    btn.textContent = masteredIds.has(v.id) ? "✅ Mastered" : "⭐ Mark Mastered";
  }

  flashcardEl.addEventListener("click", () =&gt; flashcardEl.classList.toggle("flipped"));
  flashcardEl.addEventListener("keydown", e =&gt; {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flashcardEl.classList.toggle("flipped");
    }
  });

  document.getElementById("fc-next").addEventListener("click", () =&gt; {
    fcIndex = (fcIndex + 1) % fcDeck.length;
    renderFlashcard();
  });

  document.getElementById("fc-prev").addEventListener("click", () =&gt; {
    fcIndex = (fcIndex - 1 + fcDeck.length) % fcDeck.length;
    renderFlashcard();
  });

  document.getElementById("fc-toggle-master").addEventListener("click", () =&gt; {
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
    const etrePool = VERBS.filter(v =&gt; v.aux === "etre");
    const avoirPool = VERBS.filter(v =&gt; v.aux === "avoir");
    sorterVerb = Math.random() &lt; 0.4 ? randomItem(etrePool) : randomItem(avoirPool);

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
      reason = `&lt;strong&gt;${sorterVerb.infinitive}&lt;/strong&gt; is a reflexive verb, so it ALWAYS takes &lt;strong&gt;être&lt;/strong&gt;!`;
    } else if (sorterVerb.aux === "etre") {
      reason = `&lt;strong&gt;${sorterVerb.infinitive}&lt;/strong&gt; is a DR &amp; MRS VANDERTRAMP verb, so it takes &lt;strong&gt;être&lt;/strong&gt; (e.g., &lt;em&gt;Elle est ${sorterVerb.pp}e&lt;/em&gt;).`;
    } else {
      reason = `&lt;strong&gt;${sorterVerb.infinitive}&lt;/strong&gt; is not reflexive or Vandertramp, so it takes &lt;strong&gt;avoir&lt;/strong&gt; (e.g., &lt;em&gt;Il a ${sorterVerb.pp}&lt;/em&gt;).`;
    }

    if (correct) {
      sorterScore++;
      sorterStreak++;
      sorterFeedback.className = "feedback-box ok";
      sorterFeedback.innerHTML = `✅ &lt;strong&gt;Bravo!&lt;/strong&gt; ${reason}`;
    } else {
      sorterStreak = 0;
      sorterFeedback.className = "feedback-box err";
      sorterFeedback.innerHTML = `❌ &lt;strong&gt;Pas tout à fait!&lt;/strong&gt; ${reason}`;
    }

    document.getElementById("sorter-score").textContent = sorterScore;
    document.getElementById("sorter-streak").textContent = sorterStreak;
    sorterFeedback.classList.remove("hidden");
    sorterNextBtn.classList.remove("hidden");
  }

  document.getElementById("btn-choose-avoir").addEventListener("click", () =&gt; answerSorter("avoir"));
  document.getElementById("btn-choose-etre").addEventListener("click", () =&gt; answerSorter("etre"));
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
    const etreVerbs = VERBS.filter(v =&gt; v.aux === "etre");
    const avoirVerbs = VERBS.filter(v =&gt; v.aux === "avoir" &amp;&amp; !v.impersonal);
    const verb = Math.random() &lt; 0.7 ? randomItem(etreVerbs) : randomItem(avoirVerbs);
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

    const options = [correctForm, ...[...distractors].slice(0, 3)].sort(() =&gt; Math.random() - 0.5);
    const optionsEl = document.getElementById("accords-options");
    const feedbackEl = document.getElementById("accords-feedback");
    const nextBtn = document.getElementById("accords-next");

    feedbackEl.classList.add("hidden");
    nextBtn.classList.add("hidden");

    optionsEl.innerHTML = options.map(opt =&gt; `&lt;button class="option-choice"&gt;${opt}&lt;/button&gt;`).join("");

    optionsEl.querySelectorAll(".option-choice").forEach(btn =&gt; {
      btn.addEventListener("click", () =&gt; {
        optionsEl.querySelectorAll(".option-choice").forEach(b =&gt; {
          b.disabled = true;
          if (b.textContent === correctForm) b.classList.add("correct");
        });

        let ruleNote = "";
        if (verb.aux === "avoir") {
          ruleNote = `&lt;strong&gt;${verb.infinitive}&lt;/strong&gt; uses &lt;strong&gt;avoir&lt;/strong&gt;, so NEVER add &lt;em&gt;-e&lt;/em&gt; or &lt;em&gt;-s&lt;/em&gt; for the subject! Answer: &lt;strong&gt;${correctForm}&lt;/strong&gt;.`;
        } else if (verb.pp.endsWith("s") &amp;&amp; !s.fem &amp;&amp; s.plural) {
          ruleNote = `&lt;strong&gt;${verb.pp}&lt;/strong&gt; already ends in &lt;strong&gt;-s&lt;/strong&gt;, so masculine plural stays &lt;strong&gt;${verb.pp}&lt;/strong&gt;! Answer: &lt;strong&gt;${correctForm}&lt;/strong&gt;.`;
        } else {
          ruleNote = `With &lt;strong&gt;être&lt;/strong&gt;${verb.reflexive ? " (reflexive)" : ""}, agree with &lt;em&gt;${chosen.display}&lt;/em&gt; → &lt;strong&gt;${correctForm}&lt;/strong&gt;.`;
        }

        if (btn.textContent === correctForm) {
          accordsScore++;
          accordsStreak++;
          feedbackEl.className = "feedback-box ok";
          feedbackEl.innerHTML = `✅ &lt;strong&gt;Exactement!&lt;/strong&gt; ${ruleNote}`;
        } else {
          btn.classList.add("wrong");
          accordsStreak = 0;
          feedbackEl.className = "feedback-box err";
          feedbackEl.innerHTML = `❌ &lt;strong&gt;Attention!&lt;/strong&gt; ${ruleNote}`;
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

  function startNewQuiz() {
    const shuffled = [...VERBS].sort(() =&gt; Math.random() - 0.5).slice(0, 10);
    quizRound = shuffled.map(v =&gt; ({
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

  document.getElementById("quiz-form").addEventListener("submit", e =&gt; {
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
      quizFeedback.innerHTML = `✅ &lt;strong&gt;Super!&lt;/strong&gt; &lt;em&gt;${expected}&lt;/em&gt;`;
    } else {
      quizFeedback.className = "feedback-box err";
      quizFeedback.innerHTML = `❌ &lt;strong&gt;Bonne réponse :&lt;/strong&gt; &lt;em&gt;${expected}&lt;/em&gt;`;
    }

    quizFeedback.classList.remove("hidden");
    quizNextBtn.textContent = quizIdx === quizRound.length - 1 ? "See Final Score →" : "Next Question →";
    quizNextBtn.classList.remove("hidden");
    quizNextBtn.focus();
  });

  quizNextBtn.addEventListener("click", () =&gt; {
    quizIdx++;
    if (quizIdx &gt;= quizRound.length) {
      document.getElementById("quiz-active-area").classList.add("hidden");
      document.getElementById("quiz-summary").classList.remove("hidden");
      document.getElementById("quiz-final-score").textContent = `${quizScore} / ${quizRound.length}`;
      document.getElementById("quiz-final-msg").textContent =
        quizScore &gt;= 9 ? "Incroyable! Tu es un chef du passé composé! 🥐" :
        quizScore &gt;= 7 ? "Très bon travail! Continue comme ça! 🎉" :
        "Bon effort! Révise les leçons et réessaie! 💪";
    } else {
      renderQuizQuestion();
    }
  });

  document.getElementById("quiz-restart").addEventListener("click", startNewQuiz);
  document.getElementById("quiz-play-again").addEventListener("click", startNewQuiz);

  // Accent bar character insertion
  document.querySelectorAll(".accent-btn").forEach(btn =&gt; {
    btn.addEventListener("click", () =&gt; {
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

  // --- Initialize App ---
  updateProgressUI();
  renderVerbGrid();
  buildFlashcardDeck();
  nextSorterQuestion();
  nextAccordsQuestion();
  startNewQuiz();
});
</body></html>     #                           ^0