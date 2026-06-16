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
  const subjectKeys = ["maths", "english", "science", "technology"];
  const years = ["Preschool", "Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7"];
  const encouragement = ["Brilliant!", "Nice thinking!", "You nailed it!", "Super work!", "Brain power!"];
  const resetPassword = "1256";
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
    }
  ];

  let selectedYear = "Preschool";
  let quizState = null;
  let cloudSaveTimer = null;
  let adultUnlocked = false;
  let passwordRequest = null;
  let grammarQuizState = null;

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

    if (location.hash.startsWith("#english-grammar-test/")) {
      location.hash = "english-grammar";
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

    if (location.hash === "#adult") {
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

    if (view === "adult") {
      openAdultArea();
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
          ${key === "english" && selectedYear === "Year 3" && hasWorksheetAccess("year3-english-grammar") ? `
            <button class="primary-action grammar-action" type="button" id="grammarButton">Grammar Challenges</button>
          ` : ""}
          ${key === "maths" && selectedYear === "Year 4" && hasWorksheetAccess("year4-times-tables") ? `
            <button class="primary-action times-action" type="button" id="timesButton">Daily Times Tables</button>
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

    const grammarButton = app.querySelector("#grammarButton");
    if (grammarButton) {
      grammarButton.addEventListener("click", () => {
        location.hash = "english-grammar";
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
    saveEnglishGrammarAttempt(grammarQuizState.test, percent);
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
    saveEnglishSpellingAttempt(worksheet.worksheet, percent);
    updateTotalProgress();
    app.querySelector("#spellingFeedback").textContent = `${resultMessage(percent)} You fixed ${correct} out of ${worksheet.items.length}. Attempt saved.`;
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
    saveTimesAttempt(booklet.booklet, day.day, percent);
    updateTotalProgress();
    app.querySelector("#timesFeedback").textContent = `${resultMessage(percent)} You got ${correct} out of ${day.questions.length}. Attempt saved.`;
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
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
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
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
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
      updatedAt: new Date().toISOString()
    };
    setProgressStore(store);
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

  function normalizeTimesRecord(value) {
    if (typeof value === "number") {
      return { best: value, attempts: value > 0 ? 1 : 0, completed: value > 0, lastScore: value };
    }

    return {
      best: Number(value?.best) || 0,
      attempts: Number(value?.attempts) || 0,
      completed: Boolean(value?.completed),
      lastScore: Number(value?.lastScore) || 0
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

  function normalizeProfile(profile) {
    const year = years.includes(profile?.year) ? profile.year : "Year 4";
    const packs = Array.isArray(profile?.worksheetPacks) ? profile.worksheetPacks : [];
    const defaultPacks = defaultWorksheetPacksForYear(year);

    return {
      id: profile?.id || createProfileId(profile?.name || "Student"),
      name: profile?.name || "Student",
      age: profile?.age || "",
      year,
      worksheetPacks: packs.length ? packs : defaultPacks,
      progress: profile?.progress || {}
    };
  }

  function getStudentYears() {
    return [getActiveProfile().year || "Year 4"];
  }

  function hasWorksheetAccess(packId) {
    return getActiveProfile().worksheetPacks.includes(packId);
  }

  function defaultWorksheetPacksForYear(year) {
    if (year === "Year 3") return ["year3-english-spelling", "year3-english-grammar"];
    if (year === "Year 4") return ["year4-times-tables"];
    return [];
  }

  function studentHomePanel() {
    const profile = getActiveProfile();
    return `
      <section class="student-hero">
        <div>
          <span class="profile-chip">Playing as ${escapeHtml(profile.name)} - ${escapeHtml(profile.year)}</span>
          <h2>Choose Your Learning Quest</h2>
        </div>
        <button class="adult-button" type="button" id="adultButton">Adult</button>
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
    `;

    wireProfilePanel();
    wireStudentLearningPanel();
    wireAdultWorksheetReset();
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
          <p>Reset a completed Year 4 times-table worksheet for the current student.</p>
        </div>
        <div class="worksheet-reset-grid">
          <label>
            <span>Pack</span>
            <select id="resetPack">
              <option value="year4-times-tables">Year 4 Times Tables</option>
              <option value="year3-english-spelling">Year 3 Spelling Fix-Ups</option>
              <option value="year3-english-grammar">Year 3 Grammar Challenges</option>
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
        }
        setProgressStore(store);
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
