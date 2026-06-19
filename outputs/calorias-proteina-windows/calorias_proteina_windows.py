import json
import os
import uuid
from datetime import date
from pathlib import Path
import tkinter as tk
from tkinter import messagebox, ttk


APP_NAME = "Calorias y Proteina"
DATA_DIR = Path(os.environ.get("APPDATA", Path.home())) / "CaloriasProteina"
DATA_DIR.mkdir(parents=True, exist_ok=True)
GOALS_FILE = DATA_DIR / "goals.json"
TODAY_FILE = DATA_DIR / f"diario-{date.today().isoformat()}.json"

DEFAULT_GOALS = {"calories": 2200, "protein": 160}
MEALS = ("Desayuno", "Comida", "Cena", "Snack")


def read_json(path, fallback):
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        pass
    return fallback


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def number(value, fallback=0):
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return fallback


def format_number(value, decimals=0):
    if decimals == 0:
        return f"{round(value):,}".replace(",", ",")
    text = f"{value:,.{decimals}f}".rstrip("0").rstrip(".")
    return text


class MacroApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_NAME)
        self.geometry("460x720")
        self.minsize(390, 620)
        self.configure(bg="#f6f4ee")

        self.goals = read_json(GOALS_FILE, DEFAULT_GOALS.copy())
        self.entries = read_json(TODAY_FILE, [])
        self.meal_var = tk.StringVar(value=MEALS[0])

        self.colors = {
            "bg": "#f6f4ee",
            "panel": "#fffdf8",
            "ink": "#172421",
            "muted": "#68726d",
            "line": "#ded9cc",
            "green": "#1f6f63",
            "green_dark": "#173f3a",
            "coral": "#e15f4f",
            "gold": "#f4b942",
        }

        self.configure_styles()
        self.build_ui()
        self.render()

    def configure_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TFrame", background=self.colors["bg"])
        style.configure("Panel.TFrame", background=self.colors["panel"], relief="flat")
        style.configure("TLabel", background=self.colors["bg"], foreground=self.colors["ink"])
        style.configure("Panel.TLabel", background=self.colors["panel"], foreground=self.colors["ink"])
        style.configure("Muted.Panel.TLabel", background=self.colors["panel"], foreground=self.colors["muted"])
        style.configure("Title.TLabel", background=self.colors["bg"], foreground=self.colors["ink"], font=("Segoe UI", 24, "bold"))
        style.configure("Section.TLabel", background=self.colors["panel"], foreground=self.colors["ink"], font=("Segoe UI", 12, "bold"))
        style.configure("Metric.TLabel", background=self.colors["panel"], foreground=self.colors["ink"], font=("Segoe UI", 22, "bold"))
        style.configure("Primary.TButton", font=("Segoe UI", 11, "bold"), foreground="white", background=self.colors["green"])
        style.map("Primary.TButton", background=[("active", self.colors["green_dark"])])
        style.configure("Ghost.TButton", font=("Segoe UI", 10, "bold"), foreground=self.colors["green_dark"], background=self.colors["panel"])
        style.configure("Meal.TRadiobutton", background=self.colors["panel"], foreground=self.colors["ink"], font=("Segoe UI", 9, "bold"))

    def panel(self, parent):
        frame = tk.Frame(parent, bg=self.colors["panel"], bd=1, relief="solid", highlightthickness=0)
        frame.configure(highlightbackground=self.colors["line"])
        return frame

    def build_ui(self):
        outer = tk.Frame(self, bg=self.colors["bg"])
        outer.pack(fill="both", expand=True, padx=16, pady=16)

        header = tk.Frame(outer, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 14))
        title_block = tk.Frame(header, bg=self.colors["bg"])
        title_block.pack(side="left", fill="x", expand=True)
        tk.Label(title_block, text="DIARIO NUTRICIONAL", bg=self.colors["bg"], fg=self.colors["muted"], font=("Segoe UI", 8, "bold")).pack(anchor="w")
        tk.Label(title_block, text=APP_NAME, bg=self.colors["bg"], fg=self.colors["ink"], font=("Segoe UI", 24, "bold")).pack(anchor="w")
        tk.Button(header, text="↺", width=3, command=self.reset_day, bg=self.colors["green_dark"], fg="white", bd=0, font=("Segoe UI", 16, "bold")).pack(side="right")

        summary = tk.Frame(outer, bg=self.colors["bg"])
        summary.pack(fill="x", pady=(0, 12))
        self.calorie_card = self.metric_card(summary, "Calorias", "#e15f4f")
        self.calorie_card.pack(side="left", fill="both", expand=True, padx=(0, 6))
        self.protein_card = self.metric_card(summary, "Proteina", "#1f6f63")
        self.protein_card.pack(side="left", fill="both", expand=True, padx=(6, 0))

        goals = self.panel(outer)
        goals.pack(fill="x", pady=(0, 12))
        goal_head = tk.Frame(goals, bg=self.colors["panel"])
        goal_head.pack(fill="x", padx=14, pady=(12, 8))
        tk.Label(goal_head, text="Metas", bg=self.colors["panel"], fg=self.colors["ink"], font=("Segoe UI", 12, "bold")).pack(side="left")
        tk.Button(goal_head, text="Guardar", command=self.save_goals, bg=self.colors["panel"], fg=self.colors["green_dark"], bd=1, relief="solid", font=("Segoe UI", 9, "bold")).pack(side="right")
        goal_inputs = tk.Frame(goals, bg=self.colors["panel"])
        goal_inputs.pack(fill="x", padx=14, pady=(0, 14))
        self.calories_goal_var = tk.StringVar(value=str(self.goals["calories"]))
        self.protein_goal_var = tk.StringVar(value=str(self.goals["protein"]))
        self.labeled_entry(goal_inputs, "Calorias", self.calories_goal_var).pack(side="left", fill="x", expand=True, padx=(0, 6))
        self.labeled_entry(goal_inputs, "Proteina", self.protein_goal_var).pack(side="left", fill="x", expand=True, padx=(6, 0))

        form = self.panel(outer)
        form.pack(fill="x", pady=(0, 12))
        tk.Label(form, text="Agregar alimento", bg=self.colors["panel"], fg=self.colors["ink"], font=("Segoe UI", 12, "bold")).pack(anchor="w", padx=14, pady=(12, 8))
        self.food_name_var = tk.StringVar()
        self.servings_var = tk.StringVar(value="1")
        self.calories_var = tk.StringVar()
        self.protein_var = tk.StringVar()
        self.labeled_entry(form, "Nombre", self.food_name_var).pack(fill="x", padx=14, pady=(0, 10))

        meals = tk.Frame(form, bg=self.colors["panel"])
        meals.pack(fill="x", padx=14, pady=(0, 10))
        for meal in MEALS:
            ttk.Radiobutton(meals, text=meal, value=meal, variable=self.meal_var, style="Meal.TRadiobutton").pack(side="left", expand=True)

        nutrition = tk.Frame(form, bg=self.colors["panel"])
        nutrition.pack(fill="x", padx=14, pady=(0, 12))
        self.labeled_entry(nutrition, "Porciones", self.servings_var).pack(side="left", fill="x", expand=True, padx=(0, 5))
        self.labeled_entry(nutrition, "kcal/porcion", self.calories_var).pack(side="left", fill="x", expand=True, padx=5)
        self.labeled_entry(nutrition, "Proteina/porcion", self.protein_var).pack(side="left", fill="x", expand=True, padx=(5, 0))
        tk.Button(form, text="Agregar", command=self.add_entry, bg=self.colors["green"], fg="white", bd=0, font=("Segoe UI", 12, "bold")).pack(fill="x", padx=14, pady=(0, 14), ipady=9)

        log_panel = self.panel(outer)
        log_panel.pack(fill="both", expand=True)
        log_head = tk.Frame(log_panel, bg=self.colors["panel"])
        log_head.pack(fill="x", padx=14, pady=(12, 8))
        tk.Label(log_head, text="Registro", bg=self.colors["panel"], fg=self.colors["ink"], font=("Segoe UI", 12, "bold")).pack(side="left")
        self.count_label = tk.Label(log_head, text="0 items", bg=self.colors["panel"], fg=self.colors["muted"], font=("Segoe UI", 9))
        self.count_label.pack(side="right")

        self.list_canvas = tk.Canvas(log_panel, bg=self.colors["panel"], highlightthickness=0)
        scrollbar = ttk.Scrollbar(log_panel, orient="vertical", command=self.list_canvas.yview)
        self.entries_frame = tk.Frame(self.list_canvas, bg=self.colors["panel"])
        self.entries_frame.bind("<Configure>", lambda _event: self.list_canvas.configure(scrollregion=self.list_canvas.bbox("all")))
        self.list_canvas.create_window((0, 0), window=self.entries_frame, anchor="nw")
        self.list_canvas.configure(yscrollcommand=scrollbar.set)
        self.list_canvas.pack(side="left", fill="both", expand=True, padx=(14, 0), pady=(0, 14))
        scrollbar.pack(side="right", fill="y", padx=(0, 14), pady=(0, 14))

    def metric_card(self, parent, label, accent):
        frame = self.panel(parent)
        tk.Label(frame, text=label, bg=self.colors["panel"], fg=self.colors["muted"], font=("Segoe UI", 9, "bold")).pack(anchor="w", padx=14, pady=(14, 2))
        value = tk.Label(frame, text="0", bg=self.colors["panel"], fg=self.colors["ink"], font=("Segoe UI", 22, "bold"))
        value.pack(anchor="w", padx=14)
        progress = ttk.Progressbar(frame, maximum=100, value=0)
        progress.pack(fill="x", padx=14, pady=(8, 4))
        detail = tk.Label(frame, text="", bg=self.colors["panel"], fg=self.colors["muted"], font=("Segoe UI", 9))
        detail.pack(anchor="w", padx=14, pady=(0, 14))
        frame.value_label = value
        frame.progress = progress
        frame.detail_label = detail
        frame.accent = accent
        return frame

    def labeled_entry(self, parent, label, variable):
        frame = tk.Frame(parent, bg=self.colors["panel"])
        tk.Label(frame, text=label, bg=self.colors["panel"], fg=self.colors["muted"], font=("Segoe UI", 8, "bold")).pack(anchor="w")
        tk.Entry(frame, textvariable=variable, bg="#fffaf0", fg=self.colors["ink"], relief="solid", bd=1, font=("Segoe UI", 11)).pack(fill="x", ipady=7)
        return frame

    def add_entry(self):
        name = self.food_name_var.get().strip()
        servings = number(self.servings_var.get(), 1)
        calories = number(self.calories_var.get(), 0)
        protein = number(self.protein_var.get(), 0)

        if not name:
            messagebox.showwarning(APP_NAME, "Escribe el nombre del alimento.")
            return
        if servings <= 0:
            messagebox.showwarning(APP_NAME, "Las porciones deben ser mayores a cero.")
            return

        self.entries.insert(0, {
            "id": str(uuid.uuid4()),
            "name": name,
            "meal": self.meal_var.get(),
            "servings": servings,
            "calories": calories * servings,
            "protein": protein * servings,
        })
        self.food_name_var.set("")
        self.servings_var.set("1")
        self.calories_var.set("")
        self.protein_var.set("")
        self.meal_var.set(MEALS[0])
        self.save_entries()
        self.render()

    def save_goals(self):
        self.goals = {
            "calories": max(1, number(self.calories_goal_var.get(), DEFAULT_GOALS["calories"])),
            "protein": max(1, number(self.protein_goal_var.get(), DEFAULT_GOALS["protein"])),
        }
        write_json(GOALS_FILE, self.goals)
        self.render()

    def save_entries(self):
        write_json(TODAY_FILE, self.entries)

    def delete_entry(self, entry_id):
        self.entries = [entry for entry in self.entries if entry["id"] != entry_id]
        self.save_entries()
        self.render()

    def reset_day(self):
        if not self.entries:
            return
        if messagebox.askyesno(APP_NAME, "Quieres limpiar el registro de hoy?"):
            self.entries = []
            self.save_entries()
            self.render()

    def render(self):
        calories_total = sum(entry["calories"] for entry in self.entries)
        protein_total = sum(entry["protein"] for entry in self.entries)
        self.render_metric(self.calorie_card, calories_total, self.goals["calories"], "kcal de hoy", 0)
        self.render_metric(self.protein_card, protein_total, self.goals["protein"], "gramos de hoy", 1)
        self.count_label.configure(text=f"{len(self.entries)} {'item' if len(self.entries) == 1 else 'items'}")

        for child in self.entries_frame.winfo_children():
            child.destroy()

        if not self.entries:
            tk.Label(
                self.entries_frame,
                text="Agrega tu primer alimento para ver tus totales del dia.",
                bg=self.colors["panel"],
                fg=self.colors["muted"],
                wraplength=360,
                justify="center",
                font=("Segoe UI", 10),
            ).pack(fill="x", pady=34)
            return

        for entry in self.entries:
            self.entry_row(entry).pack(fill="x", pady=(0, 8))

    def render_metric(self, card, value, goal, detail, decimals):
        percent = min(100, round((value / goal) * 100)) if goal else 0
        card.value_label.configure(text=f"{format_number(value, decimals)} / {format_number(goal, 0)}")
        card.progress.configure(value=percent)
        card.detail_label.configure(text=detail)

    def entry_row(self, entry):
        row = tk.Frame(self.entries_frame, bg="#fffaf0", bd=1, relief="solid")
        left = tk.Frame(row, bg="#fffaf0")
        left.pack(side="left", fill="both", expand=True, padx=10, pady=8)
        tk.Label(left, text=entry["meal"], bg="#fffaf0", fg=self.colors["muted"], font=("Segoe UI", 8, "bold")).pack(anchor="w")
        tk.Label(left, text=entry["name"], bg="#fffaf0", fg=self.colors["ink"], font=("Segoe UI", 11, "bold"), wraplength=230, justify="left").pack(anchor="w")
        tk.Label(left, text=f"{format_number(entry['servings'], 1)} porciones", bg="#fffaf0", fg=self.colors["muted"], font=("Segoe UI", 8)).pack(anchor="w")

        right = tk.Frame(row, bg="#fffaf0")
        right.pack(side="right", padx=10, pady=8)
        tk.Label(right, text=f"{format_number(entry['calories'], 0)} kcal", bg="#fffaf0", fg=self.colors["ink"], font=("Segoe UI", 10, "bold")).pack(anchor="e")
        tk.Label(right, text=f"{format_number(entry['protein'], 1)}g proteina", bg="#fffaf0", fg=self.colors["muted"], font=("Segoe UI", 8)).pack(anchor="e")
        tk.Button(right, text="Eliminar", command=lambda entry_id=entry["id"]: self.delete_entry(entry_id), bg="#f7ded9", fg="#7d2f27", bd=0, font=("Segoe UI", 8, "bold")).pack(anchor="e", pady=(5, 0))
        return row


if __name__ == "__main__":
    app = MacroApp()
    app.mainloop()
