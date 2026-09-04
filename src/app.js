/* ─────────────────────────────────────────────────────────────
   Pursuit Deck — the card half of Trivial Pursuit. The board,
   pieces and wedges stay on the table; this just deals questions
   and keeps the running tally.
   ───────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // Board order. Codes are the ones printed on a Genus card.
  // History's yellow needs dark type on top of it.
  var CATEGORIES = [
    { id: 'geography',     code: 'G',  label: 'Geography' },
    { id: 'entertainment', code: 'E',  label: 'Entertainment' },
    { id: 'history',       code: 'H',  label: 'History', onLight: true },
    { id: 'arts',          code: 'AL', label: 'Arts & Literature' },
    { id: 'science',       code: 'SN', label: 'Science & Nature' },
    { id: 'sports',        code: 'SL', label: 'Sports & Leisure' }
  ];

  var DIFFICULTY = {
    all:  { set: [1, 2, 3], help: 'The full spread — mostly fair, with a few that will stump you.' },
    easy: { set: [1, 2],    help: 'Easy and medium only. Faster turns, more questions actually answered.' },
    hard: { set: [2, 3],    help: 'Medium and hard only. Closer to the original box. Expect long turns.' }
  };

  var MIN_PLAYERS = 2;
  var MAX_PLAYERS = 6;

  var BANK = [];
  try {
    var node = document.getElementById('bank');
    BANK = node ? JSON.parse(node.textContent) : [];
  } catch (err) {
    BANK = [];
  }

  // ── storage ────────────────────────────────────────────────
  // Every read and write is guarded: a private window, blocked site data,
  // or a thumbnail pass must degrade to a working game, not a blank screen.

  var KEY = 'pursuitdeck.v1';
  var storageOK = true;

  function load(fallback) {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      storageOK = false;
      return fallback;
    }
  }

  function save() {
    if (!storageOK) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({
        asked: Array.from(state.asked),
        flagged: Array.from(state.flagged),
        settings: state.settings,
        session: state.session,
        players: state.players,
        activePlayerId: state.activePlayerId
      }));
    } catch (err) {
      storageOK = false;
    }
  }

  function defaultPlayers() {
    return [
      { id: 'p1', name: 'Player 1', got: 0, missed: 0 },
      { id: 'p2', name: 'Player 2', got: 0, missed: 0 }
    ];
  }

  var saved = load({}) || {};

  var state = {
    asked: new Set(Array.isArray(saved.asked) ? saved.asked : []),
    flagged: new Set(Array.isArray(saved.flagged) ? saved.flagged : []),
    settings: Object.assign(
      { difficulty: 'all', housePct: 15, labels: {} },
      saved.settings || {}
    ),
    session: Object.assign({ asked: 0, got: 0, missed: 0, started: false }, saved.session || {}),
    // Older saves (and a hand-edited one) can carry fewer than two players.
    players: Array.isArray(saved.players) && saved.players.length >= MIN_PLAYERS
      ? saved.players
      : defaultPlayers(),
    activePlayerId: saved.activePlayerId || null,
    current: null
  };

  if (!DIFFICULTY[state.settings.difficulty]) state.settings.difficulty = 'all';

  // ── helpers ────────────────────────────────────────────────

  var $ = function (id) { return document.getElementById(id); };

  function catById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function labelFor(cat) {
    var custom = state.settings.labels[cat.id];
    return (custom && custom.trim()) || cat.label;
  }

  function activeDifficulties() {
    return DIFFICULTY[state.settings.difficulty].set;
  }

  function poolFor(catId) {
    var diffs = activeDifficulties();
    return BANK.filter(function (q) {
      return q.category === catId && diffs.indexOf(q.difficulty) !== -1;
    });
  }

  function remainingFor(catId) {
    return poolFor(catId).filter(function (q) { return !state.asked.has(q.id); }).length;
  }

  function hasHouse() {
    return BANK.some(function (q) { return q.pack === 'house'; });
  }

  var toastTimer = null;
  function toast(message) {
    var el = $('toast');
    el.textContent = message;
    el.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.hidden = true; }, 3400);
  }

  // ── players ────────────────────────────────────────────────
  // The board and the pie pieces still hold the real score. This is only
  // the running tally of who is answering correctly.

  function activePlayer() {
    if (!state.players.length) return null;
    for (var i = 0; i < state.players.length; i++) {
      if (state.players[i].id === state.activePlayerId) return state.players[i];
    }
    state.activePlayerId = state.players[0].id;
    return state.players[0];
  }

  function advancePlayer() {
    if (state.players.length < 2) return;
    var index = state.players.indexOf(activePlayer());
    state.activePlayerId = state.players[(index + 1) % state.players.length].id;
  }

  function nextPlayerId() {
    var used = {};
    state.players.forEach(function (p) { used[p.id] = true; });
    var n = 1;
    while (used['p' + n]) n++;
    return 'p' + n;
  }

  function removePlayer(id) {
    if (state.players.length <= MIN_PLAYERS) {
      toast('Two players minimum.');
      return;
    }
    state.players = state.players.filter(function (p) { return p.id !== id; });
    if (state.activePlayerId === id) state.activePlayerId = state.players[0].id;
    save();
    renderPlayers();
    buildPlayerEditor();
  }

  function renderPlayers() {
    var strip = $('players');
    strip.textContent = '';
    strip.hidden = !state.players.length;

    state.players.forEach(function (player) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'player-chip';
      chip.setAttribute('data-player', player.id);

      var name = document.createElement('span');
      name.className = 'player-name';
      name.textContent = player.name;

      var record = document.createElement('span');
      record.className = 'player-record';
      record.innerHTML = '<span class="got"></span><i>✓</i><span class="missed"></span><i>✕</i>';

      chip.appendChild(name);
      chip.appendChild(record);
      chip.addEventListener('click', function () {
        state.activePlayerId = player.id;
        save();
        refreshPlayers();
      });

      strip.appendChild(chip);
    });

    refreshPlayers();
  }

  function refreshPlayers() {
    var active = activePlayer();

    state.players.forEach(function (player) {
      var chip = document.querySelector('.player-chip[data-player="' + player.id + '"]');
      if (!chip) return;
      var isActive = active && player.id === active.id;
      chip.classList.toggle('is-active', !!isActive);
      chip.setAttribute('aria-pressed', String(!!isActive));
      chip.querySelector('.player-name').textContent = player.name;
      chip.querySelector('.got').textContent = player.got;
      chip.querySelector('.missed').textContent = player.missed;
      chip.setAttribute('aria-label',
        player.name + ', ' + player.got + ' right, ' + player.missed + ' wrong' +
        (isActive ? ', answering now' : ''));
    });

    var scoring = $('scoring-for');
    scoring.hidden = !active;
    if (active) {
      scoring.textContent = '';
      scoring.appendChild(document.createTextNode('Scoring for '));
      var strong = document.createElement('b');
      strong.textContent = active.name;
      scoring.appendChild(strong);
      if (state.players.length > 1) {
        scoring.appendChild(document.createTextNode(' — tap to change'));
      }
    }
  }

  function buildPlayerEditor() {
    var grid = $('players-edit');
    if (!grid) return;
    grid.textContent = '';

    state.players.forEach(function (player) {
      var row = document.createElement('div');
      row.className = 'player-row';

      var input = document.createElement('input');
      input.type = 'text';
      input.value = player.name;
      input.setAttribute('aria-label', 'Name for ' + player.name);
      input.addEventListener('input', function () {
        player.name = input.value;
        save();
        refreshPlayers();
      });

      var score = document.createElement('span');
      score.className = 'player-row-score';
      score.textContent = player.got + '/' + player.missed;

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'link-btn';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + player.name);
      remove.disabled = state.players.length <= MIN_PLAYERS;
      remove.addEventListener('click', function () { removePlayer(player.id); });

      row.appendChild(input);
      row.appendChild(score);
      row.appendChild(remove);
      grid.appendChild(row);
    });
  }

  // ── start / restart a session ──────────────────────────────
  // A session is the players and their tally. It is deliberately separate
  // from the deck's asked-question memory, so starting a new game does not
  // hand you questions you already answered last night.

  var draftNames = [];

  function openStartDialog(canCancel) {
    draftNames = state.players.length >= MIN_PLAYERS
      ? state.players.map(function (p) { return p.name; })
      : ['Player 1', 'Player 2'];

    $('start-cancel').hidden = !canCancel;
    buildStartRows();
    $('start-dialog').hidden = false;
    $('start-scrim').hidden = false;
  }

  function closeStartDialog() {
    $('start-dialog').hidden = true;
    $('start-scrim').hidden = true;
  }

  function buildStartRows() {
    var grid = $('start-players');
    grid.textContent = '';

    draftNames.forEach(function (name, index) {
      var row = document.createElement('div');
      row.className = 'player-row';

      var input = document.createElement('input');
      input.type = 'text';
      input.value = name;
      input.placeholder = 'Player ' + (index + 1);
      input.setAttribute('aria-label', 'Player ' + (index + 1) + ' name');
      input.addEventListener('input', function () { draftNames[index] = input.value; });

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'link-btn';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove player ' + (index + 1));
      remove.disabled = draftNames.length <= MIN_PLAYERS;
      remove.addEventListener('click', function () {
        draftNames.splice(index, 1);
        buildStartRows();
      });

      row.appendChild(input);
      row.appendChild(remove);
      grid.appendChild(row);
    });

    $('start-add').disabled = draftNames.length >= MAX_PLAYERS;
  }

  function commitStart() {
    state.players = draftNames.map(function (name, index) {
      return {
        id: 'p' + (index + 1),
        name: (name || '').trim() || ('Player ' + (index + 1)),
        got: 0,
        missed: 0
      };
    });
    state.activePlayerId = state.players[0].id;
    state.session = { asked: 0, got: 0, missed: 0, started: true };

    save();
    renderPlayers();
    buildPlayerEditor();
    closeStartDialog();
    show('home');
  }

  // ── tiles ──────────────────────────────────────────────────

  function buildTiles() {
    var grid = $('tiles');
    grid.textContent = '';

    CATEGORIES.forEach(function (cat) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.setAttribute('data-cat', cat.id);
      tile.style.setProperty('--tile', 'var(--c-' + cat.id + ')');
      tile.style.setProperty('--tile-ink', cat.onLight ? 'var(--on-fill-dark)' : 'var(--on-fill)');

      var code = document.createElement('span');
      code.className = 'tile-code';
      code.textContent = cat.code;

      var foot = document.createElement('span');
      foot.className = 'tile-foot';

      var name = document.createElement('span');
      name.className = 'tile-name';

      var count = document.createElement('span');
      count.className = 'tile-count';

      foot.appendChild(name);
      foot.appendChild(count);
      tile.appendChild(code);
      tile.appendChild(foot);

      tile.addEventListener('click', function () { startQuestion(cat.id); });
      grid.appendChild(tile);
    });
  }

  function refreshHome() {
    var total = 0;

    CATEGORIES.forEach(function (cat) {
      var left = remainingFor(cat.id);
      total += left;

      var tile = document.querySelector('.tile[data-cat="' + cat.id + '"]');
      if (!tile) return;
      tile.querySelector('.tile-name').textContent = labelFor(cat);
      tile.querySelector('.tile-count').textContent = left;
      tile.classList.toggle('is-empty', left === 0);
      tile.setAttribute('aria-label', labelFor(cat) + ', ' + left + ' questions left');
    });

    $('tally-count').textContent = total + ' LEFT';

    var line = $('session-line');
    if (!BANK.length) {
      line.textContent = 'No questions loaded yet.';
    } else if (state.session.asked === 0) {
      line.textContent = BANK.length + ' questions in the deck';
    } else {
      line.textContent =
        state.session.asked + ' asked · ' +
        state.session.got + ' got · ' +
        state.session.missed + ' missed';
    }

    refreshPlayers();
  }

  // ── drawing a question ─────────────────────────────────────

  function pickFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function drawQuestion(catId, excludeId) {
    var pool = poolFor(catId);
    if (!pool.length) return null;

    var house = [], core = [];
    pool.forEach(function (q) { (q.pack === 'house' ? house : core).push(q); });

    // Roll for the house pack, then fall back to core if it's dry.
    var wantHouse = house.length && (Math.random() * 100) < state.settings.housePct;
    var primary = wantHouse ? house : core;
    var secondary = wantHouse ? core : house;

    function fresh(list) {
      return list.filter(function (q) {
        return !state.asked.has(q.id) && q.id !== excludeId;
      });
    }

    var candidates = fresh(primary);
    if (!candidates.length) candidates = fresh(secondary);

    if (!candidates.length) {
      // Whole category is spent — reshuffle it and say so out loud, rather
      // than silently repeating questions.
      pool.forEach(function (q) { state.asked.delete(q.id); });
      save();
      toast(labelFor(catById(catId)) + ' is reshuffled — you had been through all ' + pool.length + '.');
      candidates = pool.filter(function (q) { return q.id !== excludeId; });
      if (!candidates.length) candidates = pool;
    }

    return pickFrom(candidates);
  }

  function applyCategoryTheme(node, cat) {
    node.style.setProperty('--cat', 'var(--c-' + cat.id + ')');
    node.style.setProperty('--cat-ink', 'var(--i-' + cat.id + ')');
    node.style.setProperty('--on-cat', cat.onLight ? 'var(--on-fill-dark)' : 'var(--on-fill)');
  }

  function chipText(cat) {
    return cat.code + ' · ' + labelFor(cat);
  }

  function startQuestion(catId, excludeId) {
    var pool = poolFor(catId);
    if (!pool.length) {
      var cat = catById(catId);
      toast(BANK.length
        ? 'No ' + labelFor(cat) + ' questions at this difficulty. Try "Everything" in settings.'
        : 'The deck is empty — no questions have been loaded.');
      return;
    }

    var question = drawQuestion(catId, excludeId);
    if (!question) return;

    state.current = question;
    var category = catById(catId);

    var view = $('view-question');
    applyCategoryTheme(view, category);

    $('q-chip').textContent = chipText(category);
    $('q-text').textContent = question.q;

    var pips = $('q-pips');
    pips.textContent = '';
    for (var i = 1; i <= 3; i++) {
      var pip = document.createElement('i');
      if (i <= question.difficulty) pip.className = 'on';
      pips.appendChild(pip);
    }

    show('question');
  }

  function revealAnswer() {
    var question = state.current;
    if (!question) return;

    var category = catById(question.category);
    var view = $('view-answer');
    applyCategoryTheme(view, category);

    $('a-chip').textContent = chipText(category);
    $('a-question').textContent = question.q;
    $('a-text').textContent = question.a;

    var accept = $('a-accept');
    if (question.accept && question.accept.length) {
      accept.textContent = '';
      var tag = document.createElement('b');
      tag.textContent = 'Also accept: ';
      accept.appendChild(tag);
      accept.appendChild(document.createTextNode(question.accept.join(' · ')));
      accept.hidden = false;
    } else {
      accept.hidden = true;
    }

    $('a-note').textContent = question.note || '';
    $('a-note').hidden = !question.note;

    syncFlagButton();
    refreshPlayers();
    show('answer');
  }

  function settle(gotIt) {
    var question = state.current;
    if (question) {
      state.asked.add(question.id);
      state.session.asked += 1;
      state.session[gotIt ? 'got' : 'missed'] += 1;

      var player = activePlayer();
      if (player) {
        player[gotIt ? 'got' : 'missed'] += 1;
        // Same rule as the board: a right answer rolls again, a wrong one
        // passes the turn along. So a normal turn needs no tapping at all.
        if (!gotIt) advancePlayer();
      }
      save();
    }
    state.current = null;
    show('home');
  }

  // ── flagging ───────────────────────────────────────────────

  function syncFlagButton() {
    var question = state.current;
    var button = $('btn-flag');
    var flagged = question && state.flagged.has(question.id);
    button.classList.toggle('is-flagged', !!flagged);
    $('flag-label').textContent = flagged ? 'Flagged — tap to unflag' : 'Flag this question';
  }

  function toggleFlag() {
    var question = state.current;
    if (!question) return;
    if (state.flagged.has(question.id)) {
      state.flagged.delete(question.id);
    } else {
      state.flagged.add(question.id);
      toast('Flagged. Find the list in settings when you want to send them over.');
    }
    save();
    syncFlagButton();
  }

  // ── views ──────────────────────────────────────────────────

  function show(name) {
    ['home', 'question', 'answer'].forEach(function (view) {
      $('view-' + view).hidden = view !== name;
    });
    if (name === 'home') refreshHome();
    window.scrollTo(0, 0);
  }

  // ── settings ───────────────────────────────────────────────

  function openSheet() {
    refreshSettings();
    $('sheet').hidden = false;
    $('sheet-scrim').hidden = false;
  }

  function closeSheet() {
    $('sheet').hidden = true;
    $('sheet-scrim').hidden = true;
    refreshHome();
  }

  function refreshSettings() {
    buildPlayerEditor(); // scores shown here drift as the game goes on

    var buttons = $('seg-difficulty').querySelectorAll('button');
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.diff === state.settings.difficulty));
    });
    $('diff-help').textContent = DIFFICULTY[state.settings.difficulty].help;

    var house = hasHouse();
    $('house-range').value = state.settings.housePct;
    $('house-range').disabled = !house;
    $('house-pct').textContent = state.settings.housePct + '%';
    $('house-help').textContent = house
      ? 'How often a question comes from your own pack instead of the general deck.'
      : 'No house questions yet. Add your own to data/house/house.json and they will mix in here.';

    var summary = BANK.length + ' questions total · ' + state.asked.size + ' already asked';
    if (!storageOK) summary += ' · this browser is not saving progress';
    $('bank-summary').textContent = summary;

    $('flag-summary').textContent = state.flagged.size
      ? state.flagged.size + ' flagged: ' + Array.from(state.flagged).join(', ')
      : 'Nothing flagged. Use the flag button on any question that is wrong or unfair.';
  }

  function buildLabelInputs() {
    var grid = $('labels-grid');
    grid.textContent = '';

    CATEGORIES.forEach(function (cat) {
      var label = document.createElement('label');

      var swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.setProperty('--tile', 'var(--c-' + cat.id + ')');
      swatch.style.setProperty('--tile-ink', cat.onLight ? 'var(--on-fill-dark)' : 'var(--on-fill)');
      swatch.textContent = cat.code;
      swatch.setAttribute('aria-hidden', 'true');

      var input = document.createElement('input');
      input.type = 'text';
      input.value = labelFor(cat);
      input.setAttribute('aria-label', cat.label + ' name');
      input.addEventListener('input', function () {
        state.settings.labels[cat.id] = input.value;
        save();
        refreshHome();
      });

      label.appendChild(swatch);
      label.appendChild(input);
      grid.appendChild(label);
    });
  }

  // ── wiring ─────────────────────────────────────────────────

  $('btn-reveal').addEventListener('click', revealAnswer);
  $('btn-skip').addEventListener('click', function () {
    var question = state.current;
    if (question) startQuestion(question.category, question.id);
  });
  $('btn-home-q').addEventListener('click', function () {
    state.current = null;
    show('home');
  });
  $('btn-got').addEventListener('click', function () { settle(true); });
  $('btn-missed').addEventListener('click', function () { settle(false); });
  $('btn-flag').addEventListener('click', toggleFlag);

  // Fixes a mis-set turn without leaving the answer.
  $('scoring-for').addEventListener('click', function () {
    advancePlayer();
    save();
    refreshPlayers();
  });

  $('open-settings').addEventListener('click', openSheet);
  $('close-settings').addEventListener('click', closeSheet);
  $('sheet-scrim').addEventListener('click', closeSheet);

  $('seg-difficulty').addEventListener('click', function (event) {
    var button = event.target.closest('button[data-diff]');
    if (!button) return;
    state.settings.difficulty = button.dataset.diff;
    save();
    refreshSettings();
  });

  $('house-range').addEventListener('input', function (event) {
    state.settings.housePct = Number(event.target.value);
    $('house-pct').textContent = state.settings.housePct + '%';
    save();
  });

  $('add-player').addEventListener('click', function () {
    if (state.players.length >= MAX_PLAYERS) {
      toast('Six players is the most the board holds.');
      return;
    }
    state.players.push({
      id: nextPlayerId(),
      name: 'Player ' + (state.players.length + 1),
      got: 0,
      missed: 0
    });
    save();
    renderPlayers();
    buildPlayerEditor();
  });

  $('btn-new-game').addEventListener('click', function () {
    closeSheet();
    openStartDialog(true);
  });

  $('start-add').addEventListener('click', function () {
    if (draftNames.length >= MAX_PLAYERS) return;
    draftNames.push('Player ' + (draftNames.length + 1));
    buildStartRows();
  });
  $('start-go').addEventListener('click', commitStart);
  $('start-cancel').addEventListener('click', closeStartDialog);

  $('btn-reset-asked').addEventListener('click', function () {
    state.asked.clear();
    save();
    refreshSettings();
    refreshHome();
    toast('Deck reshuffled. Every question is back in play.');
  });

  $('btn-copy-flags').addEventListener('click', function () {
    if (!state.flagged.size) {
      toast('Nothing flagged yet.');
      return;
    }
    var text = Array.from(state.flagged).join(', ');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast('Copied ' + state.flagged.size + ' flagged question IDs.'); },
        function () { toast('Could not copy — the IDs are listed above.'); }
      );
    } else {
      toast('The IDs are listed above.');
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!$('sheet').hidden) closeSheet();
    else if (!$('start-dialog').hidden && !$('start-cancel').hidden) closeStartDialog();
  });

  // ── start ──────────────────────────────────────────────────

  buildTiles();
  buildLabelInputs();
  renderPlayers();
  buildPlayerEditor();
  refreshSettings();
  show('home');

  // First run of a fresh browser: ask who is playing before anything else.
  if (!state.session.started) openStartDialog(false);
})();
