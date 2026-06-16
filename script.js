(function () {
  const app = document.querySelector("#app");
  const body = document.body;
  const pageTitle = document.querySelector("#pageTitle");
  const backButton = document.querySelector("#backButton");
  const totalProgress = document.querySelector("#totalProgress");
  const subjects = window.SCHOOL_DATA || {};
  const year4TimesTables = window.YEAR4_TIMES_TABLES || [];
  const year3English = window.YEAR3_ENGLISH || {};
  const year3Grammar = window.YEAR3_GRAMMAR || {};
  const year34Spelling = window.YEAR34_SPELLING || { worksheets: [] };
  const year4TrickyWords = window.YEAR4_TRICKY_WORDS || { sheets: [] };
  const year4ColumnMaths = window.YEAR4_COLUMN_MATHS || { questions: [] };
  const year4MathsWorkbook = window.YEAR4_MATHS_WORKBOOK || { activities: [] };
  const rewardSet = window.REWARD_SET?.items || [];
  const subjectKeys = ["maths", "english", "science", "technology"];
  const years = ["Preschool", "Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7"];
  const encouragement = ["Brilliant!", "Nice thinking!", "You nailed it!", "Super work!", "Brain power!"];
  const resetPassword = "1256";
  const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];
  const rarityConfig = {
    common: { label: "Common", chance: "60%" },
    uncommon: { label: "Uncommon", chance: "22%" },
    rare: { label: "Rare", chance: "12%" },
    epic: { label: "Epic", chance: "5%" },
    legendary: { label: "Legendary", chance: "1%" }
  };
  const worksheetPacks = [
    {
      id: "year3-english-spelling",
      label: "Year 3 Spelling Fix-Ups",
      year: "Year 3",
      subject: "english"
    },
    {
      id: "year3-english-grammar",
      label: "Year 3 Grammar Challenges",
      year: "Year 3",
      subject: "english"
    },
    {
      id: "year4-times-tables",
      label: "Year 4 Times Tables",
      year: "Year 4",
      subject: "maths"
    },
    {
      id: "year34-english-spelling",
      label: "Year 3 and 4 Spelling Sheets",
      year: "Year 3",
      subject: "english"
    },
    {
      id: "year4-english-tricky-words",
      label: "Year 4 Tricky Words",
      year: "Year 4",
      subject: "english"
    },
    {
      id: "year4-column-maths",
      label: "Year 4 Column Maths",
      year: "Year 4",
      subject: "maths"
    },
    {
      id: "year4-maths-workbook",
      label: "Year 4 Maths Workbook",
      year: "Year 4",
      subject: "maths"
    }
  ];

  let selectedYear = "Preschool";
  let quizState = null;
  let cloudSaveTimer = null;
  let adultUnlocked = false;
  let passwordRequest = null;
  let grammarQuizState = null;
  let trickyWordsState = null;
  let rewardRevealState = null;

  window.addEventListener("school-cloud-ready", () => {
    if (!location.hash) renderDashboard();
  });

  window.addEventListener("school-cloud-change", () => {
    if (!location.hash) renderDashboard();
  });

  backButton.addEventListener("click", () => {
    if (location.hash.startsWith("#quiz/")) {
      const [, subject] = location.hash.slice(1).split("/");
      location.hash = `subject/${subject}`;
      return;
    }

    if (location.hash.startsWith("#times-practice/")) {
      location.hash = "times";
      return;
    }

    if (location.hash.startsWith("#english-spelling-practice/")) {
      location.hash = "english-spelling";
      return;
    }

    if (location.hash.startsWith("#year34-spelling-practice/")) {
      location.hash = "year34-spelling";
      return;
    }

    if (location.hash.startsWith("#english-grammar-test/")) {
      location.hash = "english-grammar";
      return;
    }

    if (location.hash.startsWith("#tricky-words-sheet/")) {
      location.hash = "tricky-words";
      return;
    }

    if (location.hash.startsWith("#maths-workbook/")) {
      location.hash = "maths-workbook";
      return;
    }

    if (location.hash === "#times") {
      selectedYear = "Year 4";
      location.hash = "subject/maths";
      return;
    }

    if (location.hash === "#english-spelling") {
      selectedYear = "Year 3";
      location.hash = "subject/english";
      return;
    }

    if (location.hash === "#english-grammar") {
      selectedYear = "Year 3";
      location.hash = "subject/english";
      return;
    }

    if (location.hash === "#year34-spelling") {
      selectedYear = getActiveProfile().year || "Year 4";
      location.hash = "subject/english";
      return;
    }

    if (location.hash === "#tricky-words") {
      selectedYear = "Year 4";
      location.hash = "subject/english";
      return;
    }

    if (location.hash === "#column-maths") {
      selectedYear = "Year 4";
      location.hash = "subject/maths";
      return;
    }

    if (location.hash === "#maths-workbook") {
      selectedYear = "Year 4";
      location.hash = "subject/maths";
      return;
    }

    if (location.hash === "#adult") {
      location.hash = "";
      return;
    }

    if (location.hash === "#rewards") {
      location.hash = "";
      return;
    }

    location.hash = "";
  });

  window.addEventListener("hashchange", render);
  render();

  function render() {
    const route = location.hash.replace("#", "");
    updateTotalProgress();

    if (!route) {
      renderDashboard();
      return;
    }

    const [view, subject, year] = route.split("/");

    if (view === "subject" && subjects[subject]) {
      renderSubject(subject);
      return;
    }

    if (view === "quiz" && subjects[subject]) {
      if (!quizState || quizState.subject !== subject || quizState.year !== decodeRouteValue(year)) {
        startQuiz(subject, decodeRouteValue(year || selectedYear));
      }
      renderQuiz();
      return;
    }

    if (view === "times") {
      renderTimesTableMenu();
      return;
    }

    if (view === "times-practice") {
      renderTimesPractice(Number(subject), Number(year));
      return;
    }

    if (view === "english-spelling") {
      renderEnglishSpellingMenu();
      return;
    }

    if (view === "english-spelling-practice") {
      renderEnglishSpellingPractice(Number(subject));
      return;
    }

    if (view === "year34-spelling") {
      renderYear34SpellingMenu();
      return;
    }

    if (view === "year34-spelling-practice") {
      renderYear34SpellingPractice(Number(subject));
      return;
    }

    if (view === "english-grammar") {
      renderEnglishGrammarMenu();
      return;
    }

    if (view === "english-grammar-test") {
      if (!grammarQuizState || grammarQuizState.test !== Number(subject)) {
        startEnglishGrammarTest(Number(subject));
      }
      renderEnglishGrammarQuiz();
      return;
    }

    if (view === "tricky-words") {
      renderTrickyWordsMenu();
      return;
    }

    if (view === "tricky-words-sheet") {
      if (!trickyWordsState || trickyWordsState.sheet !== Number(subject)) {
        startTrickyWordsSheet(Number(subject));
      }
      renderTrickyWordsQuiz();
      return;
    }

    if (view === "column-maths") {
      renderColumnMathsPractice();
      return;
    }

    if (view === "maths-workbook") {
      if (subject) {
        renderMathsWorkbookActivity(subject);
      } else {
        renderMathsWorkbookMenu();
      }
      return;
    }

    if (view === "adult") {
      openAdultArea();
      return;
    }

    if (view === "rewards") {
      renderRewardsGallery();
      return;
    }

    location.hash = "";
  }

  function renderDashboard() {
    pageTitle.textContent = "Pick Your Adventure";
    backButton.classList.add("hidden");
    quizState = null;

    app.innerHTML = `
      ${studentHomePanel()}
      <section class="dashboard-grid">
        ${subjectKeys.map((key) => subjectCard(key)).join("")}
      </section>
    `;

    app.querySelector("#adultButton").addEventListener("click", () => {
      unlockAdultArea();
    });

    app.querySelector("#collectionButton").addEventListener("click", () => {
      location.hash = "rewards";
    });

    app.querySelectorAll("[data-subject]").forEach((card) => {
      card.addEventListener("click", () => {
        location.hash = `subject/${card.dataset.subject}`;
      });
    });
  }

  function subjectCard(key) {
    const subject = subjects[key];
    const progress = getSubjectProgress(key);

    return `
      <button class="subject-card" type="button" data-subject="${key}" style="--subject-color: ${subject.color}">
        <span class="subject-icon" style="background: ${subject.color}">${subject.icon}</span>
        <h2>${subject.name}</h2>
        <p>${subject.message}</p>
        <div class="mini-progress" aria-label="${subject.name} progress">
          <div class="progress-track"><div class="progress-fill" style="width: ${progress}%"></div></div>
          <span class="progress-label">${progress}% complete</span>
        </div>
      </button>
    `;
  }

  function renderSubject(key) {
    const subject = subjects[key];
    const availableYears = getStudentYears();
    if (!availableYears.includes(selectedYear)) {
      selectedYear = availableYears[0];
    }
    pageTitle.textContent = subject.name;
    backButton.classList.remove("hidden");
    quizState = null;

    app.innerHTML = `
      <section class="subject-layout" style="--active-color: ${subject.color}">
        <div class="panel">
          <span class="profile-chip">${getActiveProfile().name}</span>
          <h2>Choose a Year</h2>
          <p>${subject.message} Pick your level and start a quick quiz.</p>
          <div class="year-grid">
            ${availableYears.map((year) => `
              <button class="year-pill ${year === selectedYear ? "active" : ""}" type="button" data-year="${year}">
                ${year}
              </button>
            `).join("")}
          </div>
        </div>
        <div class="panel launch-box">
          <span class="selected-badge">${selectedYear}</span>
          <h2>${subject.name} Quiz</h2>
          <p>${getYearProgressText(key, selectedYear)}</p>
          <div class="progress-track"><div class="progress-fill" style="width: ${getYearProgress(key, selectedYear)}%"></div></div>
          <button class="primary-action" type="button" id="startButton">Start Quiz</button>
          ${key === "english" && selectedYear === "Year 3" && hasWorksheetAccess("year3-english-spelling") ? `
            <button class="primary-action english-action" type="button" id="spellingButton">Spelling Fix-Ups</button>
          ` : ""}
          ${key === "english" && (selectedYear === "Year 3" || selectedYear === "Year 4") && hasWorksheetAccess("year34-english-spelling") ? `
            <button class="primary-action english-action" type="button" id="year34SpellingButton">Year 3 and 4 Spelling Sheets</button>
          ` : ""}
          ${key === "english" && selectedYear === "Year 3" && hasWorksheetAccess("year3-english-grammar") ? `
            <button class="primary-action grammar-action" type="button" id="grammarButton">Grammar Challenges</button>
          ` : ""}
          ${key === "english" && selectedYear === "Year 4" && hasWorksheetAccess("year4-english-tricky-words") ? `
            <button class="primary-action grammar-action" type="button" id="trickyWordsButton">Tricky Words</button>
          ` : ""}
          ${key === "maths" && selectedYear === "Year 4" && hasWorksheetAccess("year4-times-tables") ? `
            <button class="primary-action times-action" type="button" id="timesButton">Daily Times Tables</button>
          ` : ""}
          ${key === "maths" && selectedYear === "Year 4" && hasWorksheetAccess("year4-column-maths") ? `
            <button class="primary-action times-action" type="button" id="columnMathsButton">Column Maths</button>
          ` : ""}
          ${key === "maths" && selectedYear === "Year 4" && hasWorksheetAccess("year4-maths-workbook") ? `
            <button class="primary-action times-action" type="button" id="mathsWorkbookButton">Maths Workbook</button>
          ` : ""}
        </div>
      </section>
    `;

    app.querySelectorAll("[data-year]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedYear = button.dataset.year;
        renderSubject(key);
      });
    });

    app.querySelector("#startButton").addEventListener("click", () => {
      location.hash = `quiz/${key}/${encodeRouteValue(selectedYear)}`;
    });

    const timesButton = app.querySelector("#timesButton");
    if (timesButton) {
      timesButton.addEventListener("click", () => {
        location.hash = "times";
      });
    }

    const spellingButton = app.querySelector("#spellingButton");
    if (spellingButton) {
      spellingButton.addEventListener("click", () => {
        location.hash = "english-spelling";
      });
    }

    const year34SpellingButton = app.querySelector("#year34SpellingButton");
    if (year34SpellingButton) {
      year34SpellingButton.addEventListener("click", () => {
        location.hash = "year34-spelling";
      });
    }

    const grammarButton = app.querySelector("#grammarButton");
    if (grammarButton) {
      grammarButton.addEventListener("click", () => {
        location.hash = "english-grammar";
      });
    }

    const trickyWordsButton = app.querySelector("#trickyWordsButton");
    if (trickyWordsButton) {
      trickyWordsButton.addEventListener("click", () => {
        location.hash = "tricky-words";
      });
    }

    const columnMathsButton = app.querySelector("#columnMathsButton");
    if (columnMathsButton) {
      columnMathsButton.addEventListener("click", () => {
        location.hash = "column-maths";
      });
    }

    const mathsWorkbookButton = app.querySelector("#mathsWorkbookButton");
    if (mathsWorkbookButton) {
      mathsWorkbookButton.addEventListener("click", () => {
        location.hash = "maths-workbook";
      });
    }
  }

  function renderEnglishSpellingMenu() {
    const pack = year3English.spellingFixups;
    pageTitle.textContent = "Year 3 Spelling";
    backButton.classList.remove("hidden");
    quizState = null;

    app.innerHTML = `
      <section class="panel times-menu">
        <div class="times-heading">
          <div>
            <h2>${pack.title}</h2>
            <p>${getActiveProfile().name} can work through spelling correction worksheets with typed answers.</p>
          </div>
          <span class="selected-badge">${pack.worksheets.length} worksheets</span>
        </div>
        <div class="booklet-list">
          ${pack.worksheets.map((worksheet) => `
            <article class="booklet-card">
              <div>
                <h3>Worksheet ${worksheet.worksheet}</h3>
                <p>${worksheet.items.length} spelling fixes</p>
              </div>
              <div class="single-action-grid">
                <button class="day-button ${getEnglishSpellingRecord(worksheet.worksheet).completed ? "done" : ""}" type="button" data-spelling-sheet="${worksheet.worksheet}">
                  <span>Open Worksheet</span>
                  <small>${englishSpellingStatusLabel(worksheet.worksheet)}</small>
                </button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;

    app.querySelectorAll("[data-spelling-sheet]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = `english-spelling-practice/${button.dataset.spellingSheet}`;
      });
    });
  }

  function renderYear34SpellingMenu() {
    pageTitle.textContent = "Year 3 and 4 Spelling";
    backButton.classList.remove("hidden");
    quizState = null;

    app.innerHTML = `
      <section class="panel times-menu">
        <div class="times-heading">
          <div>
            <h2>${year34Spelling.title}</h2>
            <p>${getActiveProfile().name} can work through extra spelling correction worksheets with typed answers.</p>
          </div>
          <span class="selected-badge">${year34Spelling.worksheets.length} worksheets</span>
        </div>
        <div class="booklet-list">
          ${year34Spelling.worksheets.map((worksheet) => `
            <article class="booklet-card">
              <div>
                <h3>Worksheet ${worksheet.worksheet}</h3>
                <p>${worksheet.items.length} spelling fixes</p>
              </div>
              <div class="single-action-grid">
                <button class="day-button ${getYear34SpellingRecord(worksheet.worksheet).completed ? "done" : ""}" type="button" data-year34-spelling-sheet="${worksheet.worksheet}">
                  <span>Open Worksheet</span>
                  <small>${year34SpellingStatusLabel(worksheet.worksheet)}</small>
                </button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;

    app.querySelectorAll("[data-year34-spelling-sheet]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = `year34-spelling-practice/${button.dataset.year34SpellingSheet}`;
      });
    });
  }

  function renderEnglishGrammarMenu() {
    pageTitle.textContent = "Year 3 Grammar";
    backButton.classList.remove("hidden");
    quizState = null;
    grammarQuizState = null;

    app.innerHTML = `
      <section class="panel times-menu">
        <div class="times-heading">
          <div>
            <h2>${year3Grammar.title}</h2>
            <p>${getActiveProfile().name} can work through short grammar and punctuation challenge tests.</p>
          </div>
          <span class="selected-badge">${year3Grammar.tests.length} tests</span>
        </div>
        <div class="booklet-list">
          ${year3Grammar.tests.map((test) => `
            <article class="booklet-card">
              <div>
                <h3>Test ${test.test}</h3>
                <p>${test.questions.length} questions</p>
              </div>
              <div class="single-action-grid">
                <button class="day-button ${getEnglishGrammarRecord(test.test).completed ? "done" : ""}" type="button" data-grammar-test="${test.test}">
                  <span>Open Test</span>
                  <small>${englishGrammarStatusLabel(test.test)}</small>
                </button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;

    app.querySelectorAll("[data-grammar-test]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = `english-grammar-test/${button.dataset.grammarTest}`;
      });
    });
  }

  function renderTrickyWordsMenu() {
    pageTitle.textContent = "Tricky Words";
    backButton.classList.remove("hidden");
    quizState = null;
    trickyWordsState = null;

    app.innerHTML = `
      <section class="panel times-menu">
        <div class="times-heading">
          <div>
            <h2>${year4TrickyWords.title}</h2>
            <p>${getActiveProfile().name} can choose the correct spelling from three options on each sheet.</p>
          </div>
          <span class="selected-badge">${year4TrickyWords.sheets.length} sheets</span>
        </div>
        <div class="booklet-list">
          ${year4TrickyWords.sheets.map((sheet) => `
            <article class="booklet-card">
              <div>
                <h3>Sheet ${sheet.sheet}</h3>
                <p>${sheet.questions.length} word choices</p>
              </div>
              <div class="single-action-grid">
                <button class="day-button ${getTrickyWordsRecord(sheet.sheet).completed ? "done" : ""}" type="button" data-tricky-sheet="${sheet.sheet}">
                  <span>Open Sheet</span>
                  <small>${trickyWordsStatusLabel(sheet.sheet)}</small>
                </button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;

    app.querySelectorAll("[data-tricky-sheet]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = `tricky-words-sheet/${button.dataset.trickySheet}`;
      });
    });
  }

  function startEnglishGrammarTest(testNumber) {
    const test = year3Grammar.tests.find((item) => item.test === testNumber);
    if (!test) return;
    grammarQuizState = {
      test: testNumber,
      index: 0,
      score: 0,
      answered: false,
      questions: test.questions
    };
  }

  function renderEnglishGrammarQuiz() {
    const question = grammarQuizState.questions[grammarQuizState.index];
    pageTitle.textContent = `Grammar Test ${grammarQuizState.test}`;
    backButton.classList.remove("hidden");

    if (!question) {
      renderEnglishGrammarResult();
      return;
    }

    app.innerHTML = `
      <section class="panel quiz-card grammar-card">
        <div class="quiz-topline">
          <span>${getActiveProfile().name}</span>
          <span>Question ${grammarQuizState.index + 1} of ${grammarQuizState.questions.length}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${(grammarQuizState.index / grammarQuizState.questions.length) * 100}%"></div>
        </div>
        <h2 class="question-text">${question.prompt}</h2>
        <div class="answers-grid">
          ${question.options.map((option, index) => `
            <button class="answer-button" type="button" data-grammar-answer="${index}">${option}</button>
          `).join("")}
        </div>
        <p class="feedback" id="grammarFeedback"></p>
      </section>
    `;

    app.querySelectorAll("[data-grammar-answer]").forEach((button) => {
      button.addEventListener("click", () => chooseEnglishGrammarAnswer(Number(button.dataset.grammarAnswer)));
    });
  }

  function chooseEnglishGrammarAnswer(answerIndex) {
    if (grammarQuizState.answered) return;
    grammarQuizState.answered = true;
    const question = grammarQuizState.questions[grammarQuizState.index];
    const buttons = app.querySelectorAll("[data-grammar-answer]");
    const feedback = app.querySelector("#grammarFeedback");
    const isCorrect = answerIndex === question.answer;

    buttons.forEach((button) => {
      const optionIndex = Number(button.dataset.grammarAnswer);
      button.disabled = true;
      if (optionIndex === question.answer) button.classList.add("correct");
      if (optionIndex === answerIndex && !isCorrect) button.classList.add("wrong");
    });

    if (isCorrect) {
      grammarQuizState.score += 1;
      feedback.textContent = encouragement[Math.floor(Math.random() * encouragement.length)];
    } else {
      feedback.textContent = "Good try!";
    }

    setTimeout(() => {
      grammarQuizState.index += 1;
      grammarQuizState.answered = false;
      renderEnglishGrammarQuiz();
    }, 1100);
  }

  function renderEnglishGrammarResult() {
    const percent = Math.round((grammarQuizState.score / grammarQuizState.questions.length) * 100);
    const rewards = saveEnglishGrammarAttempt(grammarQuizState.test, percent);
    updateTotalProgress();

    app.innerHTML = `
      <section class="panel quiz-card result-card">
        <span class="selected-badge">Test ${grammarQuizState.test}</span>
        <h2>${resultMessage(percent)}</h2>
        <div class="result-score">${percent}%</div>
        <p>You scored ${grammarQuizState.score} out of ${grammarQuizState.questions.length}.</p>
        <div class="actions-row">
          <button class="primary-action grammar-action" type="button" id="retryGrammar">Try Again</button>
          <button class="primary-action secondary-action" type="button" id="backGrammar">Back to Tests</button>
        </div>
      </section>
    `;

    app.querySelector("#retryGrammar").addEventListener("click", () => {
      startEnglishGrammarTest(grammarQuizState.test);
      renderEnglishGrammarQuiz();
    });

    app.querySelector("#backGrammar").addEventListener("click", () => {
      location.hash = "english-grammar";
    });

    if (rewards.length) {
      showRewardReveal(rewards, "New reward unlocked!");
    }
  }

  function startTrickyWordsSheet(sheetNumber) {
    const sheet = year4TrickyWords.sheets.find((item) => item.sheet === sheetNumber);
    if (!sheet) return;
    trickyWordsState = {
      sheet: sheetNumber,
      index: 0,
      score: 0,
      answered: false,
      questions: sheet.questions
    };
  }

  function renderTrickyWordsQuiz() {
    const question = trickyWordsState.questions[trickyWordsState.index];
    pageTitle.textContent = `Tricky Words ${trickyWordsState.sheet}`;
    backButton.classList.remove("hidden");

    if (!question) {
      renderTrickyWordsResult();
      return;
    }

    app.innerHTML = `
      <section class="panel quiz-card grammar-card">
        <div class="quiz-topline">
          <span>${getActiveProfile().name}</span>
          <span>Word ${trickyWordsState.index + 1} of ${trickyWordsState.questions.length}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${(trickyWordsState.index / trickyWordsState.questions.length) * 100}%"></div>
        </div>
        <h2 class="question-text">${question.prompt}</h2>
        <div class="answers-grid">
          ${question.options.map((option, index) => `
            <button class="answer-button" type="button" data-tricky-answer="${index}">${option}</button>
          `).join("")}
        </div>
        <p class="feedback" id="trickyFeedback"></p>
      </section>
    `;

    app.querySelectorAll("[data-tricky-answer]").forEach((button) => {
      button.addEventListener("click", () => chooseTrickyWordsAnswer(Number(button.dataset.trickyAnswer)));
    });
  }

  function chooseTrickyWordsAnswer(answerIndex) {
    if (trickyWordsState.answered) return;
    trickyWordsState.answered = true;
    const question = trickyWordsState.questions[trickyWordsState.index];
    const buttons = app.querySelectorAll("[data-tricky-answer]");
    const feedback = app.querySelector("#trickyFeedback");
    const isCorrect = answerIndex === question.answer;

    buttons.forEach((button) => {
      const optionIndex = Number(button.dataset.trickyAnswer);
      button.disabled = true;
      if (optionIndex === question.answer) button.classList.add("correct");
      if (optionIndex === answerIndex && !isCorrect) button.classList.add("wrong");
    });

    if (isCorrect) {
      trickyWordsState.score += 1;
      feedback.textContent = encouragement[Math.floor(Math.random() * encouragement.length)];
    } else {
      feedback.textContent = "Good try!";
    }

    setTimeout(() => {
      trickyWordsState.index += 1;
      trickyWordsState.answered = false;
      renderTrickyWordsQuiz();
    }, 1100);
  }

  function renderTrickyWordsResult() {
    const percent = Math.round((trickyWordsState.score / trickyWordsState.questions.length) * 100);
    const rewards = saveTrickyWordsAttempt(trickyWordsState.sheet, percent);
    updateTotalProgress();

    app.innerHTML = `
      <section class="panel quiz-card result-card">
        <span class="selected-badge">Sheet ${trickyWordsState.sheet}</span>
        <h2>${resultMessage(percent)}</h2>
        <div class="result-score">${percent}%</div>
        <p>You scored ${trickyWordsState.score} out of ${trickyWordsState.questions.length}.</p>
        <div class="actions-row">
          <button class="primary-action grammar-action" type="button" id="retryTricky">Try Again</button>
          <button class="primary-action secondary-action" type="button" id="backTricky">Back to Sheets</button>
        </div>
      </section>
    `;

    app.querySelector("#retryTricky").addEventListener("click", () => {
      startTrickyWordsSheet(trickyWordsState.sheet);
      renderTrickyWordsQuiz();
    });

    app.querySelector("#backTricky").addEventListener("click", () => {
      location.hash = "tricky-words";
    });

    if (rewards.length) {
      showRewardReveal(rewards, "Tricky word reward unlocked!");
    }
  }

  function renderEnglishSpellingPractice(worksheetNumber) {
    const pack = year3English.spellingFixups;
    const worksheet = pack.worksheets.find((item) => item.worksheet === worksheetNumber);
    if (!worksheet) {
      location.hash = "english-spelling";
      return;
    }

    pageTitle.textContent = `Spelling Worksheet ${worksheetNumber}`;
    backButton.classList.remove("hidden");

    app.innerHTML = `
      <section class="panel times-practice">
        <div class="quiz-topline">
          <span>${getActiveProfile().name}</span>
          <span>${englishSpellingAttemptLabel(worksheetNumber)}</span>
        </div>
        <div class="sentence-grid">
          ${worksheet.items.map((item, index) => `
            <label class="sentence-card" data-sentence="${index}">
              <span>${index + 1}. ${item.sentence}</span>
              <input inputmode="text" type="text" aria-label="Spelling answer ${index + 1}" autocomplete="off">
            </label>
          `).join("")}
        </div>
        <p class="feedback" id="spellingFeedback"></p>
        <div class="actions-row">
          <button class="primary-action english-action" type="button" id="checkSpelling">Check Spellings</button>
          <button class="primary-action secondary-action" type="button" id="clearSpelling">Clear</button>
        </div>
      </section>
    `;

    app.querySelector("#checkSpelling").addEventListener("click", () => checkEnglishSpellingAnswers(worksheet));
    app.querySelector("#clearSpelling").addEventListener("click", () => renderEnglishSpellingPractice(worksheetNumber));
  }

  function renderYear34SpellingPractice(worksheetNumber) {
    const worksheet = year34Spelling.worksheets.find((item) => item.worksheet === worksheetNumber);
    if (!worksheet) {
      location.hash = "year34-spelling";
      return;
    }

    pageTitle.textContent = `Spelling Worksheet ${worksheetNumber}`;
    backButton.classList.remove("hidden");

    app.innerHTML = `
      <section class="panel times-practice">
        <div class="quiz-topline">
          <span>${getActiveProfile().name}</span>
          <span>${year34SpellingAttemptLabel(worksheetNumber)}</span>
        </div>
        <div class="sentence-grid">
          ${worksheet.items.map((item, index) => `
            <label class="sentence-card" data-year34-sentence="${index}">
              <span>${index + 1}. ${item.sentence}</span>
              <input inputmode="text" type="text" aria-label="Spelling answer ${index + 1}" autocomplete="off">
            </label>
          `).join("")}
        </div>
        <p class="feedback" id="year34SpellingFeedback"></p>
        <div class="actions-row">
          <button class="primary-action english-action" type="button" id="checkYear34Spelling">Check Spellings</button>
          <button class="primary-action secondary-action" type="button" id="clearYear34Spelling">Clear</button>
        </div>
      </section>
    `;

    app.querySelector("#checkYear34Spelling").addEventListener("click", () => checkYear34SpellingAnswers(worksheet));
    app.querySelector("#clearYear34Spelling").addEventListener("click", () => renderYear34SpellingPractice(worksheetNumber));
  }

  function checkEnglishSpellingAnswers(worksheet) {
    let correct = 0;
    const cards = app.querySelectorAll(".sentence-card");

    worksheet.items.forEach((item, index) => {
      const card = cards[index];
      const input = card.querySelector("input");
      const value = normalizeTypedAnswer(input.value);
      const isCorrect = value !== "" && value === normalizeTypedAnswer(item.answer);
      card.classList.toggle("correct", isCorrect);
      card.classList.toggle("wrong", !isCorrect);
      input.value = input.value.trim();
      if (isCorrect) correct += 1;
    });

    const percent = Math.round((correct / worksheet.items.length) * 100);
    const rewards = saveEnglishSpellingAttempt(worksheet.worksheet, percent);
    updateTotalProgress();
    app.querySelector("#spellingFeedback").textContent = `${resultMessage(percent)} You fixed ${correct} out of ${worksheet.items.length}. Attempt saved.`;

    if (rewards.length) {
      showRewardReveal(rewards, "Spelling reward unlocked!");
    }
  }

  function checkYear34SpellingAnswers(worksheet) {
    let correct = 0;
    const cards = app.querySelectorAll("[data-year34-sentence]");

    worksheet.items.forEach((item, index) => {
      const card = cards[index];
      const input = card.querySelector("input");
      const value = normalizeTypedAnswer(input.value);
      const isCorrect = value !== "" && value === normalizeTypedAnswer(item.answer);
      card.classList.toggle("correct", isCorrect);
      card.classList.toggle("wrong", !isCorrect);
      input.value = input.value.trim();
      if (isCorrect) correct += 1;
    });

    const percent = Math.round((correct / worksheet.items.length) * 100);
    const rewards = saveYear34SpellingAttempt(worksheet.worksheet, percent);
    updateTotalProgress();
    app.querySelector("#year34SpellingFeedback").textContent = `${resultMessage(percent)} You fixed ${correct} out of ${worksheet.items.length}. Attempt saved.`;

    if (rewards.length) {
      showRewardReveal(rewards, "Spelling reward unlocked!");
    }
  }

  function renderColumnMathsPractice() {
    pageTitle.textContent = "Column Maths";
    backButton.classList.remove("hidden");

    app.innerHTML = `
      <section class="panel times-practice">
        <div class="quiz-topline">
          <span>${getActiveProfile().name}</span>
          <span>${columnMathsAttemptLabel()}</span>
        </div>
        <div class="column-maths-grid">
          ${year4ColumnMaths.questions.map((question, index) => `
            ${columnMathsCard(question, index)}
          `).join("")}
        </div>
        <p class="feedback" id="columnMathsFeedback"></p>
        <div class="actions-row">
          <button class="primary-action times-action" type="button" id="checkColumnMaths">Check Answers</button>
          <button class="primary-action secondary-action" type="button" id="clearColumnMaths">Clear</button>
        </div>
      </section>
    `;

    app.querySelector("#checkColumnMaths").addEventListener("click", checkColumnMathsAnswers);
    app.querySelector("#clearColumnMaths").addEventListener("click", renderColumnMathsPractice);
  }

  function columnMathsCard(question, index) {
    const { top, bottom, operator } = splitColumnPrompt(question.prompt);
    const width = Math.max(String(top).length, String(bottom).length + 1, String(question.answer).length, 4);

    return `
      <label class="column-card" data-column-sum="${index}">
        <span class="column-label">${question.label}.</span>
        <span class="sr-only">${question.prompt}</span>
        <div class="column-work" style="--digits: ${width}">
          <div class="column-line top">${padColumnValue(top, width)}</div>
          <div class="column-line bottom">${operator}${padColumnValue(bottom, width - 1)}</div>
          <div class="column-rule"></div>
          <input class="column-answer" inputmode="numeric" pattern="[0-9]*" type="text" aria-label="Answer ${question.label}">
        </div>
      </label>
    `;
  }

  function splitColumnPrompt(prompt) {
    const match = String(prompt).match(/^\s*(\d+)\s*([+-])\s*(\d+)\s*$/);
    if (!match) {
      return { top: "", bottom: String(prompt), operator: "" };
    }

    return {
      top: match[1],
      operator: match[2],
      bottom: match[3]
    };
  }

  function padColumnValue(value, width) {
    return String(value).padStart(width, " ");
  }

  function renderMathsWorkbookMenu() {
    pageTitle.textContent = "Maths Workbook";
    backButton.classList.remove("hidden");

    app.innerHTML = `
      <section class="workbook-menu-page">
        <div class="workbook-banner">
          <h2>${year4MathsWorkbook.title}</h2>
        </div>
        <div class="workbook-note">
          <p>${getActiveProfile().name} can open each workbook page as an interactive worksheet.</p>
        </div>
        <div class="booklet-list workbook-menu-list">
          ${year4MathsWorkbook.activities.map((activity) => `
            <article class="booklet-card workbook-menu-card">
              <div>
                <h3>Page ${activity.page}</h3>
                <p>${activity.title}</p>
              </div>
              <div class="single-action-grid">
                <button class="day-button ${getWorkbookRecord(activity.id).completed ? "done" : ""}" type="button" data-workbook-activity="${activity.id}">
                  <span>Open Activity</span>
                  <small>${workbookStatusLabel(activity.id)}</small>
                </button>
              </div>
            </article>
          `).join("")}
        </div>
        </div>
      </section>
    `;

    app.querySelectorAll("[data-workbook-activity]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = `maths-workbook/${button.dataset.workbookActivity}`;
      });
    });
  }

  function renderMathsWorkbookActivity(activityId) {
    const activity = year4MathsWorkbook.activities.find((item) => item.id === activityId);
    if (!activity) {
      location.hash = "maths-workbook";
      return;
    }

    pageTitle.textContent = activity.title;
    backButton.classList.remove("hidden");

    if (activity.type === "table-double") return renderWorkbookTableDouble(activity);
    if (activity.type === "multiplication-wheels") return renderWorkbookWheels(activity, "multiply");
    if (activity.type === "division-wheels") return renderWorkbookWheels(activity, "divide");
    if (activity.type === "triangles") return renderWorkbookTriangles(activity);
    if (activity.type === "grid-method") return renderWorkbookGridMethod(activity);
    if (activity.type === "missing-number") return renderWorkbookMissingNumber(activity);
    if (activity.type === "word-problems") return renderWorkbookWordProblems(activity);
  }

  function workbookPageShell(activity, bodyMarkup, extraClass = "") {
    return `
      <section class="workbook-page ${extraClass}">
        <div class="workbook-banner">
          <h2>${escapeHtml(activity.title)}</h2>
        </div>
        ${activity.instruction ? `
          <div class="workbook-note">
            <p>${escapeHtml(activity.instruction)}</p>
          </div>
        ` : ""}
        <div class="workbook-status">
          <span>${escapeHtml(getActiveProfile().name)}</span>
          <span>${workbookAttemptLabel(activity.id)}</span>
        </div>
        ${bodyMarkup}
        <p class="feedback workbook-feedback" id="workbookFeedback"></p>
        <div class="actions-row workbook-actions">
          <button class="primary-action times-action" type="button" id="checkWorkbook">Check Answers</button>
          <button class="primary-action secondary-action" type="button" id="clearWorkbook">Clear</button>
        </div>
        <div class="workbook-footer">
          <span>Page ${activity.page} of 16</span>
        </div>
      </section>
    `;
  }

  function renderWorkbookTableDouble(activity) {
    app.innerHTML = workbookPageShell(activity, `
      <div class="table-double-sheet">
        <div class="table-double-head">
          <span>Number</span>
          <span>x2</span>
          <span>x4</span>
          <span>x8</span>
        </div>
        ${activity.items.map((item, index) => `
          <div class="table-double-row" data-workbook-item="${index}">
            <span class="number-cell">${item.label}</span>
            ${item.answers.map((answer, answerIndex) => item.locked?.[answerIndex]
              ? `<span class="locked-cell">${answer}</span>`
              : `<input inputmode="numeric" type="text" aria-label="${item.label} column ${answerIndex + 1}" data-answer="${answer}">`
            ).join("")}
          </div>
        `).join("")}
      </div>
    `, "workbook-table-page");

    app.querySelector("#checkWorkbook").addEventListener("click", () => checkWorkbookTableDouble(activity));
    app.querySelector("#clearWorkbook").addEventListener("click", () => renderWorkbookTableDouble(activity));
  }

  function renderWorkbookWheels(activity, operator) {
    app.innerHTML = workbookPageShell(activity, `
      <div class="wheel-sheet">
        ${activity.wheels.map((wheel, index) => workbookWheelMarkup(wheel, index, operator)).join("")}
      </div>
    `, "workbook-wheel-page");

    app.querySelector("#checkWorkbook").addEventListener("click", () => checkWorkbookWheels(activity, operator));
    app.querySelector("#clearWorkbook").addEventListener("click", () => renderWorkbookWheels(activity, operator));
  }

  function workbookWheelMarkup(wheel, index, operator) {
    const positions = wheelPositions();
    const isMultiply = operator === "multiply";
    const centerLabel = `${isMultiply ? "x" : "÷"}${wheel.center}`;
    return `
      <div class="wheel-card" data-workbook-item="${index}">
        <div class="wheel-shell">
          <svg class="wheel-lines" viewBox="0 0 220 220" aria-hidden="true">
            <circle cx="110" cy="110" r="92"></circle>
            <circle cx="110" cy="110" r="58"></circle>
            <circle cx="110" cy="110" r="32"></circle>
            ${positions.map((_, lineIndex) => {
              const angle = (-90 + lineIndex * 30) * (Math.PI / 180);
              const x = 110 + Math.cos(angle) * 92;
              const y = 110 + Math.sin(angle) * 92;
              return `<line x1="110" y1="110" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}"></line>`;
            }).join("")}
          </svg>
          <div class="wheel-center">${centerLabel}</div>
          ${wheel.numbers.map((number, numberIndex) => `
            <span class="wheel-number" style="--x:${positions[numberIndex].innerX}%;--y:${positions[numberIndex].innerY}%">${number}</span>
          `).join("")}
          ${wheel.numbers.map((number, numberIndex) => `
            <input class="wheel-answer" data-answer="${isMultiply ? number * wheel.center : number / wheel.center}" style="--x:${positions[numberIndex].outerX}%;--y:${positions[numberIndex].outerY}%"
              inputmode="numeric" type="text" aria-label="Wheel ${wheel.center} answer ${numberIndex + 1}">
          `).join("")}
        </div>
      </div>
    `;
  }

  function wheelPositions() {
    return Array.from({ length: 12 }, (_, index) => {
      const angle = ((-60 + index * 30) * Math.PI) / 180;
      const innerRadius = 33;
      const outerRadius = 44;
      return {
        innerX: 50 + Math.cos(angle) * innerRadius,
        innerY: 50 + Math.sin(angle) * innerRadius,
        outerX: 50 + Math.cos(angle) * outerRadius,
        outerY: 50 + Math.sin(angle) * outerRadius
      };
    });
  }

  function renderWorkbookTriangles(activity) {
    app.innerHTML = workbookPageShell(activity, `
      <div class="triangle-sheet">
        ${activity.items.map((item, index) => workbookTriangleMarkup(item, index)).join("")}
      </div>
    `, "workbook-triangle-page");

    app.querySelector("#checkWorkbook").addEventListener("click", () => checkWorkbookTriangles(activity));
    app.querySelector("#clearWorkbook").addEventListener("click", () => renderWorkbookTriangles(activity));
  }

  function workbookTriangleMarkup(item, index) {
    const topMarkup = item.top === null
      ? `<input class="triangle-input triangle-input-top" data-answer="${item.answer}" inputmode="numeric" type="text" aria-label="Triangle ${item.number} top answer">`
      : `<span class="triangle-top">${item.top}</span>`;
    const leftMarkup = item.left === null
      ? `<input class="triangle-input triangle-input-left" data-answer="${item.answer}" inputmode="numeric" type="text" aria-label="Triangle ${item.number} left answer">`
      : `<span class="triangle-left">${item.left}</span>`;
    const rightMarkup = item.right === null
      ? `<input class="triangle-input triangle-input-right" data-answer="${item.answer}" inputmode="numeric" type="text" aria-label="Triangle ${item.number} right answer">`
      : `<span class="triangle-right">${item.right}</span>`;
    return `
      <div class="triangle-card triangle-${item.color}" data-workbook-item="${index}">
        <span class="triangle-number">${item.number}</span>
        <div class="triangle-shape">
          <svg viewBox="0 0 240 200" aria-hidden="true">
            <path d="M120 16 L24 184 L216 184 Z"></path>
          </svg>
          ${topMarkup}
          ${leftMarkup}
          <span class="triangle-multiply">x</span>
          ${rightMarkup}
        </div>
      </div>
    `;
  }

  function renderWorkbookGridMethod(activity) {
    app.innerHTML = workbookPageShell(activity, `
      <div class="grid-method-sheet">
        ${activity.items.map((item, index) => `
          <div class="grid-method-card" data-workbook-item="${index}">
            <span class="grid-number">${item.number}</span>
            <div class="grid-table">
              <span class="grid-x">x</span>
              <span class="grid-top">${item.top[0]}</span>
              <span class="grid-top">${item.top[1]}</span>
              <span class="grid-left">${item.left}</span>
              <input data-answer="${item.answers[0]}" inputmode="numeric" type="text" aria-label="Grid ${item.number} first box">
              <input data-answer="${item.answers[1]}" inputmode="numeric" type="text" aria-label="Grid ${item.number} second box">
            </div>
          </div>
        `).join("")}
      </div>
    `, "workbook-grid-page");

    app.querySelector("#checkWorkbook").addEventListener("click", () => checkWorkbookInputsByDataAnswer(activity));
    app.querySelector("#clearWorkbook").addEventListener("click", () => renderWorkbookGridMethod(activity));
  }

  function renderWorkbookMissingNumber(activity) {
    app.innerHTML = workbookPageShell(activity, `
      <div class="missing-number-sheet">
        ${activity.items.map((item, index) => `
          <div class="missing-number-card" data-workbook-item="${index}">
            <span class="missing-number-badge">${item.number}</span>
            <div class="missing-sum">
              <div class="sum-top">
                ${item.top.map((digit) => digit === null
                  ? `<input class="missing-digit" data-answer="${item.answer}" inputmode="numeric" maxlength="1" type="text" aria-label="Missing digit ${item.number}">`
                  : `<span>${digit}</span>`
                ).join("")}
              </div>
              <div class="sum-multiplier">
                <span>x</span>
                ${item.multiplier === null
                  ? `<input class="missing-digit" data-answer="${item.answer}" inputmode="numeric" maxlength="1" type="text" aria-label="Missing multiplier ${item.number}">`
                  : `<span>${item.multiplier}</span>`}
              </div>
              <div class="sum-rule"></div>
              <div class="sum-product">${item.product.split("").map((digit) => `<span>${digit}</span>`).join("")}</div>
            </div>
          </div>
        `).join("")}
      </div>
    `, "workbook-missing-page");

    app.querySelector("#checkWorkbook").addEventListener("click", () => checkWorkbookInputsByDataAnswer(activity));
    app.querySelector("#clearWorkbook").addEventListener("click", () => renderWorkbookMissingNumber(activity));
  }

  function renderWorkbookWordProblems(activity) {
    app.innerHTML = workbookPageShell(activity, `
      <div class="word-problem-sheet">
        ${activity.items.map((item, index) => `
          <div class="word-problem-card" data-workbook-item="${index}">
            <div class="word-copy">
              <p><strong>${item.number}.</strong> ${item.prompt}</p>
              <input class="word-answer" data-answer="${item.answer}" inputmode="numeric" type="text" aria-label="Word problem ${item.number}">
            </div>
            <svg class="word-art" viewBox="0 0 200 200" aria-hidden="true">
              <use href="assets/workbook-icons.svg#${item.asset}"></use>
            </svg>
          </div>
        `).join("")}
      </div>
    `, "workbook-word-page");

    app.querySelector("#checkWorkbook").addEventListener("click", () => checkWorkbookInputsByDataAnswer(activity));
    app.querySelector("#clearWorkbook").addEventListener("click", () => renderWorkbookWordProblems(activity));
  }

  function checkWorkbookTableDouble(activity) {
    let correct = 0;
    let total = 0;
    const cards = app.querySelectorAll("[data-workbook-item]");
    cards.forEach((card) => {
      const inputs = card.querySelectorAll("input");
      let itemCorrect = true;
      inputs.forEach((input) => {
        total += 1;
        const expected = Number(input.dataset.answer);
        const actual = Number(input.value.trim());
        const isCorrect = input.value.trim() !== "" && actual === expected;
        if (isCorrect) {
          correct += 1;
        } else {
          itemCorrect = false;
        }
      });
      card.classList.toggle("correct", itemCorrect);
      card.classList.toggle("wrong", !itemCorrect);
    });
    finishWorkbookAttempt(activity.id, correct, total);
  }

  function checkWorkbookWheels(activity, operator) {
    let correct = 0;
    let total = 0;
    const cards = app.querySelectorAll("[data-workbook-item]");
    cards.forEach((card) => {
      const inputs = card.querySelectorAll("input");
      let itemCorrect = true;
      inputs.forEach((input) => {
        total += 1;
        const expected = Number(input.dataset.answer);
        const actual = Number(input.value.trim());
        const isCorrect = input.value.trim() !== "" && actual === expected;
        if (isCorrect) {
          correct += 1;
        } else {
          itemCorrect = false;
        }
      });
      card.classList.toggle("correct", itemCorrect);
      card.classList.toggle("wrong", !itemCorrect);
    });
    finishWorkbookAttempt(activity.id, correct, total);
  }

  function checkWorkbookTriangles(activity) {
    let correct = 0;
    let total = 0;
    const cards = app.querySelectorAll("[data-workbook-item]");
    cards.forEach((card) => {
      const input = card.querySelector("input");
      total += 1;
      const expected = Number(input.dataset.answer);
      const actual = Number(input.value.trim());
      const isCorrect = input.value.trim() !== "" && actual === expected;
      if (isCorrect) correct += 1;
      card.classList.toggle("correct", isCorrect);
      card.classList.toggle("wrong", !isCorrect);
    });
    finishWorkbookAttempt(activity.id, correct, total);
  }

  function checkWorkbookInputsByDataAnswer(activity) {
    let correct = 0;
    let total = 0;
    const cards = app.querySelectorAll("[data-workbook-item]");
    cards.forEach((card) => {
      const inputs = card.querySelectorAll("input");
      let itemCorrect = true;
      inputs.forEach((input) => {
        total += 1;
        const expected = Number(input.dataset.answer);
        const actual = Number(input.value.trim());
        const isCorrect = input.value.trim() !== "" && actual === expected;
        if (isCorrect) {
          correct += 1;
        } else {
          itemCorrect = false;
        }
      });
      card.classList.toggle("correct", itemCorrect);
      card.classList.toggle("wrong", !itemCorrect);
    });
    finishWorkbookAttempt(activity.id, correct, total);
  }

  function finishWorkbookAttempt(activityId, correct, total) {
    const percent = Math.round((correct / total) * 100);
    const rewards = saveWorkbookAttempt(activityId, percent);
    updateTotalProgress();
    app.querySelector("#workbookFeedback").textContent = `${resultMessage(percent)} You got ${correct} out of ${total}. Attempt saved.`;

    if (rewards.length) {
      showRewardReveal(rewards, "Workbook reward unlocked!");
    }
  }

  function checkColumnMathsAnswers() {
    let correct = 0;
    const cards = app.querySelectorAll("[data-column-sum]");

    year4ColumnMaths.questions.forEach((question, index) => {
      const card = cards[index];
      const input = card.querySelector("input");
      const value = Number(input.value.trim());
      const isCorrect = input.value.trim() !== "" && value === question.answer;
      card.classList.toggle("correct", isCorrect);
      card.classList.toggle("wrong", !isCorrect);
      input.value = input.value.trim();
      if (isCorrect) correct += 1;
    });

    const percent = Math.round((correct / year4ColumnMaths.questions.length) * 100);
    const rewards = saveColumnMathsAttempt(percent);
    updateTotalProgress();
    app.querySelector("#columnMathsFeedback").textContent = `${resultMessage(percent)} You got ${correct} out of ${year4ColumnMaths.questions.length}. Attempt saved.`;

    if (rewards.length) {
      showRewardReveal(rewards, "Maths reward unlocked!");
    }
  }

  function renderTimesTableMenu() {
    pageTitle.textContent = "Year 4 Times Tables";
    backButton.classList.remove("hidden");
    quizState = null;

    app.innerHTML = `
      <section class="panel times-menu">
        <div class="times-heading">
          <div>
            <h2>Daily Practice Booklets</h2>
            <p>${getActiveProfile().name} can choose a booklet and day. Each challenge has 24 quick-fire questions.</p>
          </div>
          <span class="selected-badge">${year4TimesTables.length} booklets</span>
        </div>
        <div class="booklet-list">
          ${year4TimesTables.map((booklet) => `
            <article class="booklet-card">
              <div>
                <h3>Booklet ${booklet.booklet}</h3>
                <p>${booklet.days.length} daily challenges</p>
              </div>
              <div class="day-grid">
                ${booklet.days.map((day) => `
                  <button class="day-button ${getTimesRecord(booklet.booklet, day.day).completed ? "done" : ""}" type="button" data-booklet="${booklet.booklet}" data-day="${day.day}">
                    <span>Day ${day.day}</span>
                    <small>${timesStatusLabel(booklet.booklet, day.day)}</small>
                  </button>
                `).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;

    app.querySelectorAll("[data-booklet][data-day]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = `times-practice/${button.dataset.booklet}/${button.dataset.day}`;
      });
    });
  }

  function renderTimesPractice(bookletNumber, dayNumber) {
    const booklet = year4TimesTables.find((item) => item.booklet === bookletNumber);
    const day = booklet?.days.find((item) => item.day === dayNumber);
    if (!booklet || !day) {
      location.hash = "times";
      return;
    }

    pageTitle.textContent = `Booklet ${bookletNumber} Day ${dayNumber}`;
    backButton.classList.remove("hidden");

    app.innerHTML = `
      <section class="panel times-practice">
        <div class="quiz-topline">
          <span>${getActiveProfile().name}</span>
          <span>${timesAttemptLabel(bookletNumber, dayNumber)}</span>
        </div>
        <div class="times-grid">
          ${day.questions.map((question, index) => `
            <label class="sum-card" data-sum="${index}">
              <span>${question.left} ${question.op} ${question.right} =</span>
              <input inputmode="numeric" pattern="[0-9]*" type="text" aria-label="Answer ${index + 1}">
            </label>
          `).join("")}
        </div>
        <p class="feedback" id="timesFeedback"></p>
        <div class="actions-row">
          <button class="primary-action" type="button" id="checkTimes">Check Answers</button>
          <button class="primary-action secondary-action" type="button" id="clearTimes">Clear</button>
        </div>
      </section>
    `;

    app.querySelector("#checkTimes").addEventListener("click", () => checkTimesAnswers(booklet, day));
    app.querySelector("#clearTimes").addEventListener("click", () => renderTimesPractice(bookletNumber, dayNumber));
  }

  function checkTimesAnswers(booklet, day) {
    let correct = 0;
    const cards = app.querySelectorAll(".sum-card");

    day.questions.forEach((question, index) => {
      const card = cards[index];
      const input = card.querySelector("input");
      const value = Number(input.value.trim());
      const isCorrect = input.value.trim() !== "" && value === question.answer;

      card.classList.toggle("correct", isCorrect);
      card.classList.toggle("wrong", !isCorrect);
      input.value = input.value.trim();

      if (isCorrect) {
        correct += 1;
      }
    });

    const percent = Math.round((correct / day.questions.length) * 100);
    const rewards = saveTimesAttempt(booklet.booklet, day.day, percent);
    updateTotalProgress();
    app.querySelector("#timesFeedback").textContent = `${resultMessage(percent)} You got ${correct} out of ${day.questions.length}. Attempt saved.`;

    if (rewards.length) {
      showRewardReveal(rewards, "Times-table reward unlocked!");
    }
  }

  function startQuiz(subject, year) {
    selectedYear = year;
    quizState = {
      subject,
      year,
      index: 0,
      score: 0,
      answered: false,
      questions: subjects[subject].years[year] || []
    };
  }

  function renderQuiz() {
    const subject = subjects[quizState.subject];
    const question = quizState.questions[quizState.index];
    pageTitle.textContent = `${subject.name} ${quizState.year}`;
    backButton.classList.remove("hidden");

    if (!question) {
      renderResult();
      return;
    }

    app.innerHTML = `
      <section class="panel quiz-card" style="--active-color: ${subject.color}">
        <div class="quiz-topline">
          <span>Question ${quizState.index + 1} of ${quizState.questions.length}</span>
          <span>Score ${quizState.score}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${(quizState.index / quizState.questions.length) * 100}%"></div>
        </div>
        <h2 class="question-text">${question.question}</h2>
        <div class="answers-grid">
          ${question.options.map((option, index) => `
            <button class="answer-button" type="button" data-answer="${index}">${option}</button>
          `).join("")}
        </div>
        <p class="feedback" id="feedback"></p>
      </section>
    `;

    app.querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => chooseAnswer(Number(button.dataset.answer)));
    });
  }

  function chooseAnswer(answerIndex) {
    if (quizState.answered) return;

    quizState.answered = true;
    const question = quizState.questions[quizState.index];
    const buttons = app.querySelectorAll("[data-answer]");
    const feedback = app.querySelector("#feedback");
    const isCorrect = answerIndex === question.answer;

    buttons.forEach((button) => {
      const optionIndex = Number(button.dataset.answer);
      button.disabled = true;
      if (optionIndex === question.answer) button.classList.add("correct");
      if (optionIndex === answerIndex && !isCorrect) button.classList.add("wrong");
    });

    if (isCorrect) {
      quizState.score += 1;
      feedback.textContent = encouragement[Math.floor(Math.random() * encouragement.length)];
    } else {
      feedback.textContent = "Good try!";
    }

    setTimeout(() => {
      quizState.index += 1;
      quizState.answered = false;
      renderQuiz();
    }, 1100);
  }

  function renderResult() {
    const subject = subjects[quizState.subject];
    const percent = Math.round((quizState.score / quizState.questions.length) * 100);
    saveYearProgress(quizState.subject, quizState.year, percent);
    updateTotalProgress();

    app.innerHTML = `
      <section class="panel quiz-card result-card" style="--active-color: ${subject.color}">
        <span class="selected-badge">${quizState.year}</span>
        <h2>${resultMessage(percent)}</h2>
        <div class="result-score">${percent}%</div>
        <p>You scored ${quizState.score} out of ${quizState.questions.length}.</p>
        <div class="actions-row">
          <button class="primary-action" type="button" id="tryAgain">Try Again</button>
          <button class="primary-action" type="button" id="chooseYear">Choose Year</button>
        </div>
      </section>
    `;

    app.querySelector("#tryAgain").addEventListener("click", () => {
      startQuiz(quizState.subject, quizState.year);
      renderQuiz();
    });

    app.querySelector("#chooseYear").addEventListener("click", () => {
      location.hash = `subject/${quizState.subject}`;
    });
  }

  function resultMessage(percent) {
    if (percent === 100) return "Perfect Quest!";
    if (percent >= 75) return "Amazing Effort!";
    if (percent >= 50) return "Great Learning!";
    return "Keep Practising!";
  }

  function getProgressStore() {
    return getActiveProfile().progress;
  }

  function setProgressStore(progress) {
    const state = getProfileState();
    state.profiles[state.activeId].progress = progress;
    saveProfileState(state);
  }

  function getProfileState() {
    try {
      const state = JSON.parse(localStorage.getItem("schoolQuestProfiles"));
      if (state?.activeId && state.profiles?.[state.activeId]) {
        Object.keys(state.profiles).forEach((id) => {
          state.profiles[id] = normalizeProfile(state.profiles[id]);
        });
        return state;
      }
    } catch (error) {
      // Fall through to default state.
    }

    const oldProgress = getLegacyProgress();
    const id = createProfileId("Student");
    const state = {
      activeId: id,
      profiles: {
        [id]: {
          id,
          name: "Student",
          age: "",
          year: "Year 4",
          worksheetPacks: defaultWorksheetPacksForYear("Year 4"),
          progress: oldProgress
        }
      }
    };
    saveProfileState(state);
    return state;
  }

  function getLegacyProgress() {
    try {
      return JSON.parse(localStorage.getItem("schoolQuestProgress")) || {};
    } catch (error) {
      return {};
    }
  }

  function saveProfileState(state, options = {}) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem("schoolQuestProfiles", JSON.stringify(state));
    if (!options.skipCloud) queueCloudSave(state);
  }

  function getActiveProfile() {
    const state = getProfileState();
    return normalizeProfile(state.profiles[state.activeId]);
  }

  function saveYearProgress(subject, year, percent) {
    const store = getProgressStore();
    const key = `${subject}:${year}`;
    store[key] = Math.max(store[key] || 0, percent);
    setProgressStore(store);
  }

  function saveTimesAttempt(booklet, day, percent) {
    const store = getProgressStore();
    const key = `times:${booklet}:${day}`;
    const previous = normalizeTimesRecord(store[key]);
    store[key] = {
      best: Math.max(previous.best, percent),
      attempts: previous.attempts + 1,
      completed: true,
      lastScore: percent,
      perfectRewarded: previous.perfectRewarded || percent === 100,
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
    return awardRewardsForRecord(key, previous, percent);
  }

  function saveEnglishSpellingAttempt(worksheet, percent) {
    const store = getProgressStore();
    const key = `english-spelling:${worksheet}`;
    const previous = normalizeTimesRecord(store[key]);
    store[key] = {
      best: Math.max(previous.best, percent),
      attempts: previous.attempts + 1,
      completed: true,
      lastScore: percent,
      perfectRewarded: previous.perfectRewarded || percent === 100,
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
    return awardRewardsForRecord(key, previous, percent);
  }

  function saveYear34SpellingAttempt(worksheet, percent) {
    const store = getProgressStore();
    const key = `year34-spelling:${worksheet}`;
    const previous = normalizeTimesRecord(store[key]);
    store[key] = {
      best: Math.max(previous.best, percent),
      attempts: previous.attempts + 1,
      completed: true,
      lastScore: percent,
      perfectRewarded: previous.perfectRewarded || percent === 100,
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
    return awardRewardsForRecord(key, previous, percent);
  }

  function saveEnglishGrammarAttempt(test, percent) {
    const store = getProgressStore();
    const key = `english-grammar:${test}`;
    const previous = normalizeTimesRecord(store[key]);
    store[key] = {
      best: Math.max(previous.best, percent),
      attempts: previous.attempts + 1,
      completed: true,
      lastScore: percent,
      perfectRewarded: previous.perfectRewarded || percent === 100,
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
    return awardRewardsForRecord(key, previous, percent);
  }

  function saveTrickyWordsAttempt(sheet, percent) {
    const store = getProgressStore();
    const key = `tricky-words:${sheet}`;
    const previous = normalizeTimesRecord(store[key]);
    store[key] = {
      best: Math.max(previous.best, percent),
      attempts: previous.attempts + 1,
      completed: true,
      lastScore: percent,
      perfectRewarded: previous.perfectRewarded || percent === 100,
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
    return awardRewardsForRecord(key, previous, percent);
  }

  function saveColumnMathsAttempt(percent) {
    const store = getProgressStore();
    const key = "column-maths:1";
    const previous = normalizeTimesRecord(store[key]);
    store[key] = {
      best: Math.max(previous.best, percent),
      attempts: previous.attempts + 1,
      completed: true,
      lastScore: percent,
      perfectRewarded: previous.perfectRewarded || percent === 100,
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
    return awardRewardsForRecord(key, previous, percent);
  }

  function saveWorkbookAttempt(activityId, percent) {
    const store = getProgressStore();
    const key = `maths-workbook:${activityId}`;
    const previous = normalizeTimesRecord(store[key]);
    store[key] = {
      best: Math.max(previous.best, percent),
      attempts: previous.attempts + 1,
      completed: true,
      lastScore: percent,
      perfectRewarded: previous.perfectRewarded || percent === 100,
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
    return awardRewardsForRecord(key, previous, percent);
  }

  function getTimesProgress(booklet, day) {
    return normalizeTimesRecord(getProgressStore()[`times:${booklet}:${day}`]).best;
  }

  function getTimesRecord(booklet, day) {
    return normalizeTimesRecord(getProgressStore()[`times:${booklet}:${day}`]);
  }

  function getEnglishSpellingRecord(worksheet) {
    return normalizeTimesRecord(getProgressStore()[`english-spelling:${worksheet}`]);
  }

  function getEnglishGrammarRecord(test) {
    return normalizeTimesRecord(getProgressStore()[`english-grammar:${test}`]);
  }

  function getYear34SpellingRecord(worksheet) {
    return normalizeTimesRecord(getProgressStore()[`year34-spelling:${worksheet}`]);
  }

  function getTrickyWordsRecord(sheet) {
    return normalizeTimesRecord(getProgressStore()[`tricky-words:${sheet}`]);
  }

  function getColumnMathsRecord() {
    return normalizeTimesRecord(getProgressStore()["column-maths:1"]);
  }

  function getWorkbookRecord(activityId) {
    return normalizeTimesRecord(getProgressStore()[`maths-workbook:${activityId}`]);
  }

  function normalizeTimesRecord(value) {
    if (typeof value === "number") {
      return { best: value, attempts: value > 0 ? 1 : 0, completed: value > 0, lastScore: value, perfectRewarded: value === 100 };
    }

    return {
      best: Number(value?.best) || 0,
      attempts: Number(value?.attempts) || 0,
      completed: Boolean(value?.completed),
      lastScore: Number(value?.lastScore) || 0,
      perfectRewarded: Boolean(value?.perfectRewarded)
    };
  }

  function timesStatusLabel(booklet, day) {
    const record = getTimesRecord(booklet, day);
    if (!record.completed) return "Not done";
    return `Done ${record.best}% - ${record.attempts} tries`;
  }

  function timesAttemptLabel(booklet, day) {
    const record = getTimesRecord(booklet, day);
    return `Best ${record.best}% - Attempts ${record.attempts}`;
  }

  function englishSpellingStatusLabel(worksheet) {
    const record = getEnglishSpellingRecord(worksheet);
    if (!record.completed) return "Not done";
    return `Done ${record.best}% - ${record.attempts} tries`;
  }

  function englishSpellingAttemptLabel(worksheet) {
    const record = getEnglishSpellingRecord(worksheet);
    return `Best ${record.best}% - Attempts ${record.attempts}`;
  }

  function englishGrammarStatusLabel(test) {
    const record = getEnglishGrammarRecord(test);
    if (!record.completed) return "Not done";
    return `Done ${record.best}% - ${record.attempts} tries`;
  }

  function year34SpellingStatusLabel(worksheet) {
    const record = getYear34SpellingRecord(worksheet);
    if (!record.completed) return "Not done";
    return `Done ${record.best}% - ${record.attempts} tries`;
  }

  function year34SpellingAttemptLabel(worksheet) {
    const record = getYear34SpellingRecord(worksheet);
    return `Best ${record.best}% - Attempts ${record.attempts}`;
  }

  function trickyWordsStatusLabel(sheet) {
    const record = getTrickyWordsRecord(sheet);
    if (!record.completed) return "Not done";
    return `Done ${record.best}% - ${record.attempts} tries`;
  }

  function columnMathsAttemptLabel() {
    const record = getColumnMathsRecord();
    return `Best ${record.best}% - Attempts ${record.attempts}`;
  }

  function workbookStatusLabel(activityId) {
    const record = getWorkbookRecord(activityId);
    if (!record.completed) return "Not done";
    return `Done ${record.best}% - ${record.attempts} tries`;
  }

  function workbookAttemptLabel(activityId) {
    const record = getWorkbookRecord(activityId);
    return `Best ${record.best}% - Attempts ${record.attempts}`;
  }

  function getYearProgress(subject, year) {
    return getProgressStore()[`${subject}:${year}`] || 0;
  }

  function getSubjectProgress(subject) {
    const studentYears = getStudentYears();
    const total = studentYears.reduce((sum, year) => sum + getYearProgress(subject, year), 0);
    return Math.round(total / studentYears.length);
  }

  function getYearProgressText(subject, year) {
    const progress = getYearProgress(subject, year);
    if (progress > 0) return `Best score saved: ${progress}%. Ready to beat it?`;
    return "No score yet. Time for your first quest!";
  }

  function updateTotalProgress() {
    const studentYears = getStudentYears();
    const slots = subjectKeys.length * studentYears.length;
    const total = subjectKeys.reduce((sum, subject) => {
      return sum + studentYears.reduce((yearSum, year) => yearSum + getYearProgress(subject, year), 0);
    }, 0);
    totalProgress.textContent = `${Math.round(total / slots)}%`;
  }

  function awardRewardsForRecord(activityKey, previousRecord, percent) {
    const rewards = [];
    if (!previousRecord.completed) {
      rewards.push(...unlockRandomRewards(1, activityKey, "completed"));
    }
    if (percent === 100 && !previousRecord.perfectRewarded) {
      rewards.push(...unlockRandomRewards(1, activityKey, "perfect"));
    }
    return rewards;
  }

  function unlockRandomRewards(count, activityKey, reason) {
    if (!rewardSet.length) return [];

    const state = getProfileState();
    const profile = normalizeProfile(state.profiles[state.activeId]);
    const rewards = normalizeRewardState(profile.rewards);
    const unlocked = [];
    const now = new Date().toISOString();
    const pool = rewardSet.filter((item) => !rewards.inventory.some((entry) => entry.id === item.id));

    for (let index = 0; index < count; index += 1) {
      const reward = pickRewardByRarity(pool);
      if (!reward) break;
      unlocked.push(reward);
      rewards.inventory.push({
        id: reward.id,
        rarity: reward.rarity,
        name: reward.name,
        image: reward.image,
        unlockedAt: now,
        activityKey,
        reason
      });
      rewards.claimedActivities[`${activityKey}:${reason}`] = true;
      rewards.totalRolls += 1;

      const rewardIndex = pool.findIndex((item) => item.id === reward.id);
      if (rewardIndex >= 0) pool.splice(rewardIndex, 1);
    }

    if (unlocked.length) {
      rewards.lastUnlockedAt = now;
      profile.rewards = rewards;
      state.profiles[state.activeId] = normalizeProfile(profile);
      saveProfileState(state);
    }

    return unlocked;
  }

  function pickRewardByRarity(pool) {
    if (!pool.length) return null;

    const weighted = [
      { rarity: "legendary", weight: 1 },
      { rarity: "epic", weight: 5 },
      { rarity: "rare", weight: 12 },
      { rarity: "uncommon", weight: 22 },
      { rarity: "common", weight: 60 }
    ];

    const available = weighted.filter((entry) => pool.some((item) => item.rarity === entry.rarity));
    const totalWeight = available.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of available) {
      roll -= entry.weight;
      if (roll <= 0) {
        const matches = pool.filter((item) => item.rarity === entry.rarity);
        return matches[Math.floor(Math.random() * matches.length)];
      }
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  function normalizeRewardState(rewards) {
    return {
      inventory: Array.isArray(rewards?.inventory)
        ? rewards.inventory.filter((entry) => rewardSet.some((item) => item.id === entry.id)).map((entry) => ({
            id: entry.id,
            rarity: entry.rarity || getRewardById(entry.id)?.rarity || "common",
            name: entry.name || getRewardById(entry.id)?.name || entry.id,
            image: entry.image || getRewardById(entry.id)?.image || "",
            unlockedAt: entry.unlockedAt || ""
          }))
        : [],
      claimedActivities: rewards?.claimedActivities || {},
      totalRolls: Number(rewards?.totalRolls) || 0,
      lastUnlockedAt: rewards?.lastUnlockedAt || ""
    };
  }

  function getRewardById(id) {
    return rewardSet.find((item) => item.id === id) || null;
  }

  function getRewardSummary() {
    const inventory = normalizeRewardState(getActiveProfile().rewards).inventory;
    const byRarity = rarityOrder.reduce((summary, rarity) => {
      summary[rarity] = inventory.filter((entry) => entry.rarity === rarity).length;
      return summary;
    }, {});

    return {
      total: rewardSet.length,
      unlocked: inventory.length,
      locked: Math.max(rewardSet.length - inventory.length, 0),
      byRarity
    };
  }

  function renderRewardsGallery() {
    const profile = getActiveProfile();
    const rewards = normalizeRewardState(profile.rewards).inventory
      .sort((left, right) => new Date(right.unlockedAt || 0) - new Date(left.unlockedAt || 0));
    const summary = getRewardSummary();

    pageTitle.textContent = "Collection";
    backButton.classList.remove("hidden");
    quizState = null;
    grammarQuizState = null;

    app.innerHTML = `
      <section class="panel rewards-panel">
        <div class="times-heading">
          <div>
            <span class="profile-chip">${escapeHtml(profile.name)}'s rewards</span>
            <h2>Quest Collection</h2>
            <p>Complete worksheets to unlock surprise cards. Perfect scores can unlock bonus cards too.</p>
          </div>
          <span class="selected-badge">${summary.unlocked} / ${summary.total}</span>
        </div>
        <div class="reward-stats">
          ${rarityOrder.map((rarity) => `
            <div class="stat-pill rarity-${rarity}">
              <strong>${rarityConfig[rarity].label}</strong>
              <span>${summary.byRarity[rarity] || 0}</span>
            </div>
          `).join("")}
        </div>
        ${rewards.length ? `
          <div class="reward-grid">
            ${rewards.map((reward) => `
              <article class="reward-card rarity-${reward.rarity}">
                <div class="reward-copy">
                  <span class="rarity-badge rarity-${reward.rarity}">${rarityConfig[reward.rarity].label}</span>
                  <h3>${escapeHtml(reward.name)}</h3>
                </div>
              </article>
            `).join("")}
          </div>
        ` : `
          <div class="empty-rewards">
            <h3>No rewards yet</h3>
            <p>Finish a worksheet and the collection will start filling up.</p>
          </div>
        `}
      </section>
    `;
  }

  function showRewardReveal(rewards, title) {
    rewardRevealState = { rewards, title };
    renderRewardOverlay();
  }

  function renderRewardOverlay() {
    removeRewardOverlay();
    if (!rewardRevealState) return;

    const overlay = document.createElement("div");
    overlay.id = "rewardOverlay";
    overlay.className = "password-overlay reward-overlay";
    overlay.innerHTML = `
      <div class="password-dialog reward-dialog">
        <h2>${escapeHtml(rewardRevealState.title)}</h2>
        <p>${rewardRevealState.rewards.length > 1 ? "A double reward drop!" : "A new card has joined the collection."}</p>
        <div class="reward-grid reveal-grid">
          ${rewardRevealState.rewards.map((reward) => `
            <article class="reward-card rarity-${reward.rarity}">
              <div class="reward-copy">
                <span class="rarity-badge rarity-${reward.rarity}">${rarityConfig[reward.rarity].label}</span>
                <h3>${escapeHtml(reward.name)}</h3>
                <p>${rarityConfig[reward.rarity].chance} drop chance</p>
              </div>
            </article>
          `).join("")}
        </div>
        <div class="actions-row">
          <button class="primary-action" type="button" id="rewardCollection">Open Collection</button>
          <button class="primary-action secondary-action" type="button" id="rewardClose">Keep Learning</button>
        </div>
      </div>
    `;
    body.appendChild(overlay);

    overlay.querySelector("#rewardCollection").addEventListener("click", () => {
      clearRewardReveal();
      location.hash = "rewards";
    });
    overlay.querySelector("#rewardClose").addEventListener("click", clearRewardReveal);
  }

  function clearRewardReveal() {
    rewardRevealState = null;
    removeRewardOverlay();
  }

  function removeRewardOverlay() {
    const overlay = document.querySelector("#rewardOverlay");
    if (overlay) overlay.remove();
  }

  function normalizeProfile(profile) {
    const year = years.includes(profile?.year) ? profile.year : "Year 4";
    const packs = Array.isArray(profile?.worksheetPacks) ? profile.worksheetPacks : [];
    const defaultPacks = defaultWorksheetPacksForYear(year);
    const mergedPacks = Array.from(new Set([...defaultPacks, ...packs]));

    return {
      id: profile?.id || createProfileId(profile?.name || "Student"),
      name: profile?.name || "Student",
      age: profile?.age || "",
      year,
      worksheetPacks: mergedPacks,
      progress: profile?.progress || {},
      rewards: normalizeRewardState(profile?.rewards)
    };
  }

  function getStudentYears() {
    return [getActiveProfile().year || "Year 4"];
  }

  function hasWorksheetAccess(packId) {
    return getActiveProfile().worksheetPacks.includes(packId);
  }

  function defaultWorksheetPacksForYear(year) {
    if (year === "Year 3") return ["year3-english-spelling", "year3-english-grammar", "year34-english-spelling"];
    if (year === "Year 4") return ["year4-times-tables", "year34-english-spelling", "year4-english-tricky-words", "year4-column-maths", "year4-maths-workbook"];
    return [];
  }

  function studentHomePanel() {
    const profile = getActiveProfile();
    const rewardSummary = getRewardSummary();
    return `
      <section class="student-hero">
        <div>
          <span class="profile-chip">Playing as ${escapeHtml(profile.name)} - ${escapeHtml(profile.year)}</span>
          <h2>Choose Your Learning Quest</h2>
          <p class="student-subline">${rewardSummary.unlocked} reward cards collected so far.</p>
        </div>
        <div class="hero-actions">
          <button class="adult-button collection-button" type="button" id="collectionButton">Collection</button>
          <button class="adult-button" type="button" id="adultButton">Adult</button>
        </div>
      </section>
    `;
  }

  function openAdultArea() {
    if (!adultUnlocked) {
      unlockAdultArea();
      return;
    }

    renderAdultArea();
  }

  function unlockAdultArea() {
    requestPassword("Adult password", () => {
      adultUnlocked = true;
      location.hash = "adult";
      renderAdultArea();
    });
  }

  function renderAdultArea() {
    pageTitle.textContent = "Adult";
    backButton.classList.remove("hidden");
    quizState = null;

    app.innerHTML = `
      ${profilePanel()}
      ${studentLearningPanel()}
      ${adultWorksheetResetPanel()}
      ${adultRewardsPanel()}
    `;

    wireProfilePanel();
    wireStudentLearningPanel();
    wireAdultWorksheetReset();
    wireAdultRewardsPanel();
  }

  function profilePanel() {
    const state = getProfileState();
    const profiles = Object.values(state.profiles);
    const cloud = cloudSnapshot();
    return `
      <section class="panel profile-panel">
        <div>
          <h2>Student Profiles</h2>
          <p>Progress, completed worksheets, and attempts are saved separately for each student.</p>
          <div class="cloud-box">
            <strong>Cloud sync</strong>
            <span id="cloudStatus">${escapeHtml(cloud.status)}</span>
          </div>
        </div>
        <div class="profile-controls">
          <label>
            <span>Current student</span>
            <select id="profileSelect">
              ${profiles.map((profile) => `
                <option value="${profile.id}" ${profile.id === state.activeId ? "selected" : ""}>${escapeHtml(profile.name)}</option>
              `).join("")}
            </select>
          </label>
          <label>
            <span>New student</span>
            <input id="newProfileName" type="text" maxlength="24" placeholder="Name">
          </label>
          <label>
            <span>Age</span>
            <input id="newProfileAge" type="number" min="1" max="18" placeholder="Age">
          </label>
          <label>
            <span>School year</span>
            <select id="newProfileYear">
              ${years.map((year) => `<option value="${year}" ${year === "Year 4" ? "selected" : ""}>${year}</option>`).join("")}
            </select>
          </label>
          <button class="primary-action" type="button" id="addProfile">Add Student</button>
          <button class="primary-action danger-action" type="button" id="resetStudent">Reset Student</button>
          <button class="primary-action cloud-action" type="button" id="cloudSignIn" ${cloud.configured && !cloud.user ? "" : "disabled"}>Sign in with Google</button>
          <button class="primary-action secondary-action" type="button" id="cloudSignOut" ${cloud.user ? "" : "disabled"}>Sign Out</button>
          <button class="primary-action cloud-action" type="button" id="cloudLoad" ${cloud.user ? "" : "disabled"}>Load from Cloud</button>
          <button class="primary-action cloud-action" type="button" id="cloudSave" ${cloud.user ? "" : "disabled"}>Save to Cloud</button>
        </div>
      </section>
    `;
  }

  function studentLearningPanel() {
    const profile = getActiveProfile();
    return `
      <section class="panel adult-settings-panel">
        <div>
          <h2>Student Learning Setup</h2>
          <p>Set the age, school year, and worksheet packs this student can access.</p>
        </div>
        <div class="student-learning-grid">
          <label>
            <span>Name</span>
            <input id="editProfileName" type="text" maxlength="24" value="${escapeHtml(profile.name)}">
          </label>
          <label>
            <span>Age</span>
            <input id="editProfileAge" type="number" min="1" max="18" value="${escapeHtml(String(profile.age || ""))}">
          </label>
          <label>
            <span>School year</span>
            <select id="editProfileYear">
              ${years.map((year) => `<option value="${year}" ${year === profile.year ? "selected" : ""}>${year}</option>`).join("")}
            </select>
          </label>
          <div class="worksheet-access">
            <strong>Worksheet packs</strong>
            ${worksheetPacks.map((pack) => `
              <label class="checkbox-row">
                <input type="checkbox" value="${pack.id}" ${profile.worksheetPacks.includes(pack.id) ? "checked" : ""}>
                <span>${pack.label}</span>
              </label>
            `).join("")}
          </div>
          <button class="primary-action" type="button" id="saveLearningSetup">Save Learning Setup</button>
        </div>
        <p class="feedback" id="learningFeedback"></p>
      </section>
    `;
  }

  function adultWorksheetResetPanel() {
    return `
      <section class="panel adult-settings-panel">
        <div>
          <h2>Worksheet Settings</h2>
          <p>Reset a saved worksheet or test for the current student without touching the rest of their progress.</p>
        </div>
        <div class="worksheet-reset-grid">
          <label>
            <span>Pack</span>
            <select id="resetPack">
              <option value="year4-times-tables">Year 4 Times Tables</option>
              <option value="year3-english-spelling">Year 3 Spelling Fix-Ups</option>
              <option value="year3-english-grammar">Year 3 Grammar Challenges</option>
              <option value="year34-english-spelling">Year 3 and 4 Spelling Sheets</option>
              <option value="year4-english-tricky-words">Year 4 Tricky Words</option>
              <option value="year4-column-maths">Year 4 Column Maths</option>
              <option value="year4-maths-workbook">Year 4 Maths Workbook</option>
            </select>
          </label>
          <label>
            <span>Worksheet / Booklet</span>
            <input id="resetBooklet" inputmode="numeric" type="number" min="1" max="26" value="1">
          </label>
          <label>
            <span>Day</span>
            <input id="resetDay" inputmode="numeric" type="number" min="1" max="11" value="1">
          </label>
          <button class="primary-action danger-action" type="button" id="resetWorksheet">Reset Worksheet</button>
        </div>
        <p class="feedback" id="adultFeedback"></p>
      </section>
    `;
  }

  function adultRewardsPanel() {
    const summary = getRewardSummary();
    return `
      <section class="panel adult-settings-panel">
        <div>
          <h2>Reward Collection</h2>
          <p>Each completed worksheet can unlock random reward cards, with some much harder to find.</p>
        </div>
        <div class="reward-admin-grid">
          <div class="reward-stats">
            <div class="stat-pill">Collected ${summary.unlocked} / ${summary.total}</div>
            ${rarityOrder.map((rarity) => `
              <div class="stat-pill rarity-${rarity}">${rarityConfig[rarity].label}: ${summary.byRarity[rarity] || 0}</div>
            `).join("")}
          </div>
          <div class="reward-admin-actions">
            <button class="primary-action secondary-action" type="button" id="viewRewardsFromAdult">View Collection</button>
            <button class="primary-action danger-action" type="button" id="resetRewards">Reset Rewards</button>
          </div>
        </div>
        <p class="feedback" id="rewardAdminFeedback"></p>
      </section>
    `;
  }

  function wireProfilePanel() {
    app.querySelector("#profileSelect").addEventListener("change", (event) => {
      const state = getProfileState();
      state.activeId = event.target.value;
      saveProfileState(state);
      updateTotalProgress();
      refreshCurrentArea();
    });

    app.querySelector("#addProfile").addEventListener("click", () => {
      const input = app.querySelector("#newProfileName");
      const ageInput = app.querySelector("#newProfileAge");
      const yearInput = app.querySelector("#newProfileYear");
      const name = input.value.trim();
      if (!name) return;

      const year = yearInput.value;
      const state = getProfileState();
      const id = createProfileId(name);
      state.profiles[id] = normalizeProfile({
        id,
        name,
        age: ageInput.value.trim(),
        year,
        worksheetPacks: defaultWorksheetPacksForYear(year),
        progress: {}
      });
      state.activeId = id;
      saveProfileState(state);
      refreshCurrentArea();
    });

    app.querySelector("#resetStudent").addEventListener("click", () => {
      requestPassword("Enter reset password", () => {
        const state = getProfileState();
        state.profiles[state.activeId].progress = {};
        state.profiles[state.activeId].rewards = normalizeRewardState();
        saveProfileState(state);
        updateTotalProgress();
        refreshCurrentArea();
      });
    });

    const signInButton = app.querySelector("#cloudSignIn");
    const signOutButton = app.querySelector("#cloudSignOut");
    const loadButton = app.querySelector("#cloudLoad");
    const saveButton = app.querySelector("#cloudSave");

    if (signInButton) {
      signInButton.addEventListener("click", signInCloud);
    }

    if (signOutButton) {
      signOutButton.addEventListener("click", signOutCloud);
    }

    if (loadButton) {
      loadButton.addEventListener("click", loadCloudProgress);
    }

    if (saveButton) {
      saveButton.addEventListener("click", saveCloudProgress);
    }
  }

  function wireStudentLearningPanel() {
    app.querySelector("#saveLearningSetup").addEventListener("click", () => {
      const state = getProfileState();
      const profile = state.profiles[state.activeId];
      const selectedPacks = Array.from(app.querySelectorAll(".worksheet-access input:checked")).map((input) => input.value);

      profile.name = app.querySelector("#editProfileName").value.trim() || profile.name;
      profile.age = app.querySelector("#editProfileAge").value.trim();
      profile.year = app.querySelector("#editProfileYear").value;
      profile.worksheetPacks = selectedPacks;
      state.profiles[state.activeId] = normalizeProfile(profile);
      saveProfileState(state);
      selectedYear = state.profiles[state.activeId].year;
      updateTotalProgress();
      renderAdultArea();
      const refreshedFeedback = app.querySelector("#learningFeedback");
      if (refreshedFeedback) refreshedFeedback.textContent = "Learning setup saved.";
    });
  }

  function refreshCurrentArea() {
    if (location.hash === "#adult" && adultUnlocked) {
      renderAdultArea();
      return;
    }

    renderDashboard();
  }

  function wireAdultWorksheetReset() {
    const packSelect = app.querySelector("#resetPack");
    const dayInput = app.querySelector("#resetDay");

    packSelect.addEventListener("change", () => {
      if (packSelect.value !== "year4-times-tables") {
        dayInput.disabled = true;
        dayInput.value = 1;
      } else {
        dayInput.disabled = false;
      }
    });

    app.querySelector("#resetWorksheet").addEventListener("click", () => {
      const booklet = Number(app.querySelector("#resetBooklet").value);
      const day = Number(app.querySelector("#resetDay").value);
      const feedback = app.querySelector("#adultFeedback");

      if (!Number.isInteger(booklet) || !Number.isInteger(day) || booklet < 1 || day < 1) {
        feedback.textContent = "Enter a valid booklet and day.";
        return;
      }

      requestPassword("Enter reset password", () => {
        const store = getProgressStore();
        const packId = app.querySelector("#resetPack").value;
        if (packId === "year4-times-tables") {
          delete store[`times:${booklet}:${day}`];
          feedback.textContent = `Booklet ${booklet}, Day ${day} reset for ${getActiveProfile().name}.`;
        } else if (packId === "year3-english-spelling") {
          delete store[`english-spelling:${booklet}`];
          feedback.textContent = `Worksheet ${booklet} reset for ${getActiveProfile().name}.`;
        } else if (packId === "year3-english-grammar") {
          delete store[`english-grammar:${booklet}`];
          feedback.textContent = `Grammar test ${booklet} reset for ${getActiveProfile().name}.`;
        } else if (packId === "year34-english-spelling") {
          delete store[`year34-spelling:${booklet}`];
          feedback.textContent = `Worksheet ${booklet} reset for ${getActiveProfile().name}.`;
        } else if (packId === "year4-english-tricky-words") {
          delete store[`tricky-words:${booklet}`];
          feedback.textContent = `Tricky word sheet ${booklet} reset for ${getActiveProfile().name}.`;
        } else if (packId === "year4-column-maths") {
          delete store["column-maths:1"];
          feedback.textContent = `Column maths reset for ${getActiveProfile().name}.`;
        } else if (packId === "year4-maths-workbook") {
          year4MathsWorkbook.activities.forEach((activity) => {
            delete store[`maths-workbook:${activity.id}`];
          });
          feedback.textContent = `Maths workbook progress reset for ${getActiveProfile().name}.`;
        }
        setProgressStore(store);
      });
    });
  }

  function wireAdultRewardsPanel() {
    app.querySelector("#viewRewardsFromAdult").addEventListener("click", () => {
      location.hash = "rewards";
    });

    app.querySelector("#resetRewards").addEventListener("click", () => {
      requestPassword("Enter reset password", () => {
        const state = getProfileState();
        state.profiles[state.activeId].rewards = normalizeRewardState();
        saveProfileState(state);
        renderAdultArea();
        const feedback = app.querySelector("#rewardAdminFeedback");
        if (feedback) feedback.textContent = `Reward collection reset for ${getActiveProfile().name}.`;
      });
    });
  }

  function requestPassword(title, onSuccess) {
    passwordRequest = { title, error: "", onSuccess };
    renderPasswordOverlay();
  }

  function renderPasswordOverlay() {
    removePasswordOverlay();
    if (!passwordRequest) return;

    const overlay = document.createElement("div");
    overlay.id = "passwordOverlay";
    overlay.className = "password-overlay";
    overlay.innerHTML = `
      <div class="password-dialog">
        <h2>${escapeHtml(passwordRequest.title)}</h2>
        <p>Enter the adult password to continue.</p>
        <input id="passwordInput" type="password" inputmode="numeric" autocomplete="off">
        <p class="password-error">${escapeHtml(passwordRequest.error || "")}</p>
        <div class="actions-row">
          <button class="primary-action" type="button" id="passwordConfirm">Unlock</button>
          <button class="primary-action secondary-action" type="button" id="passwordCancel">Cancel</button>
        </div>
      </div>
    `;
    body.appendChild(overlay);

    overlay.querySelector("#passwordConfirm").addEventListener("click", confirmPasswordOverlay);
    overlay.querySelector("#passwordCancel").addEventListener("click", clearPasswordRequest);
  }

  function confirmPasswordOverlay() {
    const input = document.querySelector("#passwordInput");
    if (!input) return;
    if (input.value !== resetPassword) {
      passwordRequest.error = "Password not correct.";
      renderPasswordOverlay();
      return;
    }

    const action = passwordRequest.onSuccess;
    clearPasswordRequest();
    action();
  }

  function clearPasswordRequest() {
    passwordRequest = null;
    removePasswordOverlay();
  }

  function removePasswordOverlay() {
    const overlay = document.querySelector("#passwordOverlay");
    if (overlay) overlay.remove();
  }

  function normalizeTypedAnswer(value) {
    return String(value || "").trim().toLowerCase();
  }

  function createProfileId(name) {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student"}-${Date.now().toString(36)}`;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  async function signInCloud() {
    const cloud = window.SchoolCloud;
    if (!cloud?.configured) return;

    try {
      await cloud.signIn();
      await loadCloudProgress({ keepLocalIfEmpty: true });
    } catch (error) {
      updateCloudMessage(error.message);
    }
  }

  async function signOutCloud() {
    const cloud = window.SchoolCloud;
    if (!cloud?.configured) return;

    try {
      await cloud.signOut();
      renderDashboard();
    } catch (error) {
      updateCloudMessage(error.message);
    }
  }

  async function loadCloudProgress(options = {}) {
    const cloud = window.SchoolCloud;
    if (!cloud?.user) return;

    try {
      const remoteState = await cloud.load();
      if (!remoteState) {
        if (options.keepLocalIfEmpty) await saveCloudProgress();
        renderDashboard();
        return;
      }

      saveProfileState(normalizeProfileState(remoteState), { skipCloud: true });
      updateTotalProgress();
      renderDashboard();
    } catch (error) {
      updateCloudMessage(error.message);
    }
  }

  async function saveCloudProgress() {
    const cloud = window.SchoolCloud;
    if (!cloud?.user) return;

    try {
      await cloud.save(getProfileState());
      renderDashboard();
    } catch (error) {
      updateCloudMessage(error.message);
    }
  }

  function queueCloudSave(state) {
    const cloud = window.SchoolCloud;
    if (!cloud?.user) return;

    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => {
      cloud.save(state).catch((error) => updateCloudMessage(error.message));
    }, 650);
  }

  function normalizeProfileState(state) {
    if (!state?.activeId || !state?.profiles?.[state.activeId]) {
      return getProfileState();
    }
    Object.keys(state.profiles).forEach((id) => {
      state.profiles[id] = normalizeProfile(state.profiles[id]);
    });
    return state;
  }

  function cloudSnapshot() {
    return window.SchoolCloud?.snapshot?.() || {
      configured: false,
      status: "Firebase not configured",
      user: null
    };
  }

  function updateCloudMessage(message) {
    const box = app.querySelector("#cloudStatus");
    if (box) box.textContent = message;
  }

  function encodeRouteValue(value) {
    return encodeURIComponent(value).replace(/%20/g, "+");
  }

  function decodeRouteValue(value) {
    return decodeURIComponent((value || "Preschool").replace(/\+/g, "%20"));
  }
})();
