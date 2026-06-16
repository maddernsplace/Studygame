(function () {
  const app = document.querySelector("#app");
  const pageTitle = document.querySelector("#pageTitle");
  const backButton = document.querySelector("#backButton");
  const totalProgress = document.querySelector("#totalProgress");
  const subjects = window.SCHOOL_DATA || {};
  const year4TimesTables = window.YEAR4_TIMES_TABLES || [];
  const subjectKeys = ["maths", "english", "science", "technology"];
  const years = ["Preschool", "Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7"];
  const encouragement = ["Brilliant!", "Nice thinking!", "You nailed it!", "Super work!", "Brain power!"];
  const resetPassword = "1256";

  let selectedYear = "Preschool";
  let quizState = null;
  let cloudSaveTimer = null;
  let adultUnlocked = false;

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

    if (location.hash === "#times") {
      selectedYear = "Year 4";
      location.hash = "subject/maths";
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
            ${years.map((year) => `
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
          ${key === "maths" && selectedYear === "Year 4" ? `
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
      if (state?.activeId && state.profiles?.[state.activeId]) return state;
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
    return state.profiles[state.activeId];
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

  function getTimesProgress(booklet, day) {
    return normalizeTimesRecord(getProgressStore()[`times:${booklet}:${day}`]).best;
  }

  function getTimesRecord(booklet, day) {
    return normalizeTimesRecord(getProgressStore()[`times:${booklet}:${day}`]);
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

  function getYearProgress(subject, year) {
    return getProgressStore()[`${subject}:${year}`] || 0;
  }

  function getSubjectProgress(subject) {
    const total = years.reduce((sum, year) => sum + getYearProgress(subject, year), 0);
    return Math.round(total / years.length);
  }

  function getYearProgressText(subject, year) {
    const progress = getYearProgress(subject, year);
    if (progress > 0) return `Best score saved: ${progress}%. Ready to beat it?`;
    return "No score yet. Time for your first quest!";
  }

  function updateTotalProgress() {
    const slots = subjectKeys.length * years.length;
    const total = subjectKeys.reduce((sum, subject) => {
      return sum + years.reduce((yearSum, year) => yearSum + getYearProgress(subject, year), 0);
    }, 0);
    totalProgress.textContent = `${Math.round(total / slots)}%`;
  }

  function studentHomePanel() {
    const profile = getActiveProfile();
    return `
      <section class="student-hero">
        <div>
          <span class="profile-chip">Playing as ${escapeHtml(profile.name)}</span>
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
    const password = window.prompt("Adult password");
    if (password !== resetPassword) return;
    adultUnlocked = true;
    location.hash = "adult";
    renderAdultArea();
  }

  function renderAdultArea() {
    pageTitle.textContent = "Adult";
    backButton.classList.remove("hidden");
    quizState = null;

    app.innerHTML = `
      ${profilePanel()}
      ${adultWorksheetResetPanel()}
    `;

    wireProfilePanel();
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

  function adultWorksheetResetPanel() {
    return `
      <section class="panel adult-settings-panel">
        <div>
          <h2>Worksheet Settings</h2>
          <p>Reset a completed Year 4 times-table worksheet for the current student.</p>
        </div>
        <div class="worksheet-reset-grid">
          <label>
            <span>Booklet</span>
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
      renderDashboard();
    });

    app.querySelector("#addProfile").addEventListener("click", () => {
      const input = app.querySelector("#newProfileName");
      const name = input.value.trim();
      if (!name) return;

      const state = getProfileState();
      const id = createProfileId(name);
      state.profiles[id] = { id, name, progress: {} };
      state.activeId = id;
      saveProfileState(state);
      renderDashboard();
    });

    app.querySelector("#resetStudent").addEventListener("click", () => {
      const password = window.prompt("Enter reset password");
      if (password !== resetPassword) return;

      const state = getProfileState();
      state.profiles[state.activeId].progress = {};
      saveProfileState(state);
      updateTotalProgress();
      renderDashboard();
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

  function wireAdultWorksheetReset() {
    app.querySelector("#resetWorksheet").addEventListener("click", () => {
      const booklet = Number(app.querySelector("#resetBooklet").value);
      const day = Number(app.querySelector("#resetDay").value);
      const feedback = app.querySelector("#adultFeedback");

      if (!Number.isInteger(booklet) || !Number.isInteger(day) || booklet < 1 || day < 1) {
        feedback.textContent = "Enter a valid booklet and day.";
        return;
      }

      const store = getProgressStore();
      delete store[`times:${booklet}:${day}`];
      setProgressStore(store);
      feedback.textContent = `Booklet ${booklet}, Day ${day} reset for ${getActiveProfile().name}.`;
    });
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
