(function () {
  'use strict';
  const SK = 'kairo_state';
  let state = load();
  let currentFilter = 'all';
  let editingTaskId = null;
  let editingSource = null; // 'home' or projectId

  function defaults() {
    return {
      onboarded: false, userName: '',
      tasks: [
        { id: 'd1', text: 'Finalize homepage wireframes', done: false, status: 'in-progress', role: 'designer', category: 'Design', project: 'demo-1' },
        { id: 'd2', text: 'Set up CI/CD pipeline', done: false, status: 'not-started', role: 'developer', category: 'Development', project: '' },
        { id: 'd3', text: 'Review onboarding copy', done: true, status: 'completed', role: 'manager', category: 'Review', project: '' },
        { id: 'd4', text: 'Build notification service', done: false, status: 'not-started', role: 'developer', category: 'Development', project: 'demo-2' },
        { id: 'd5', text: 'Design mobile nav patterns', done: false, status: 'in-progress', role: 'designer', category: 'Design', project: 'demo-2' },
      ],
      projects: [
        {
          id: 'demo-1', name: 'Website Redesign', desc: 'Redesign the company website with modern UI',
          members: [{ initials: 'JD', color: '#8b7cf6' }, { initials: 'AM', color: '#4ade80' }, { initials: 'SK', color: '#fbbf24' }],
          tasks: [
            { id: 't1', text: 'Wireframe homepage', category: 'Design', done: true, status: 'completed', role: 'designer' },
            { id: 't2', text: 'Design system tokens', category: 'Design', done: true, status: 'completed', role: 'designer' },
            { id: 't3', text: 'Mockup dashboard', category: 'Design', done: false, status: 'in-progress', role: 'designer' },
            { id: 't4', text: 'Set up Vite project', category: 'Development', done: true, status: 'completed', role: 'developer' },
            { id: 't5', text: 'Implement sidebar', category: 'Development', done: false, status: 'not-started', role: 'developer' },
            { id: 't6', text: 'Build task list component', category: 'Development', done: false, status: 'blocked', role: 'developer' },
            { id: 't7', text: 'Code review: auth flow', category: 'Review', done: true, status: 'completed', role: 'reviewer' },
            { id: 't8', text: 'QA: responsive layout', category: 'Review', done: false, status: 'not-started', role: 'reviewer' },
          ]
        },
        {
          id: 'demo-2', name: 'Mobile App MVP', desc: 'Build the first version of the mobile app',
          members: [{ initials: 'JD', color: '#8b7cf6' }, { initials: 'RK', color: '#f87171' }],
          tasks: [
            { id: 'm1', text: 'User research', category: 'Design', done: true, status: 'completed', role: 'designer' },
            { id: 'm2', text: 'App flow diagrams', category: 'Design', done: true, status: 'completed', role: 'designer' },
            { id: 'm3', text: 'UI kit setup', category: 'Design', done: true, status: 'completed', role: 'designer' },
            { id: 'm4', text: 'Auth screens', category: 'Development', done: true, status: 'completed', role: 'developer' },
            { id: 'm5', text: 'API integration', category: 'Development', done: false, status: 'in-progress', role: 'developer' },
            { id: 'm6', text: 'Internal review', category: 'Review', done: false, status: 'not-started', role: 'reviewer' },
          ]
        },
      ]
    }
  }

  function load() {
    try {
      const r = localStorage.getItem(SK); if (r) {
        const s = JSON.parse(r);
        // migrate old tasks
        if (s.tasks) s.tasks.forEach(t => { if (!t.status) t.status = t.done ? 'completed' : 'not-started'; if (!t.role) t.role = ''; if (!t.category) t.category = ''; if (!t.project) t.project = ''; });
        if (s.projects) s.projects.forEach(p => { if (p.tasks) p.tasks.forEach(t => { if (!t.status) t.status = t.done ? 'completed' : 'not-started'; if (!t.role) t.role = ''; }); });
        return s;
      }
    } catch (e) { } return defaults()
  }
  function save() { localStorage.setItem(SK, JSON.stringify(state)) }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML }

  // --- Toast ---
  function toast(msg) { const t = $('#toast'); $('#toastText').textContent = msg; t.classList.add('visible'); setTimeout(() => t.classList.remove('visible'), 2200) }

  // --- Splash ---
  $('#splashInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      state.tasks.push({ id: uid(), text: e.target.value.trim(), done: false, status: 'not-started', role: '', category: '', project: '' });
      save();
      if (!state.onboarded) { $('#splashScreen').classList.add('hidden'); setTimeout(() => { $('#onboardingScreen').classList.remove('hidden'); $('#onboardNameInput').focus() }, 500) }
      else enterApp();
    }
  });

  // --- Onboarding ---
  $('#onboardNextBtn').addEventListener('click', () => { const n = $('#onboardNameInput').value.trim(); if (n) state.userName = n; $('#onboardStep1').style.display = 'none'; $('#onboardStep2').style.display = 'block'; $('#onboardProjectInput').focus() });
  $('#onboardSkipBtn').addEventListener('click', () => { $('#onboardStep1').style.display = 'none'; $('#onboardStep2').style.display = 'block'; $('#onboardProjectInput').focus() });
  $('#onboardDoneBtn').addEventListener('click', () => { const p = $('#onboardProjectInput').value.trim(); if (p) state.projects.push({ id: uid(), name: p, desc: '', members: [], tasks: [] }); finishOnboard() });
  $('#onboardSkip2Btn').addEventListener('click', finishOnboard);
  function finishOnboard() { state.onboarded = true; save(); $('#onboardingScreen').classList.add('hidden'); setTimeout(enterApp, 500) }

  function enterApp() { $('#splashScreen').classList.add('hidden'); $('#onboardingScreen').classList.add('hidden'); setTimeout(() => { $('#appShell').classList.add('visible'); renderHome() }, 300) }
  if (state.onboarded) { $('#splashScreen').classList.add('hidden'); $('#onboardingScreen').classList.add('hidden'); $('#appShell').classList.add('visible'); requestAnimationFrame(renderHome) }

  // --- Nav ---
  const navItems = $$('.nav-item[data-view]');
  navItems.forEach(it => it.addEventListener('click', () => switchView(it.dataset.view)));
  function switchView(v) { navItems.forEach(n => n.classList.toggle('active', n.dataset.view === v)); $$('.view').forEach(el => el.classList.remove('active')); const t = $('#view' + v.charAt(0).toUpperCase() + v.slice(1)); if (t) t.classList.add('active'); if (v === 'home') renderHome(); else if (v === 'projects') renderProjects(); else if (v === 'client') renderClientList() }
  function switchDirect(id) { navItems.forEach(n => n.classList.remove('active')); if (id === 'projectDash') $('#navProjects').classList.add('active'); $$('.view').forEach(v => v.classList.remove('active')); $('#view' + id.charAt(0).toUpperCase() + id.slice(1)).classList.add('active') }

  // --- Filter Tabs ---
  document.addEventListener('click', e => { const tab = e.target.closest('.filter-tab'); if (!tab) return; $$('.filter-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); currentFilter = tab.dataset.filter; renderTaskList() });

  // --- Helpers ---
  function getGreeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
  function fmtDate() { return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
  function statusClass(s) { return 's-' + (s || 'not-started') }
  function statusLabel(s) { return { ['not-started']: 'Not Started', ['in-progress']: 'In Progress', completed: 'Completed', blocked: 'Blocked' }[s] || 'Not Started' }
  function roleClass(r) { return r ? 'r-' + r : '' }
  function roleLabel(r) { return { designer: 'Designer', developer: 'Developer', manager: 'Manager', reviewer: 'Reviewer' }[r] || '' }

  // --- Render Home ---
  function renderHome() {
    const name = state.userName || '';
    $('#homeGreeting').textContent = name ? `${getGreeting()}, ${name}` : getGreeting();
    $('#homeDate').textContent = fmtDate();
    if (name) { $('#sidebarAvatar').textContent = name.charAt(0).toUpperCase(); $('#sidebarUserName').textContent = name }
    renderSummary(); renderActiveWork(); renderFocusCards(); renderTaskList();
  }

  // --- Summary Bar ---
  function renderSummary() {
    const total = state.tasks.length;
    const done = state.tasks.filter(t => t.done).length;
    const inProg = state.tasks.filter(t => t.status === 'in-progress').length;
    const pct = total ? Math.round(done / total * 100) : 0;
    $('#summaryBar').innerHTML = `
    <div class="summary-card"><div class="summary-card-label">Total Tasks</div><div class="summary-card-value">${total}</div><div class="summary-card-sub">${total - done} remaining</div></div>
    <div class="summary-card"><div class="summary-card-label">Completed</div><div class="summary-card-value" style="color:var(--green)">${done}</div><div class="summary-card-sub">of ${total} tasks</div></div>
    <div class="summary-card"><div class="summary-card-label">In Progress</div><div class="summary-card-value" style="color:var(--accent)">${inProg}</div><div class="summary-card-sub">active now</div></div>
    <div class="summary-card"><div class="summary-card-label">Progress</div><div class="summary-card-value">${pct}%</div><div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div></div>`;
  }

  // --- Active Work ---
  function renderActiveWork() {
    const active = state.tasks.filter(t => t.status === 'in-progress');
    const el = $('#activeSection');
    if (!active.length) { el.innerHTML = ''; return }
    el.innerHTML = `<div class="section-label">Currently Working On</div>${active.map(t => `
    <div class="active-card" data-id="${t.id}" data-src="home">
      <div class="active-pulse"></div>
      <span class="task-name">${esc(t.text)}</span>
      ${t.role ? `<span class="role-tag ${roleClass(t.role)}">${roleLabel(t.role)}</span>` : ''}
      ${t.project ? `<span class="task-project-tag">📁 ${esc(projName(t.project))}</span>` : ''}
    </div>`).join('')}`;
    el.querySelectorAll('.active-card').forEach(c => c.addEventListener('click', () => openPanel(c.dataset.id, 'home')));
  }

  function projName(pid) { const p = state.projects.find(x => x.id === pid); return p ? p.name : '' }

  // --- Focus Cards ---
  function renderFocusCards() {
    const c = $('#focusCards');
    const inc = state.tasks.filter(t => !t.done);
    const top3 = inc.slice(0, 3);
    const pris = ['p1', 'p2', 'p3'];
    let h = '';
    for (let i = 0; i < 3; i++) {
      if (top3[i]) {
        const t = top3[i];
        h += `<div class="focus-card-v2" data-id="${t.id}" data-src="home">
        <div class="focus-header"><div class="focus-priority ${pris[i]}"></div><div class="focus-text">${esc(t.text)}</div></div>
        <div class="focus-meta">
          <span class="status-badge ${statusClass(t.status)}">${statusLabel(t.status)}</span>
          ${t.role ? `<span class="role-tag ${roleClass(t.role)}">${roleLabel(t.role)}</span>` : ''}
        </div></div>`}
      else h += `<div class="focus-card empty" style="min-height:70px">+ Add task</div>`
    }
    c.innerHTML = h;
    c.querySelectorAll('.focus-card-v2').forEach(el => el.addEventListener('click', () => openPanel(el.dataset.id, 'home')));
    c.querySelectorAll('.focus-card.empty').forEach(el => el.addEventListener('click', () => $('#quickAddInput').focus()));
  }

  // --- Task List ---
  function renderTaskList() {
    const c = $('#taskList');
    let tasks = [...state.tasks];
    if (currentFilter === 'my') tasks = tasks.filter(t => t.role === 'designer' || t.role === 'developer');
    else if (currentFilter === 'active') tasks = tasks.filter(t => !t.done);
    else if (currentFilter === 'done') tasks = tasks.filter(t => t.done);
    tasks.sort((a, b) => a.done - b.done);
    if (!tasks.length) { c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✦</div><div class="empty-state-text">No tasks match this filter</div></div>`; return }
    c.innerHTML = tasks.map(t => `
    <div class="task-item-enhanced ${t.done ? 'completed' : ''}" data-id="${t.id}" data-src="home">
      <div class="task-checkbox ${t.done ? 'checked' : ''}" data-id="${t.id}"></div>
      <span class="task-name">${esc(t.text)}</span>
      <div class="task-meta">
        ${t.project ? `<span class="cat-tag">📁 ${esc(projName(t.project))}</span>` : ''}
        ${t.category ? `<span class="cat-tag">${esc(t.category)}</span>` : ''}
        ${t.role ? `<span class="role-tag ${roleClass(t.role)}">${roleLabel(t.role)}</span>` : ''}
        <span class="status-badge ${statusClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
      <div class="task-actions">
        <button class="task-action-btn task-edit-btn" data-id="${t.id}" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="task-action-btn task-delete-btn" data-id="${t.id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>`).join('');
    c.querySelectorAll('.task-checkbox').forEach(cb => cb.addEventListener('click', e => { e.stopPropagation(); const t = state.tasks.find(x => x.id === cb.dataset.id); if (t) { t.done = !t.done; t.status = t.done ? 'completed' : (t.status === 'completed' ? 'not-started' : t.status); save(); renderHome(); if (t.done) toast('Task completed ✨') } }));
    c.querySelectorAll('.task-edit-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openPanel(b.dataset.id, 'home') }));
    c.querySelectorAll('.task-delete-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); state.tasks = state.tasks.filter(x => x.id !== b.dataset.id); save(); renderHome(); toast('Task deleted') }));
    c.querySelectorAll('.task-item-enhanced').forEach(el => el.addEventListener('click', () => openPanel(el.dataset.id, 'home')));
  }

  // --- Quick Add ---
  $('#quickAddInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      state.tasks.push({ id: uid(), text: e.target.value.trim(), done: false, status: 'not-started', role: '', category: '', project: '' });
      e.target.value = ''; save(); renderHome(); toast('Task added')
    }
  });

  // --- Side Panel ---
  function openPanel(taskId, source) {
    editingTaskId = taskId; editingSource = source;
    let task;
    if (source === 'home') task = state.tasks.find(t => t.id === taskId);
    else { const p = state.projects.find(x => x.id === source); task = p?.tasks.find(t => t.id === taskId) }
    if (!task) return;
    $('#panelTaskName').value = task.text;
    $('#panelTaskStatus').value = task.status || 'not-started';
    $('#panelTaskRole').value = task.role || '';
    $('#panelTaskCategory').value = task.category || '';
    // populate project dropdown
    const pSel = $('#panelTaskProject');
    pSel.innerHTML = '<option value="">No project</option>' + state.projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    pSel.value = task.project || '';
    if (source !== 'home') { pSel.closest('.panel-field').style.display = 'none' } else { pSel.closest('.panel-field').style.display = '' }
    $('#sidePanelOverlay').classList.add('visible');
    $('#sidePanel').classList.add('visible');
    setTimeout(() => $('#panelTaskName').focus(), 150);
  }
  function closePanel() { $('#sidePanelOverlay').classList.remove('visible'); $('#sidePanel').classList.remove('visible'); editingTaskId = null; editingSource = null }
  $('#sidePanelClose').addEventListener('click', closePanel);
  $('#sidePanelOverlay').addEventListener('click', closePanel);
  $('#panelCancelBtn').addEventListener('click', closePanel);

  $('#panelSaveBtn').addEventListener('click', () => {
    let task;
    if (editingSource === 'home') task = state.tasks.find(t => t.id === editingTaskId);
    else { const p = state.projects.find(x => x.id === editingSource); task = p?.tasks.find(t => t.id === editingTaskId) }
    if (!task) return;
    task.text = $('#panelTaskName').value.trim() || task.text;
    task.status = $('#panelTaskStatus').value;
    task.done = task.status === 'completed';
    task.role = $('#panelTaskRole').value;
    task.category = $('#panelTaskCategory').value;
    if (editingSource === 'home') task.project = $('#panelTaskProject').value;
    save(); closePanel();
    if (editingSource === 'home') renderHome(); else renderProjectDash();
    toast('Task updated');
  });

  $('#panelDeleteBtn').addEventListener('click', () => {
    if (editingSource === 'home') state.tasks = state.tasks.filter(t => t.id !== editingTaskId);
    else { const p = state.projects.find(x => x.id === editingSource); if (p) p.tasks = p.tasks.filter(t => t.id !== editingTaskId) }
    save(); closePanel();
    if (editingSource === 'home') renderHome(); else renderProjectDash();
    toast('Task deleted');
  });

  // --- Projects ---
  function renderProjects() {
    const g = $('#projectGrid');
    let h = state.projects.map(p => {
      const total = p.tasks.length, done = p.tasks.filter(t => t.done).length, pct = total ? Math.round(done / total * 100) : 0;
      let sc = 'not-started', sl = 'Not started'; if (pct === 100) { sc = 'completed'; sl = 'Completed' } else if (pct > 0) { sc = 'in-progress'; sl = 'In progress' }
      return `<div class="project-card" data-id="${p.id}">
      <div class="project-card-name">${esc(p.name)}</div>
      <div class="project-card-desc">${esc(p.desc || 'No description')}</div>
      <div class="project-progress-bar"><div class="project-progress-fill" style="width:${pct}%"></div></div>
      <div class="project-progress-label">
        <span class="project-status-badge ${sc}">${sl}</span>
        <span>${pct}% · ${done}/${total} tasks</span>
      </div></div>`}).join('');
    h += `<div class="project-card new-project" id="addProjectCard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New Project</div>`;
    g.innerHTML = h;
    g.querySelectorAll('.project-card:not(.new-project)').forEach(c => c.addEventListener('click', () => openProjectDash(c.dataset.id)));
    $('#addProjectCard').addEventListener('click', openModal);
  }

  // --- Project Dashboard ---
  let curProjId = null;
  function openProjectDash(id) { curProjId = id; switchDirect('projectDash'); renderProjectDash() }

  function renderProjectDash() {
    const p = state.projects.find(x => x.id === curProjId); if (!p) return;
    $('#projectDashTitle').textContent = p.name;
    const colors = ['#8b7cf6', '#4ade80', '#fbbf24', '#f87171', '#60a5fa'];
    $('#projectDashMembers').innerHTML = (p.members || []).map((m, i) => `<div class="member-avatar" style="background:${m.color || colors[i % 5]}15;color:${m.color || colors[i % 5]}">${m.initials}</div>`).join('');
    const total = p.tasks.length, done = p.tasks.filter(t => t.done).length, pct = total ? Math.round(done / total * 100) : 0;
    $('#projectDashFill').style.width = pct + '%';
    $('#projectDashPercent').textContent = pct + '%';
    let st = 'Not started'; if (pct === 100) st = 'Completed'; else if (pct > 0) st = 'In progress';
    $('#projectDashMeta').innerHTML = `${done} of ${total} tasks completed<br><span style="color:var(--text-muted)">${st}</span>`;
    const cats = {}; p.tasks.forEach(t => { const c = t.category || 'General'; if (!cats[c]) cats[c] = []; cats[c].push(t) });
    $('#projectDashGroups').innerHTML = Object.entries(cats).map(([cat, tasks]) => {
      const cd = tasks.filter(t => t.done).length;
      return `<div class="task-group"><div class="task-group-label">${esc(cat)} <span class="task-group-count">${cd}/${tasks.length}</span></div>
    ${tasks.map(t => `<div class="task-item-enhanced ${t.done ? 'completed' : ''}" data-id="${t.id}" data-src="${p.id}">
      <div class="task-checkbox project-task-cb ${t.done ? 'checked' : ''}" data-id="${t.id}" data-proj="${p.id}"></div>
      <span class="task-name">${esc(t.text)}</span>
      <div class="task-meta">
        ${t.role ? `<span class="role-tag ${roleClass(t.role)}">${roleLabel(t.role)}</span>` : ''}
        <span class="status-badge ${statusClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
    </div>`).join('')}</div>`
    }).join('');
    $('#projectDashGroups').querySelectorAll('.project-task-cb').forEach(cb => cb.addEventListener('click', e => {
      e.stopPropagation(); const pr = state.projects.find(x => x.id === cb.dataset.proj); const t = pr?.tasks.find(x => x.id === cb.dataset.id);
      if (t) { t.done = !t.done; t.status = t.done ? 'completed' : (t.status === 'completed' ? 'not-started' : t.status); save(); renderProjectDash(); if (t.done) toast('Task completed ✨') }
    }));
    $('#projectDashGroups').querySelectorAll('.task-item-enhanced').forEach(el => el.addEventListener('click', () => openPanel(el.dataset.id, el.dataset.src)));
  }
  $('#projectDashBack').addEventListener('click', () => switchView('projects'));

  // --- Modal ---
  $('#newProjectBtn').addEventListener('click', openModal);
  function openModal() { $('#modalProjectName').value = ''; $('#modalProjectDesc').value = ''; $('#newProjectModal').classList.add('visible'); setTimeout(() => $('#modalProjectName').focus(), 100) }
  $('#modalCancelBtn').addEventListener('click', () => $('#newProjectModal').classList.remove('visible'));
  $('#newProjectModal').addEventListener('click', e => { if (e.target === $('#newProjectModal')) $('#newProjectModal').classList.remove('visible') });
  $('#modalCreateBtn').addEventListener('click', () => { const n = $('#modalProjectName').value.trim(); if (!n) return; state.projects.push({ id: uid(), name: n, desc: $('#modalProjectDesc').value.trim(), members: [], tasks: [] }); save(); $('#newProjectModal').classList.remove('visible'); renderProjects(); toast('Project created') });

  // --- Client View ---
  function renderClientList() {
    const c = $('#clientProjectList'); $('#clientViewSelect').style.display = 'block'; $('#clientViewDetail').style.display = 'none';
    c.innerHTML = state.projects.map(p => {
      const total = p.tasks.length, done = p.tasks.filter(t => t.done).length, pct = total ? Math.round(done / total * 100) : 0;
      return `<div class="project-card" data-id="${p.id}"><div class="project-card-name">${esc(p.name)}</div><div class="project-card-desc">${esc(p.desc || 'No description')}</div>
    <div class="project-progress-bar"><div class="project-progress-fill" style="width:${pct}%"></div></div>
    <div class="project-progress-label"><span>${pct}% complete</span><span>${done}/${total}</span></div></div>`
    }).join('');
    c.querySelectorAll('.project-card').forEach(cd => cd.addEventListener('click', () => renderClientDetail(cd.dataset.id)));
  }

  function renderClientDetail(pid) {
    const p = state.projects.find(x => x.id === pid); if (!p) return;
    $('#clientViewSelect').style.display = 'none'; $('#clientViewDetail').style.display = 'block';
    $('#clientProjectTitle').textContent = p.name;
    const total = p.tasks.length, done = p.tasks.filter(t => t.done).length, pct = total ? Math.round(done / total * 100) : 0;
    $('#clientProgressFill').style.width = pct + '%'; $('#clientPercent').textContent = pct + '%';
    $('#clientMeta').textContent = `${done} of ${total} tasks completed`;
    $('#clientStatsGrid').innerHTML = `
    <div class="client-stat-card"><div class="client-stat-value" style="color:var(--green)">${done}</div><div class="client-stat-label">Completed</div></div>
    <div class="client-stat-card"><div class="client-stat-value" style="color:var(--text-secondary)">${total - done}</div><div class="client-stat-label">Pending</div></div>`;
    const comp = p.tasks.filter(t => t.done), pend = p.tasks.filter(t => !t.done);
    $('#clientSectionGrid').innerHTML = `
    <div class="client-section-col"><h3>Completed <span class="count">(${comp.length})</span></h3>
      ${comp.length ? comp.map(t => `<div class="client-task-item"><div class="client-task-status done"></div>${esc(t.text)}</div>`).join('') : '<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">None yet</div>'}</div>
    <div class="client-section-col"><h3>Pending <span class="count">(${pend.length})</span></h3>
      ${pend.length ? pend.map(t => `<div class="client-task-item"><div class="client-task-status pending"></div>${esc(t.text)}</div>`).join('') : '<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">All done!</div>'}</div>`;
  }
  $('#clientBackBtn').addEventListener('click', () => renderClientList());

  // --- Keyboard ---
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); if ($('#appShell').classList.contains('visible')) { switchView('home'); setTimeout(() => $('#quickAddInput').focus(), 100) } }
    if (e.key === 'Escape') closePanel();
  });
})();
