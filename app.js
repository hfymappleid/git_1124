(function () {
  const STORAGE_KEY = "study-helper-todos";

  const navButtons = document.querySelectorAll(".nav-btn");
  const panels = document.querySelectorAll("[data-view-panel]");

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const view = btn.dataset.view;
      navButtons.forEach(function (el) {
        el.classList.toggle("on", el === btn);
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.dataset.viewPanel !== view;
      });
      if (view === "math") {
        document.getElementById("answer").focus();
      } else {
        document.getElementById("todo-input").focus();
      }
    });
  });

  const questionEl = document.getElementById("question");
  const answerEl = document.getElementById("answer");
  const feedbackEl = document.getElementById("feedback");
  const form = document.getElementById("form");
  const submitBtn = document.getElementById("submit");
  const nextBtn = document.getElementById("next");
  const resetBtn = document.getElementById("reset");
  const doneEl = document.getElementById("done");
  const rightEl = document.getElementById("right");
  const rateEl = document.getElementById("rate");

  let mode = "mix";
  let current = null;
  let locked = false;
  let done = 0;
  let right = 0;

  function rand(n) {
    return Math.floor(Math.random() * n);
  }

  function makeQuestion() {
    const useAdd = mode === "add" || (mode === "mix" && Math.random() < 0.5);
    if (useAdd) {
      const a = rand(11);
      const b = rand(11 - a);
      return { text: a + " + " + b + " = ?", answer: a + b };
    }
    const a = rand(11);
    const b = rand(a + 1);
    return { text: a + " − " + b + " = ?", answer: a - b };
  }

  function showQuestion() {
    current = makeQuestion();
    questionEl.textContent = current.text;
    answerEl.value = "";
    answerEl.disabled = false;
    submitBtn.disabled = false;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    locked = false;
    if (!document.getElementById("view-math").hidden) answerEl.focus();
  }

  function updateStats() {
    doneEl.textContent = String(done);
    rightEl.textContent = String(right);
    rateEl.textContent = done === 0 ? "—" : Math.round((right / done) * 100) + "%";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (locked) return;
    const raw = answerEl.value.trim();
    if (raw === "") {
      feedbackEl.textContent = "先填一个数";
      feedbackEl.className = "feedback no";
      return;
    }
    const value = Number(raw);
    locked = true;
    done += 1;
    if (value === current.answer) {
      right += 1;
      feedbackEl.textContent = "答对了";
      feedbackEl.className = "feedback ok";
    } else {
      feedbackEl.textContent = "再想想，答案是 " + current.answer;
      feedbackEl.className = "feedback no";
    }
    answerEl.disabled = true;
    submitBtn.disabled = true;
    updateStats();
  });

  nextBtn.addEventListener("click", showQuestion);

  resetBtn.addEventListener("click", function () {
    done = 0;
    right = 0;
    updateStats();
    showQuestion();
  });

  document.getElementById("modes").addEventListener("click", function (e) {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    mode = btn.dataset.mode;
    document.querySelectorAll("#modes .chip").forEach(function (el) {
      el.classList.toggle("on", el === btn);
    });
    showQuestion();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && locked && !document.getElementById("view-math").hidden) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === "BUTTON") return;
      e.preventDefault();
      showQuestion();
    }
  });

  const todoForm = document.getElementById("todo-form");
  const todoInput = document.getElementById("todo-input");
  const todoList = document.getElementById("todo-list");
  const todoEmpty = document.getElementById("todo-empty");
  const todoLeft = document.getElementById("todo-left");
  const todoClear = document.getElementById("todo-clear");

  let todos = loadTodos();
  let filter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item && typeof item.text === "string" && typeof item.id === "string";
      }).map(function (item) {
        return { id: item.id, text: item.text, done: Boolean(item.done) };
      });
    } catch (err) {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function visibleTodos() {
    if (filter === "active") return todos.filter(function (item) { return !item.done; });
    if (filter === "done") return todos.filter(function (item) { return item.done; });
    return todos;
  }

  function renderTodos() {
    const items = visibleTodos();
    todoList.replaceChildren();
    items.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "todo-item" + (item.done ? " done" : "");

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "todo-check";
      check.checked = item.done;
      check.setAttribute("aria-label", item.done ? "标为未完成" : "标为已完成");
      check.addEventListener("change", function () {
        item.done = check.checked;
        saveTodos();
        renderTodos();
      });

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = item.text;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "todo-del";
      del.textContent = "×";
      del.setAttribute("aria-label", "删除「" + item.text + "」");
      del.addEventListener("click", function () {
        todos = todos.filter(function (row) { return row.id !== item.id; });
        saveTodos();
        renderTodos();
      });

      li.append(check, text, del);
      todoList.append(li);
    });

    const left = todos.filter(function (item) { return !item.done; }).length;
    todoLeft.textContent = left + " 项未完成";
    todoEmpty.hidden = items.length !== 0;
    todoEmpty.textContent = todos.length === 0 ? "还没有待办，先加一件事" : "这一栏还是空的";
    const doneCount = todos.filter(function (item) { return item.done; }).length;
    todoClear.disabled = doneCount === 0;
  }

  todoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    todos.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text,
      done: false
    });
    todoInput.value = "";
    saveTodos();
    renderTodos();
    todoInput.focus();
  });

  document.getElementById("filters").addEventListener("click", function (e) {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    filter = btn.dataset.filter;
    document.querySelectorAll("#filters .chip").forEach(function (el) {
      el.classList.toggle("on", el === btn);
    });
    renderTodos();
  });

  todoClear.addEventListener("click", function () {
    todos = todos.filter(function (item) { return !item.done; });
    saveTodos();
    renderTodos();
  });

  showQuestion();
  renderTodos();
})();
