const todayKey = new Date().toISOString().slice(0, 10);
const storageKey = `macro-diary:${todayKey}`;
const goalsKey = "macro-diary:goals";

const defaultGoals = {
  calories: 2200,
  protein: 160,
};

const state = {
  activeView: "today",
  goals: readJson(goalsKey, defaultGoals),
  entries: readJson(storageKey, []),
};

const nodes = {
  form: document.querySelector("#foodForm"),
  resetDay: document.querySelector("#resetDay"),
  saveGoals: document.querySelector("#saveGoals"),
  caloriesGoal: document.querySelector("#caloriesGoal"),
  proteinGoal: document.querySelector("#proteinGoal"),
  caloriesGoalText: document.querySelector("#caloriesGoalText"),
  proteinGoalText: document.querySelector("#proteinGoalText"),
  caloriesTotal: document.querySelector("#caloriesTotal"),
  proteinTotal: document.querySelector("#proteinTotal"),
  calorieBar: document.querySelector("#calorieBar"),
  proteinBar: document.querySelector("#proteinBar"),
  caloriePercent: document.querySelector("#caloriePercent"),
  proteinPercent: document.querySelector("#proteinPercent"),
  dailyScore: document.querySelector("#dailyScore"),
  entriesList: document.querySelector("#entriesList"),
  emptyState: document.querySelector("#emptyState"),
  entryCount: document.querySelector("#entryCount"),
  template: document.querySelector("#entryTemplate"),
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll("[data-go-view]"),
};

nodes.caloriesGoal.value = state.goals.calories;
nodes.proteinGoal.value = state.goals.protein;

nodes.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.goView);
  });
});

nodes.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(nodes.form);
  const servings = numberFrom("#servings", 1);
  const caloriesPerServing = numberFrom("#calories", 0);
  const proteinPerServing = numberFrom("#protein", 0);
  const name = document.querySelector("#foodName").value.trim();

  if (!name || servings <= 0) return;

  state.entries.unshift({
    id: crypto.randomUUID(),
    name,
    meal: data.get("meal"),
    servings,
    calories: caloriesPerServing * servings,
    protein: proteinPerServing * servings,
    createdAt: new Date().toISOString(),
  });

  saveEntries();
  nodes.form.reset();
  document.querySelector("#servings").value = 1;
  document.querySelector('input[name="meal"][value="Desayuno"]').checked = true;
  render();
  setView("today");
});

nodes.saveGoals.addEventListener("click", () => {
  state.goals = {
    calories: Math.max(1, numberFrom("#caloriesGoal", defaultGoals.calories)),
    protein: Math.max(1, numberFrom("#proteinGoal", defaultGoals.protein)),
  };
  localStorage.setItem(goalsKey, JSON.stringify(state.goals));
  render();
});

nodes.resetDay.addEventListener("click", () => {
  if (!state.entries.length) return;
  const shouldReset = window.confirm("Quieres limpiar el registro de hoy?");
  if (!shouldReset) return;
  state.entries = [];
  saveEntries();
  render();
});

nodes.entriesList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;
  state.entries = state.entries.filter((entry) => entry.id !== button.dataset.id);
  saveEntries();
  render();
});

function setView(viewName) {
  state.activeView = viewName;
  nodes.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });
  document.querySelectorAll(".bottom-nav .nav-button").forEach((button) => {
    const isActive = button.dataset.goView === viewName;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (viewName === "add") {
    setTimeout(() => document.querySelector("#foodName").focus(), 120);
  }
}

function render() {
  const totals = state.entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein,
    }),
    { calories: 0, protein: 0 },
  );

  const caloriePercent = percentOf(totals.calories, state.goals.calories);
  const proteinPercent = percentOf(totals.protein, state.goals.protein);
  const dailyScore = Math.round((Math.min(caloriePercent, 100) + Math.min(proteinPercent, 100)) / 2);

  nodes.caloriesTotal.textContent = formatNumber(totals.calories, 0);
  nodes.proteinTotal.textContent = formatNumber(totals.protein, 1);
  nodes.caloriesGoalText.textContent = formatNumber(state.goals.calories, 0);
  nodes.proteinGoalText.textContent = formatNumber(state.goals.protein, 0);
  nodes.caloriesGoal.value = state.goals.calories;
  nodes.proteinGoal.value = state.goals.protein;

  setProgress(nodes.calorieBar, nodes.caloriePercent, caloriePercent);
  setProgress(nodes.proteinBar, nodes.proteinPercent, proteinPercent);
  nodes.dailyScore.textContent = `${dailyScore}%`;

  nodes.entryCount.textContent = `${state.entries.length} ${state.entries.length === 1 ? "item" : "items"}`;
  nodes.emptyState.hidden = state.entries.length > 0;
  nodes.entriesList.replaceChildren(...state.entries.map(renderEntry));
}

function renderEntry(entry) {
  const node = nodes.template.content.firstElementChild.cloneNode(true);
  node.querySelector(".entry-meal").textContent = entry.meal;
  node.querySelector(".entry-name").textContent = entry.name;
  node.querySelector(".entry-servings").textContent = `${formatNumber(entry.servings, 1)} porcion${entry.servings === 1 ? "" : "es"}`;
  node.querySelector(".entry-calories").textContent = `${formatNumber(entry.calories, 0)} kcal`;
  node.querySelector(".entry-protein").textContent = `${formatNumber(entry.protein, 1)}g proteina`;
  node.querySelector(".delete-button").dataset.id = entry.id;
  return node;
}

function percentOf(value, goal) {
  return goal > 0 ? Math.round((value / goal) * 100) : 0;
}

function setProgress(bar, label, percent) {
  bar.style.width = `${Math.min(percent, 100)}%`;
  label.textContent = `${percent}%`;
}

function saveEntries() {
  localStorage.setItem(storageKey, JSON.stringify(state.entries));
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function numberFrom(selector, fallback) {
  const value = Number.parseFloat(document.querySelector(selector).value);
  return Number.isFinite(value) ? value : fallback;
}

function formatNumber(value, decimals) {
  return Number(value).toLocaleString("es-MX", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js");
}

render();
setView("today");
