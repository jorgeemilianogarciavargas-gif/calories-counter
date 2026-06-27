const todayKey = new Date().toISOString().slice(0, 10);
const goalsKey = "macro-diary:goals";
const daysKey = "macro-diary:days";
const storageKeyForDay = (day) => `macro-diary:${day}`;

const defaultGoals = {
  calories: 2200,
  protein: 160,
};

const localFoods = [
  { keywords: ["pollo", "pechuga"], name: "Pechuga de pollo", calories: 165, protein: 31 },
  { keywords: ["atun", "atún"], name: "Atun", calories: 132, protein: 28 },
  { keywords: ["huevo"], name: "Huevo", calories: 143, protein: 12.6 },
  { keywords: ["arroz"], name: "Arroz cocido", calories: 130, protein: 2.7 },
  { keywords: ["frijol", "frijoles"], name: "Frijoles cocidos", calories: 132, protein: 8.9 },
  { keywords: ["avena"], name: "Avena", calories: 389, protein: 16.9 },
  { keywords: ["leche"], name: "Leche entera", calories: 61, protein: 3.2 },
  { keywords: ["yogur", "yogurt"], name: "Yogur griego natural", calories: 97, protein: 9 },
  { keywords: ["platano", "plátano", "banana"], name: "Platano", calories: 89, protein: 1.1 },
  { keywords: ["manzana"], name: "Manzana", calories: 52, protein: 0.3 },
  { keywords: ["tortilla"], name: "Tortilla de maiz", calories: 218, protein: 5.7 },
  { keywords: ["res", "carne"], name: "Carne de res magra", calories: 250, protein: 26 },
  { keywords: ["salmon", "salmón"], name: "Salmon", calories: 208, protein: 20 },
  { keywords: ["papa", "patata"], name: "Papa cocida", calories: 87, protein: 1.9 },
];

const state = {
  activeView: "today",
  historyDay: todayKey,
  goals: readJson(goalsKey, defaultGoals),
  entries: readJson(storageKeyForDay(todayKey), []),
};

const nodes = {
  form: document.querySelector("#foodForm"),
  resetDay: document.querySelector("#resetDay"),
  saveGoals: document.querySelector("#saveGoals"),
  lookupFood: document.querySelector("#lookupFood"),
  lookupStatus: document.querySelector("#lookupStatus"),
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
  dayHistory: document.querySelector("#dayHistory"),
  historySummary: document.querySelector("#historySummary"),
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

nodes.lookupFood.addEventListener("click", lookupFood);
document.querySelector("#foodName").addEventListener("change", lookupFood);

nodes.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(nodes.form);
  const grams = numberFrom("#grams", 100);
  const caloriesPer100 = numberFrom("#caloriesPer100", 0);
  const proteinPer100 = numberFrom("#proteinPer100", 0);
  const name = document.querySelector("#foodName").value.trim();

  if (!name || grams <= 0) return;

  state.entries.unshift({
    id: crypto.randomUUID(),
    name,
    meal: data.get("meal"),
    grams,
    calories: (caloriesPer100 * grams) / 100,
    protein: (proteinPer100 * grams) / 100,
    createdAt: new Date().toISOString(),
  });

  saveTodayEntries();
  state.historyDay = todayKey;
  nodes.form.reset();
  document.querySelector("#grams").value = 100;
  nodes.lookupStatus.textContent = "Busca un alimento para calcular sus macros.";
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
  state.historyDay = todayKey;
  saveTodayEntries();
  render();
});

nodes.entriesList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;
  deleteEntry(button.dataset.id);
  render();
});

nodes.dayHistory.addEventListener("click", (event) => {
  const button = event.target.closest(".day-button");
  if (!button) return;
  state.historyDay = button.dataset.day;
  renderHistory();
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
  const totals = totalsFor(state.entries);
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

  renderHistory();
}

function renderHistory() {
  const days = getSavedDays();
  if (!days.includes(state.historyDay)) {
    state.historyDay = days[0] || todayKey;
  }

  nodes.dayHistory.replaceChildren(...days.map(renderDayButton));

  const entries = readEntriesForDay(state.historyDay);
  const totals = totalsFor(entries);
  nodes.entryCount.textContent = `${entries.length} ${entries.length === 1 ? "item" : "items"}`;
  nodes.historySummary.innerHTML = `<strong>${formatNumber(totals.calories, 0)} kcal</strong><span>${formatNumber(totals.protein, 1)}g proteina</span>`;
  nodes.emptyState.hidden = entries.length > 0;
  nodes.emptyState.querySelector("p").textContent = days.length
    ? "No hay alimentos guardados en este dia."
    : "Agrega tu primer alimento para empezar tu historial.";
  nodes.entriesList.replaceChildren(...entries.map(renderEntry));
}

function renderDayButton(day) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `day-button${day === state.historyDay ? " is-active" : ""}`;
  button.dataset.day = day;
  button.textContent = day === todayKey ? "Hoy" : formatDay(day);
  return button;
}

