const todayKey = new Date().toISOString().slice(0, 10);
const storageKey = `macro-diary:${todayKey}`;
const goalsKey = "macro-diary:goals";

const defaultGoals = {
  calories: 2200,
  protein: 160,
};

const state = {
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
  calorieRing: document.querySelector("#calorieRing"),
  proteinRing: document.querySelector("#proteinRing"),
  caloriePercent: document.querySelector("#caloriePercent"),
  proteinPercent: document.querySelector("#proteinPercent"),
  entriesList: document.querySelector("#entriesList"),
  emptyState: document.querySelector("#emptyState"),
  entryCount: document.querySelector("#entryCount"),
  template: document.querySelector("#entryTemplate"),
};

nodes.caloriesGoal.value = state.goals.calories;
nodes.proteinGoal.value = state.goals.protein;

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
  document.querySelector("#foodName").focus();
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

function render() {
  const totals = state.entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein,
    }),
    { calories: 0, protein: 0 },
  );

  nodes.caloriesTotal.textContent = formatNumber(totals.calories, 0);
  nodes.proteinTotal.textContent = formatNumber(totals.protein, 1);
  nodes.caloriesGoalText.textContent = formatNumber(state.goals.calories, 0);
  nodes.proteinGoalText.textContent = formatNumber(state.goals.protein, 0);
  nodes.caloriesGoal.value = state.goals.calories;
  nodes.proteinGoal.value = state.goals.protein;

  setProgress(nodes.calorieRing, nodes.caloriePercent, totals.calories, state.goals.calories);
  setProgress(nodes.proteinRing, nodes.proteinPercent, totals.protein, state.goals.protein);

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

function setProgress(ring, label, value, goal) {
  const percent = goal > 0 ? Math.round((value / goal) * 100) : 0;
  const degrees = Math.min(percent, 100) * 3.6;
  ring.style.setProperty("--progress", `${degrees}deg`);
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
