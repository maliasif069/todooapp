// ---------- Pure logic (exported for unit testing in CI) ----------

/**
 * Create a new todo object.
 */
function createTodo(text, priority) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    throw new Error("Task text cannot be empty");
  }
  return {
    id: Date.now() + Math.random().toString(16).slice(2),
    text: trimmed,
    priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
    completed: false,
  };
}

/**
 * Filter a list of todos by a given filter mode.
 */
function filterTodos(todos, mode) {
  switch (mode) {
    case "active":
      return todos.filter((t) => !t.completed);
    case "completed":
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
}

/**
 * Count how many todos are not completed.
 */
function countItemsLeft(todos) {
  return todos.filter((t) => !t.completed).length;
}

/**
 * Remove all completed todos from a list, returning a new array.
 */
function clearCompleted(todos) {
  return todos.filter((t) => !t.completed);
}

// ---------- App wiring (browser only) ----------

if (typeof window !== "undefined" && document.getElementById("todo-form")) {
  const STORAGE_KEY = "taskflow-todos";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const prioritySelect = document.getElementById("priority-select");
  const list = document.getElementById("todo-list");
  const itemsLeft = document.getElementById("items-left");
  const clearBtn = document.getElementById("clear-completed");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let todos = loadTodos();
  let currentFilter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Failed to load todos:", err);
      return [];
    }
  }

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      console.error("Failed to save todos:", err);
    }
  }

  function render() {
    const visible = filterTodos(todos, currentFilter);
    list.innerHTML = "";

    if (visible.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "No tasks here yet.";
      list.appendChild(empty);
    }

    visible.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.completed ? " completed" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        saveTodos();
        render();
      });

      const dot = document.createElement("span");
      dot.className = "priority-dot priority-" + todo.priority;

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        todos = todos.filter((t) => t.id !== todo.id);
        saveTodos();
        render();
      });

      li.append(checkbox, dot, text, del);
      list.appendChild(li);
    });

    itemsLeft.textContent = `${countItemsLeft(todos)} items left`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const todo = createTodo(input.value, prioritySelect.value);
      todos.push(todo);
      saveTodos();
      input.value = "";
      render();
    } catch (err) {
      // Empty input is silently ignored (button also has 'required' on input)
      console.warn(err.message);
    }
  });

  clearBtn.addEventListener("click", () => {
    todos = clearCompleted(todos);
    saveTodos();
    render();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  render();
}

// ---------- Exports for Node/Jest (CI) ----------
if (typeof module !== "undefined" && module.exports) {
  module.exports = { createTodo, filterTodos, countItemsLeft, clearCompleted };
}