function renderEntry(entry) {
  const node = nodes.template.content.firstElementChild.cloneNode(true);
  node.querySelector(".entry-meal").textContent = entry.meal;
  node.querySelector(".entry-name").textContent = entry.name;
  node.querySelector(".entry-servings").textContent = entry.grams
    ? `${formatNumber(entry.grams, 0)}g`
    : `${formatNumber(entry.servings || 1, 1)} porcion${entry.servings === 1 ? "" : "es"}`;
  node.querySelector(".entry-calories").textContent = `${formatNumber(entry.calories, 0)} kcal`;
  node.querySelector(".entry-protein").textContent = `${formatNumber(entry.protein, 1)}g proteina`;
  node.querySelector(".delete-button").dataset.id = entry.id;
  return node;
}

async function lookupFood() {
  const query = document.querySelector("#foodName").value.trim();
  if (!query) return;

  nodes.lookupFood.disabled = true;
  nodes.lookupStatus.textContent = "Buscando alimento...";

  const localMatch = findLocalFood(query);
  if (localMatch) {
    applyFoodMatch(localMatch, "base local");
  }

  try {
    const onlineMatch = await findOnlineFood(query);
    if (onlineMatch) {
      applyFoodMatch(onlineMatch, "Open Food Facts");
      return;
    }
    if (!localMatch) {
      nodes.lookupStatus.textContent = "No lo encontre. Puedes escribir kcal/100g y proteina/100g manualmente.";
    }
  } catch {
    if (!localMatch) {
      nodes.lookupStatus.textContent = "Sin conexion o sin resultado. Puedes escribir los valores manualmente.";
    }
  } finally {
    nodes.lookupFood.disabled = false;
  }
}

function findLocalFood(query) {
  const normalized = normalize(query);
  return localFoods.find((food) => food.keywords.some((keyword) => normalized.includes(normalize(keyword))));
}

async function findOnlineFood(query) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "8",
    fields: "product_name,brands,nutriments",
  });
  const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
  if (!response.ok) return null;
  const data = await response.json();
  const product = (data.products || []).find((item) => {
    const nutriments = item.nutriments || {};
    return numeric(nutriments["energy-kcal_100g"]) > 0 && numeric(nutriments.proteins_100g) >= 0;
  });
  if (!product) return null;
  const nutriments = product.nutriments || {};
  return {
    name: product.product_name || query,
    brand: product.brands || "",
    calories: numeric(nutriments["energy-kcal_100g"]),
    protein: numeric(nutriments.proteins_100g),
  };
}

function applyFoodMatch(food, source) {
  document.querySelector("#foodName").value = food.name;
  document.querySelector("#caloriesPer100").value = round(food.calories, 1);
  document.querySelector("#proteinPer100").value = round(food.protein, 1);
  const brand = food.brand ? ` (${food.brand})` : "";
  nodes.lookupStatus.textContent = `${food.name}${brand}: ${round(food.calories, 1)} kcal y ${round(food.protein, 1)}g proteina por 100g. Fuente: ${source}.`;
}

function totalsFor(entries) {
  return entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein,
    }),
    { calories: 0, protein: 0 },
  );
}

function saveTodayEntries() {
  saveEntriesForDay(todayKey, state.entries);
}

function saveEntriesForDay(day, entries) {
  localStorage.setItem(storageKeyForDay(day), JSON.stringify(entries));
  updateSavedDays(day, entries.length > 0);
}

function readEntriesForDay(day) {
  if (day === todayKey) return state.entries;
  return readJson(storageKeyForDay(day), []);
}

function deleteEntry(entryId) {
  const day = state.historyDay;
  const entries = readEntriesForDay(day).filter((entry) => entry.id !== entryId);
  if (day === todayKey) {
    state.entries = entries;
  }
  saveEntriesForDay(day, entries);
}

function getSavedDays() {
  const days = readJson(daysKey, []);
  const merged = [...new Set([todayKey, ...days])].filter((day) => readEntriesForDay(day).length > 0 || day === todayKey);
  return merged.sort((a, b) => b.localeCompare(a));
}

function updateSavedDays(day, shouldKeep) {
  const days = new Set(readJson(daysKey, []));
  if (shouldKeep) {
    days.add(day);
  } else {
    days.delete(day);
  }
  localStorage.setItem(daysKey, JSON.stringify([...days].sort((a, b) => b.localeCompare(a))));
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function numeric(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, decimals) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

function percentOf(value, goal) {
  return goal > 0 ? Math.round((value / goal) * 100) : 0;
}

function setProgress(bar, label, percent) {
  bar.style.width = `${Math.min(percent, 100)}%`;
  label.textContent = `${percent}%`;
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

function formatDay(day) {
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year.slice(2)}`;
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js");
}

render();
setView("today");
