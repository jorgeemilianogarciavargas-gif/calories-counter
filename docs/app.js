const todayKey = new Date().toISOString().slice(0, 10);
const storageKey = `macro-diary:${todayKey}`;
const goalsKey = "macro-diary:goals";

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
  goals: readJson(goalsKey, defaultGoals),
  entries: readJson(storageKey, []),
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

  saveEntries();
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
