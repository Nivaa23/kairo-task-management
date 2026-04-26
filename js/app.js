/* ========================================
   KAIRO — Application Logic
   ======================================== */

(function () {
  'use strict';

  // ---- State ----
  const STATE_KEY = 'kairo_state';
  let state = loadState();

  function defaultState() {
    return {
      onboarded: false,
      userName: '',
      tasks: [],
      projects: [
        {
          id: 'demo-1',
          name: 'Website Redesign',
          desc: 'Redesign the company website with modern UI',
          members: [
            { initials: 'JD', color: '#8b7cf6' },
            { initials: 'AM', color: '#4ade80' },
            { initials: 'SK', color: '#fbbf24' },
          ],
          tasks: [
            { id: 't1', text: 'Wireframe homepage', category: 'Design', done: true },
            { id: 't2', text: 'Design system tokens', category: 'Design', done: true },
            { id: 't3', text: 'Mockup dashboard', category: 'Design', done: false },
            { id: 't4', text: 'Set up Vite project', category: 'Development', done: true },
            { id: 't5', text: 'Implement sidebar', category: 'Development', done: false },
            { id: 't6', text: 'Build task list component', category: 'Development', done: false },
            { id: 't7', text: 'Code review: auth flow', category: 'Review', done: true },
            { id: 't8', text: 'QA: responsive layout', category: 'Review', done: false },
          ],
        },
        {
          id: 'demo-2',
          name: 'Mobile App MVP',
          desc: 'Build the first version of the mobile app',
          members: [
            { initials: 'JD', color: '#8b7cf6' },
            { initials: 'RK', color: '#f87171' },
          ],
          tasks: [
            { id: 'm1', text: 'User research', category: 'Design', done: true },
            { id: 'm2', text: 'App flow diagrams', category: 'Design', done: true },
            { id: 'm3', text: 'UI kit setup', category: 'Design', done: true },
            { id: 'm4', text: 'Auth screens', category: 'Development', done: true },
            { id: 'm5', text: 'API integration', category: 'Development', done: false },
            { id: 'm6', text: 'Internal review', category: 'Review', done: false },
          ],
        },
      ],
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return defaultState();
  }

  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const splashScreen = $('#splashScreen');
  const splashInput = $('#splashInput');
  const onboardingScreen = $('#onboardingScreen');
  const onboardStep1 = $('#onboardStep1');
  const onboardStep2 = $('#onboardStep2');
  const onboardNameInput = $('#onboardNameInput');
  const onboardProjectInput = $('#onboardProjectInput');
  const appShell = $('#appShell');

  // ---- Splash ----
  splashInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && splashInput.value.trim()) {
      const taskText = splashInput.value.trim();
      state.tasks.push({ id: uid(), text: taskText, done: false });
      saveState();
      if (!state.onboarded) {
        splashScreen.classList.add('hidden');
        setTimeout(() => {
          onboardingScreen.classList.remove('hidden');
          onboardNameInput.focus();
        }, 500);
      } else {
        enterApp();
      }
    }
  });

  // ---- Onboarding ----
  $('#onboardNextBtn').addEventListener('click', () => {
    const name = onboardNameInput.value.trim();
    if (name) state.userName = name;
    onboardStep1.style.display = 'none';
    onboardStep2.style.display = 'block';
    onboardProjectInput.focus();
  });

  $('#onboardSkipBtn').addEventListener('click', () => {
    onboardStep1.style.display = 'none';
    onboardStep2.style.display = 'block';
    onboardProjectInput.focus();
  });

  $('#onboardDoneBtn').addEventListener('click', () => {
    const projectName = onboardProjectInput.value.trim();
    if (projectName) {
      state.projects.push({
        id: uid(), name: projectName, desc: '', members: [], tasks: [],
      });
    }
    finishOnboarding();
  });

  $('#onboardSkip2Btn').addEventListener('click', finishOnboarding);

  function finishOnboarding() {
    state.onboarded = true;
    saveState();
    onboardingScreen.classList.add('hidden');
    setTimeout(enterApp, 500);
  }

  // ---- Enter App ----
  function enterApp() {
    splashScreen.classList.add('hidden');
    onboardingScreen.classList.add('hidden');
    setTimeout(() => {
      appShell.classList.add('visible');
      renderHome();
    }, 300);
  }

  // If already onboarded, go straight to app
  if (state.onboarded) {
    splashScreen.classList.add('hidden');
    onboardingScreen.classList.add('hidden');
    appShell.classList.add('visible');
    requestAnimationFrame(renderHome);
  }

  // ---- Navigation ----
  const navItems = $$('.nav-item[data-view]');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });

  function switchView(viewName) {
    navItems.forEach((n) => n.classList.toggle('active', n.dataset.view === viewName));
    $$('.view').forEach((v) => v.classList.remove('active'));
    const target = $(`#view${capitalize(viewName)}`);
    if (target) target.classList.add('active');

    if (viewName === 'home') renderHome();
    else if (viewName === 'projects') renderProjects();
    else if (viewName === 'client') renderClientList();
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---- Greeting ----
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function formatDate() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  // ---- Render Home ----
  function renderHome() {
    const greeting = getGreeting();
    const name = state.userName || '';
    $('#homeGreeting').textContent = name ? `${greeting}, ${name}` : greeting;
    $('#homeDate').textContent = formatDate();

    // Update sidebar user
    if (name) {
      $('#sidebarAvatar').textContent = name.charAt(0).toUpperCase();
      $('#sidebarUserName').textContent = name;
    }

    renderFocusCards();
    renderTaskList();
  }

  // ---- Focus Cards ----
  function renderFocusCards() {
    const container = $('#focusCards');
    const incompleteTasks = state.tasks.filter((t) => !t.done);
    const top3 = incompleteTasks.slice(0, 3);
    const priorities = ['p1', 'p2', 'p3'];
    let html = '';

    for (let i = 0; i < 3; i++) {
      if (top3[i]) {
        html += `
          <div class="focus-card" data-id="${top3[i].id}">
            <div class="focus-priority ${priorities[i]}"></div>
            <div class="focus-text">${escapeHtml(top3[i].text)}</div>
          </div>`;
      } else {
        html += `<div class="focus-card empty">+ Add priority task</div>`;
      }
    }
    container.innerHTML = html;

    // Click empty to focus quick-add
    container.querySelectorAll('.focus-card.empty').forEach((card) => {
      card.addEventListener('click', () => {
        $('#quickAddInput').focus();
      });
    });
  }

  // ---- Task List ----
  function renderTaskList() {
    const container = $('#taskList');
    if (state.tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✦</div>
          <div class="empty-state-text">No tasks yet — add one below</div>
        </div>`;
      return;
    }

    // Sort: incomplete first, then completed
    const sorted = [...state.tasks].sort((a, b) => a.done - b.done);
    container.innerHTML = sorted.map((task) => `
      <div class="task-item ${task.done ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-checkbox ${task.done ? 'checked' : ''}" data-id="${task.id}"></div>
        <span class="task-name">${escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="task-action-btn task-delete-btn" data-id="${task.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Checkbox clicks
    container.querySelectorAll('.task-checkbox').forEach((cb) => {
      cb.addEventListener('click', () => {
        const task = state.tasks.find((t) => t.id === cb.dataset.id);
        if (task) { task.done = !task.done; saveState(); renderHome(); }
      });
    });

    // Delete clicks
    container.querySelectorAll('.task-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.tasks = state.tasks.filter((t) => t.id !== btn.dataset.id);
        saveState();
        renderHome();
      });
    });
  }

  // ---- Quick Add ----
  const quickAddInput = $('#quickAddInput');
  quickAddInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && quickAddInput.value.trim()) {
      state.tasks.push({ id: uid(), text: quickAddInput.value.trim(), done: false });
      quickAddInput.value = '';
      saveState();
      renderHome();
    }
  });

  // ---- Projects View ----
  function renderProjects() {
    const grid = $('#projectGrid');
    let html = state.projects.map((proj) => {
      const total = proj.tasks.length;
      const done = proj.tasks.filter((t) => t.done).length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      let statusClass = 'not-started';
      let statusText = 'Not started';
      if (pct === 100) { statusClass = 'completed'; statusText = 'Completed'; }
      else if (pct > 0) { statusClass = 'in-progress'; statusText = 'In progress'; }

      return `
        <div class="project-card" data-id="${proj.id}">
          <div class="project-card-name">${escapeHtml(proj.name)}</div>
          <div class="project-card-desc">${escapeHtml(proj.desc || 'No description')}</div>
          <div class="project-progress-bar"><div class="project-progress-fill" style="width:${pct}%"></div></div>
          <div class="project-progress-label">
            <span class="project-status-badge ${statusClass}">${statusText}</span>
            <span>${done}/${total} tasks</span>
          </div>
        </div>`;
    }).join('');

    html += `
      <div class="project-card new-project" id="addProjectCard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Project
      </div>`;

    grid.innerHTML = html;

    // Card clicks
    grid.querySelectorAll('.project-card:not(.new-project)').forEach((card) => {
      card.addEventListener('click', () => openProjectDash(card.dataset.id));
    });

    $('#addProjectCard').addEventListener('click', openNewProjectModal);
  }

  // ---- Project Dashboard ----
  let currentProjectId = null;

  function openProjectDash(projId) {
    currentProjectId = projId;
    switchViewDirect('projectDash');
    renderProjectDash();
  }

  function switchViewDirect(viewId) {
    navItems.forEach((n) => n.classList.remove('active'));
    if (viewId === 'projectDash') {
      $('#navProjects').classList.add('active');
    }
    $$('.view').forEach((v) => v.classList.remove('active'));
    $(`#view${capitalize(viewId)}`).classList.add('active');
  }

  function renderProjectDash() {
    const proj = state.projects.find((p) => p.id === currentProjectId);
    if (!proj) return;

    $('#projectDashTitle').textContent = proj.name;

    // Members
    const membersEl = $('#projectDashMembers');
    const colors = ['#8b7cf6', '#4ade80', '#fbbf24', '#f87171', '#60a5fa'];
    membersEl.innerHTML = (proj.members || []).map((m, i) =>
      `<div class="member-avatar" style="background:${m.color || colors[i % colors.length]}15; color:${m.color || colors[i % colors.length]}">${m.initials}</div>`
    ).join('');

    // Progress
    const total = proj.tasks.length;
    const done = proj.tasks.filter((t) => t.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    $('#projectDashFill').style.width = pct + '%';
    $('#projectDashPercent').textContent = pct + '%';

    let statusText = 'Not started';
    if (pct === 100) statusText = 'Completed';
    else if (pct > 0) statusText = 'In progress';
    $('#projectDashMeta').innerHTML = `${done} of ${total} tasks completed<br><span style="color:var(--text-muted)">${statusText}</span>`;

    // Groups
    const categories = {};
    proj.tasks.forEach((t) => {
      const cat = t.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(t);
    });

    const groupsEl = $('#projectDashGroups');
    groupsEl.innerHTML = Object.entries(categories).map(([cat, tasks]) => {
      const catDone = tasks.filter((t) => t.done).length;
      return `
        <div class="task-group">
          <div class="task-group-label">${escapeHtml(cat)} <span class="task-group-count">${catDone}/${tasks.length}</span></div>
          ${tasks.map((task) => `
            <div class="task-item ${task.done ? 'completed' : ''}" data-id="${task.id}" data-proj="${proj.id}">
              <div class="task-checkbox project-task-cb ${task.done ? 'checked' : ''}" data-id="${task.id}" data-proj="${proj.id}"></div>
              <span class="task-name">${escapeHtml(task.text)}</span>
            </div>
          `).join('')}
        </div>`;
    }).join('');

    // Task toggles
    groupsEl.querySelectorAll('.project-task-cb').forEach((cb) => {
      cb.addEventListener('click', () => {
        const p = state.projects.find((pr) => pr.id === cb.dataset.proj);
        const t = p?.tasks.find((tk) => tk.id === cb.dataset.id);
        if (t) { t.done = !t.done; saveState(); renderProjectDash(); }
      });
    });
  }

  $('#projectDashBack').addEventListener('click', () => {
    switchView('projects');
  });

  // ---- New Project Modal ----
  const newProjectModal = $('#newProjectModal');
  $('#newProjectBtn').addEventListener('click', openNewProjectModal);

  function openNewProjectModal() {
    $('#modalProjectName').value = '';
    $('#modalProjectDesc').value = '';
    newProjectModal.classList.add('visible');
    setTimeout(() => $('#modalProjectName').focus(), 100);
  }

  $('#modalCancelBtn').addEventListener('click', () => {
    newProjectModal.classList.remove('visible');
  });

  newProjectModal.addEventListener('click', (e) => {
    if (e.target === newProjectModal) newProjectModal.classList.remove('visible');
  });

  $('#modalCreateBtn').addEventListener('click', () => {
    const name = $('#modalProjectName').value.trim();
    if (!name) return;
    state.projects.push({
      id: uid(), name, desc: $('#modalProjectDesc').value.trim(),
      members: [], tasks: [],
    });
    saveState();
    newProjectModal.classList.remove('visible');
    renderProjects();
  });

  // ---- Client View ----
  function renderClientList() {
    const container = $('#clientProjectList');
    $('#clientViewSelect').style.display = 'block';
    $('#clientViewDetail').style.display = 'none';

    container.innerHTML = state.projects.map((proj) => {
      const total = proj.tasks.length;
      const done = proj.tasks.filter((t) => t.done).length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return `
        <div class="project-card" data-id="${proj.id}">
          <div class="project-card-name">${escapeHtml(proj.name)}</div>
          <div class="project-card-desc">${escapeHtml(proj.desc || 'No description')}</div>
          <div class="project-progress-bar"><div class="project-progress-fill" style="width:${pct}%"></div></div>
          <div class="project-progress-label"><span>${pct}% complete</span><span>${done}/${total}</span></div>
        </div>`;
    }).join('');

    container.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('click', () => renderClientDetail(card.dataset.id));
    });
  }

  function renderClientDetail(projId) {
    const proj = state.projects.find((p) => p.id === projId);
    if (!proj) return;

    $('#clientViewSelect').style.display = 'none';
    $('#clientViewDetail').style.display = 'block';
    $('#clientProjectTitle').textContent = proj.name;

    const total = proj.tasks.length;
    const done = proj.tasks.filter((t) => t.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    $('#clientProgressFill').style.width = pct + '%';
    $('#clientPercent').textContent = pct + '%';
    $('#clientMeta').innerHTML = `${done} of ${total} tasks completed`;

    const completed = proj.tasks.filter((t) => t.done);
    const pending = proj.tasks.filter((t) => !t.done);

    $('#clientCompletedTasks').innerHTML = completed.length
      ? completed.map((t) => `<div class="client-task-item"><div class="client-task-status done"></div>${escapeHtml(t.text)}</div>`).join('')
      : '<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">No completed tasks</div>';

    $('#clientPendingTasks').innerHTML = pending.length
      ? pending.map((t) => `<div class="client-task-item"><div class="client-task-status pending"></div>${escapeHtml(t.text)}</div>`).join('')
      : '<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">All tasks completed!</div>';
  }

  $('#clientBackBtn').addEventListener('click', () => renderClientList());

  // ---- Helpers ----
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- Keyboard shortcut: Ctrl+K to focus quick add ----
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = $('#quickAddInput');
      if (input && appShell.classList.contains('visible')) {
        switchView('home');
        setTimeout(() => input.focus(), 100);
      }
    }
  });

})();
