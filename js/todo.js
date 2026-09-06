/**
 * todo.js
 * Interactive To-Do List Application
 * 
 * Features:
 * - Full CRUD functionality (Create, Read, Update, Delete, Toggle Completion)
 * - State management using JavaScript task objects
 * - Resilient localStorage persistence with JSON serialization and fault tolerance
 * - Dynamic filtering: All, Active, Completed without page reloads
 * - Efficient Event Delegation on the task list container
 * - Accessible Live Region announcements (WCAG AA compliant)
 * - Keyboard accessible inline editing (Enter to save, Escape to cancel)
 * - Seamless integration with existing portfolio theme and styling
 */

(function () {
  'use strict';

  // Constants
  const STORAGE_KEY = 'portfolio_todo_tasks';
  
  // Default starter tasks for first-time visitors
  const DEFAULT_TASKS = [
    {
      id: 'task-initial-1',
      text: 'Explore M. Sai Supriya’s portfolio projects',
      completed: true,
      createdAt: Date.now() - 120000
    },
    {
      id: 'task-initial-2',
      text: 'Try adding, editing, and filtering tasks here',
      completed: false,
      createdAt: Date.now() - 60000
    },
    {
      id: 'task-initial-3',
      text: 'Test the light and dark mode theme toggle',
      completed: false,
      createdAt: Date.now()
    }
  ];

  // Application State
  let tasks = [];
  let currentFilter = 'all'; // 'all' | 'active' | 'completed'
  let editingTaskId = null;

  // DOM Element References
  let formEl = null;
  let inputEl = null;
  let errorEl = null;
  let listEl = null;
  let emptyStateEl = null;
  let emptyTitleEl = null;
  let emptyDescEl = null;
  let filterBtns = [];
  let summaryEl = null;
  let clearCompletedBtn = null;
  let countAllEl = null;
  let countActiveEl = null;
  let countCompletedEl = null;
  let liveRegionEl = null;

  /**
   * Initializes the To-Do application once DOM is ready
   */
  function init() {
    // Cache DOM Elements
    formEl = document.getElementById('todo-form');
    inputEl = document.getElementById('todo-input');
    errorEl = document.getElementById('todo-input-error');
    listEl = document.getElementById('todo-list');
    emptyStateEl = document.getElementById('todo-empty-state');
    emptyTitleEl = document.getElementById('empty-title');
    emptyDescEl = document.getElementById('empty-desc');
    filterBtns = Array.from(document.querySelectorAll('.todo-filter-btn'));
    summaryEl = document.getElementById('todo-summary');
    clearCompletedBtn = document.getElementById('clear-completed-btn');
    countAllEl = document.getElementById('count-all');
    countActiveEl = document.getElementById('count-active');
    countCompletedEl = document.getElementById('count-completed');
    liveRegionEl = document.getElementById('todo-live-region');

    if (!formEl || !inputEl || !listEl) {
      return;
    }

    // Load initial tasks from localStorage
    tasks = loadTasks();

    // Register event listeners
    bindEvents();

    // Initial render
    renderTasks();
  }

  /**
   * Loads tasks from localStorage with safe error handling
   * @returns {Array<Object>}
   */
  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate structure of loaded items
          return parsed.filter(item => 
            item && 
            typeof item.id === 'string' && 
            typeof item.text === 'string' && 
            typeof item.completed === 'boolean'
          );
        }
      }
    } catch (err) {
      console.warn('Could not read tasks from localStorage. Falling back to defaults.', err);
    }
    
    // If no previous storage existed, save defaults so user can manipulate them
    const initial = [...DEFAULT_TASKS];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      // Ignore quota errors in edge environments
    }
    return initial;
  }

  /**
   * Saves current tasks array to localStorage
   */
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Could not save tasks to localStorage:', err);
      announceStatus('Warning: Unable to save tasks to local storage.');
    }
  }

  /**
   * Announces an update string to assistive technology via ARIA live region
   * @param {string} message
   */
  function announceStatus(message) {
    if (!liveRegionEl) return;
    liveRegionEl.textContent = '';
    // Brief timeout ensures screen readers detect text content mutation
    setTimeout(() => {
      liveRegionEl.textContent = message;
    }, 50);
  }

  /**
   * Helper to escape HTML to prevent XSS injection
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Sets up event listeners using Event Delegation
   */
  function bindEvents() {
    // Form submission for adding task
    formEl.addEventListener('submit', handleFormSubmit);

    // Real-time input error clearing
    inputEl.addEventListener('input', () => {
      if (inputEl.value.trim().length > 0) {
        clearFormError();
      }
    });

    // Event delegation on task list container
    listEl.addEventListener('click', handleListClick);
    listEl.addEventListener('change', handleListChange);
    listEl.addEventListener('keydown', handleListKeyDown);

    // Filter buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.getAttribute('data-filter');
        setFilter(filterType);
      });
    });

    // Clear completed button
    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', handleClearCompleted);
    }
  }

  /**
   * Handles task creation from the form
   * @param {Event} e
   */
  function handleFormSubmit(e) {
    e.preventDefault();
    const taskText = inputEl.value.trim();

    if (!taskText) {
      showFormError('Please enter a task description.');
      inputEl.focus();
      return;
    }

    clearFormError();
    addTask(taskText);
    inputEl.value = '';
    inputEl.focus();
  }

  /**
   * Adds a new task to state and persists
   * @param {string} text
   */
  function addTask(text) {
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      text: text,
      completed: false,
      createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();
    announceStatus(`Task added: "${text}".`);
    renderTasks();
  }

  /**
   * Displays an accessible validation error for the input form
   * @param {string} message
   */
  function showFormError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    inputEl.setAttribute('aria-invalid', 'true');
  }

  /**
   * Clears the input form validation error
   */
  function clearFormError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    inputEl.removeAttribute('aria-invalid');
  }

  /**
   * Event delegation for click events on the task list
   * @param {MouseEvent} e
   */
  function handleListClick(e) {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.getAttribute('data-action');
    const taskId = actionBtn.getAttribute('data-id');
    if (!taskId) return;

    if (action === 'delete') {
      deleteTask(taskId);
    } else if (action === 'edit') {
      startEditTask(taskId);
    } else if (action === 'save-edit') {
      submitEditTask(taskId);
    } else if (action === 'cancel-edit') {
      cancelEditTask();
    }
  }

  /**
   * Event delegation for checkbox changes on the task list
   * @param {Event} e
   */
  function handleListChange(e) {
    if (e.target.matches('.todo-checkbox')) {
      const taskId = e.target.getAttribute('data-id');
      if (taskId) {
        toggleTask(taskId);
      }
    }
  }

  /**
   * Keyboard support for inline editing inside the task list
   * @param {KeyboardEvent} e
   */
  function handleListKeyDown(e) {
    if (e.target.matches('.todo-edit-input')) {
      const taskId = e.target.getAttribute('data-id');
      if (e.key === 'Enter') {
        e.preventDefault();
        submitEditTask(taskId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditTask();
      }
    }
  }

  /**
   * Toggles the completion state of a task
   * @param {string} id
   */
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    announceStatus(`Task "${task.text}" marked as ${task.completed ? 'completed' : 'active'}.`);
    renderTasks();
  }

  /**
   * Enters inline edit mode for a task
   * @param {string} id
   */
  function startEditTask(id) {
    editingTaskId = id;
    renderTasks();

    // Focus and select the inline edit input
    const editInput = listEl.querySelector(`.todo-edit-input[data-id="${id}"]`);
    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  }

  /**
   * Submits the updated text for an edited task
   * @param {string} id
   */
  function submitEditTask(id) {
    const editInput = listEl.querySelector(`.todo-edit-input[data-id="${id}"]`);
    if (!editInput) return;

    const newText = editInput.value.trim();
    if (!newText) {
      editInput.setAttribute('aria-invalid', 'true');
      editInput.focus();
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (task) {
      const oldText = task.text;
      task.text = newText;
      saveTasks();
      announceStatus(`Task updated from "${oldText}" to "${newText}".`);
    }

    editingTaskId = null;
    renderTasks();

    // Return focus to the edit button of the modified task for keyboard accessibility
    setTimeout(() => {
      const editBtn = listEl.querySelector(`[data-action="edit"][data-id="${id}"]`);
      if (editBtn) editBtn.focus();
    }, 50);
  }

  /**
   * Cancels inline editing mode
   */
  function cancelEditTask() {
    const currentId = editingTaskId;
    editingTaskId = null;
    renderTasks();

    // Return focus to the edit button for seamless keyboard navigation
    if (currentId) {
      setTimeout(() => {
        const editBtn = listEl.querySelector(`[data-action="edit"][data-id="${currentId}"]`);
        if (editBtn) editBtn.focus();
      }, 50);
    }
  }

  /**
   * Deletes a task by ID
   * @param {string} id
   */
  function deleteTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    const deletedText = tasks[index].text;
    tasks.splice(index, 1);

    if (editingTaskId === id) {
      editingTaskId = null;
    }

    saveTasks();
    announceStatus(`Task deleted: "${deletedText}".`);
    renderTasks();

    // Accessible focus management: focus next item or input
    setTimeout(() => {
      const remainingItems = listEl.querySelectorAll('.todo-item');
      if (remainingItems.length > 0) {
        const focusTarget = remainingItems[Math.min(index, remainingItems.length - 1)].querySelector('button, input');
        if (focusTarget) focusTarget.focus();
      } else {
        inputEl.focus();
      }
    }, 50);
  }

  /**
   * Sets current filter and updates UI
   * @param {string} filterType - 'all' | 'active' | 'completed'
   */
  function setFilter(filterType) {
    if (['all', 'active', 'completed'].indexOf(filterType) === -1) return;

    currentFilter = filterType;

    // Update filter buttons ARIA and visual active class
    filterBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-filter') === filterType;
      btn.classList.toggle('is-active', isTarget);
      btn.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
    });

    announceStatus(`Filtering by ${filterType} tasks.`);
    renderTasks();
  }

  /**
   * Clears all completed tasks
   */
  function handleClearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    tasks = tasks.filter(t => !t.completed);
    editingTaskId = null;
    saveTasks();
    announceStatus(`Cleared ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}.`);
    renderTasks();
  }

  /**
   * Updates count badges and action buttons
   */
  function updateCounts() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;

    if (countAllEl) countAllEl.textContent = `(${total})`;
    if (countActiveEl) countActiveEl.textContent = `(${active})`;
    if (countCompletedEl) countCompletedEl.textContent = `(${completed})`;

    if (summaryEl) {
      summaryEl.textContent = `${active} ${active === 1 ? 'item' : 'items'} left`;
    }

    if (clearCompletedBtn) {
      clearCompletedBtn.disabled = completed === 0;
      clearCompletedBtn.setAttribute('aria-disabled', completed === 0 ? 'true' : 'false');
    }
  }

  /**
   * Renders the task list based on current state and active filter
   */
  function renderTasks() {
    updateCounts();

    // Filter tasks based on current filter
    const filteredTasks = tasks.filter(task => {
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true;
    });

    // Handle Empty State
    if (filteredTasks.length === 0) {
      listEl.innerHTML = '';
      listEl.style.display = 'none';
      if (emptyStateEl) {
        emptyStateEl.style.display = 'flex';
        updateEmptyStateMessage();
      }
      return;
    }

    if (emptyStateEl) {
      emptyStateEl.style.display = 'none';
    }
    listEl.style.display = 'flex';

    // Build DOM elements for tasks
    const fragment = document.createDocumentFragment();

    filteredTasks.forEach(task => {
      const isEditing = task.id === editingTaskId;
      const li = document.createElement('li');
      li.className = `todo-item ${task.completed ? 'is-completed' : ''} ${isEditing ? 'is-editing' : ''}`;
      li.setAttribute('data-id', task.id);

      if (isEditing) {
        // Render inline edit controls
        li.innerHTML = `
          <div class="todo-edit-wrapper" role="group" aria-label="Edit task: ${escapeHtml(task.text)}">
            <label for="edit-input-${task.id}" class="sr-only">Edit task description</label>
            <input 
              type="text" 
              id="edit-input-${task.id}"
              class="form-control todo-edit-input" 
              data-id="${task.id}"
              value="${escapeHtml(task.text)}"
              maxlength="200"
              aria-label="Edit task description"
              required
            >
            <div class="todo-edit-actions">
              <button 
                type="button" 
                class="btn btn-sm btn-primary todo-btn-save" 
                data-action="save-edit" 
                data-id="${task.id}" 
                aria-label="Save changes to task"
              >
                Save
              </button>
              <button 
                type="button" 
                class="btn btn-sm btn-secondary todo-btn-cancel" 
                data-action="cancel-edit" 
                data-id="${task.id}" 
                aria-label="Cancel editing"
              >
                Cancel
              </button>
            </div>
          </div>
        `;
      } else {
        // Render standard task item
        const safeText = escapeHtml(task.text);
        const completionStatus = task.completed ? 'completed' : 'active';
        
        li.innerHTML = `
          <div class="todo-item-content">
            <input 
              type="checkbox" 
              id="checkbox-${task.id}" 
              class="todo-checkbox" 
              data-id="${task.id}"
              ${task.completed ? 'checked' : ''}
              aria-label="Mark task '${safeText}' as ${task.completed ? 'incomplete' : 'complete'}"
            >
            <label for="checkbox-${task.id}" class="todo-text ${task.completed ? 'is-completed-text' : ''}">
              <span class="todo-checkbox-custom" aria-hidden="true">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1.5 5 4.5 8 10.5 2"></polyline>
                </svg>
              </span>
              <span class="todo-label-text">${safeText}</span>
              ${task.completed ? '<span class="todo-status-tag" aria-hidden="true">Done</span>' : ''}
              <span class="sr-only">Status: ${completionStatus}</span>
            </label>
          </div>
          <div class="todo-item-actions" role="group" aria-label="Actions for task: ${safeText}">
            <button 
              type="button" 
              class="todo-action-btn todo-edit-btn" 
              data-action="edit" 
              data-id="${task.id}" 
              aria-label="Edit task: ${safeText}"
              title="Edit task"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button 
              type="button" 
              class="todo-action-btn todo-delete-btn" 
              data-action="delete" 
              data-id="${task.id}" 
              aria-label="Delete task: ${safeText}"
              title="Delete task"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        `;
      }

      fragment.appendChild(li);
    });

    listEl.innerHTML = '';
    listEl.appendChild(fragment);
  }

  /**
   * Sets contextual message in empty state container
   */
  function updateEmptyStateMessage() {
    if (!emptyTitleEl || !emptyDescEl) return;

    if (currentFilter === 'active') {
      emptyTitleEl.textContent = 'No active tasks!';
      emptyDescEl.textContent = 'All tasks have been completed. Great productivity!';
    } else if (currentFilter === 'completed') {
      emptyTitleEl.textContent = 'No completed tasks yet';
      emptyDescEl.textContent = 'Mark tasks as done using the checkbox to see them here.';
    } else {
      emptyTitleEl.textContent = 'No tasks in your list';
      emptyDescEl.textContent = 'Add your first task above to start organizing your workflow.';
    }
  }

  // Self-initialize once the DOM document is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
