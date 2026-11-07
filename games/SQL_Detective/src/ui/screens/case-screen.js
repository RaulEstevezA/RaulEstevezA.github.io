/**
 * The workspace of a case: the paper file on one side and the ATLAS terminal on the other.
 *
 * A case moves through three phases, derived from its saved state (see `currentPhase`):
 * - `leads`: there is a lead to solve with a query.
 * - `accusation`: all the leads are solved and the dossier asks for names.
 * - `closed`: the case is finished. Its tables can still be queried.
 *
 * The game rules are in `core/`. This module only connects them to the page.
 * Registered in `ui/app.js`.
 */

import { findNextCase } from '../../core/campaign.js';
import { localize, localizeRows, localizeTables } from '../../core/localize.js';
import { runMetaCommand } from '../../core/meta-commands.js';
import { advanceStage, caseRecord, chooseEnding, closeCase, markHelpSeen, markPrologueSeen, markSceneSeen, recordWrongAccusation, revealHint } from '../../core/progress.js';
import { checkResult } from '../../core/result-check.js';
import { credibility } from '../../core/scoring.js';
import { executeQuery } from '../../core/sql-engine.js';
import { getChapter, missions } from '../../content/campaign.js';
import { uiText } from '../../content/ui-text.js';
import { createArchivePanel } from '../components/archive-panel.js';
import { createAccusationForm, createDecisionPanel } from '../components/deduction.js';
import { createResultsTable } from '../components/results-table.js';
import { openCasePassage, openHandbook, openHelp, openPrologue } from '../components/story-dialogs.js';
import { h } from '../dom.js';

const fileText = uiText.caseFile;
const terminalText = uiText.terminal;

/**
 * Decides which phase a case is in.
 *
 * @param {object} mission The case.
 * @param {object} record Its saved state.
 * @returns {'leads'|'accusation'|'closed'} The phase.
 */
function currentPhase(mission, record) {
  if (record.closed) return 'closed';
  return record.stage < mission.stages.length ? 'leads' : 'accusation';
}

/** Replaces the `{name}` marks of a message. */
const fill = (message, values) =>
  message.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));

/**
 * Renders a case.
 *
 * @param {object} app Interface of the application (see `ui/app.js`).
 * @param {{caseId: string}} params Case to open.
 * @returns {Node[]} Content of the screen.
 */
export function renderCase(app, { caseId }) {
  const mission = missions.find((item) => item.id === caseId);
  const language = app.language;
  const t = (value) => localize(value, language);
  const record = () => caseRecord(app.progress, mission.id);
  const tables = localizeTables(mission.tables, language);

  /* Parts of the page that change while the case is being played. */
  const leadPanel = h('section', { class: 'lead', 'aria-live': 'polite' });
  const notebookPanel = h('section', { class: 'notebook' });
  const statusLine = h('p', { class: 'terminal__status', role: 'status' });
  const resultArea = h('div', { class: 'terminal__result' }, h('p', { class: 'terminal__empty' }, t(terminalText.empty)));
  const hintArea = h('div', { class: 'terminal__hints' });
  const hintButton = h('button', { class: 'button', type: 'button', onClick: showHint });
  const credibilityLabel = h('span', { class: 'screen-bar__summary' });
  const editor = h('textarea', {
    id: 'query',
    class: 'terminal__editor',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    rows: '7',
    placeholder: t(terminalText.placeholder),
    onKeydown: (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        runQuery();
      }
    },
  });
  const runButton = h('button', { class: 'button button--primary', type: 'button', onClick: runQuery }, t(terminalText.run));

  /** Writes a message under the editor. The tone is also carried by the words themselves. */
  function setStatus(message, tone = '') {
    statusLine.className = `terminal__status${tone ? ` terminal__status--${tone}` : ''}`;
    statusLine.textContent = message;
  }

  /** Current lead, or `null` when none is pending. */
  const currentStage = () => (currentPhase(mission, record()) === 'leads' ? mission.stages[record().stage] : null);

  function renderHints() {
    const stage = currentStage();
    const available = stage?.hints ?? [];
    const shown = stage ? (record().hintsShown[record().stage] ?? 0) : 0;
    hintArea.replaceChildren(
      ...available.slice(0, shown).map((hint, index) =>
        h('p', { class: 'terminal__hint' }, h('b', {}, `${t(terminalText.hintLabel)} ${index + 1}: `), t(hint)),
      ),
    );
    hintButton.textContent = t(available.length ? terminalText.hint : terminalText.hintNone);
    hintButton.disabled = shown >= available.length;
    hintButton.hidden = !stage;
  }

  function renderCredibility() {
    credibilityLabel.textContent = `${t(uiText.missions.credibility)} ${credibility(app.progress)}`;
  }

  function renderNotebook() {
    const solved = mission.stages.slice(0, record().stage);
    notebookPanel.replaceChildren(
      h('h3', { class: 'file__heading' }, t(fileText.notebook)),
      solved.length
        ? h('ol', { class: 'notebook__clues' }, solved.map((stage) => h('li', {}, t(stage.clue))))
        : h('p', { class: 'file__muted' }, t(fileText.notebookEmpty)),
    );
  }

  /** Renders the form that asks for the names of those responsible. */
  const accusationForm = () =>
    createAccusationForm({
      accusation: mission.accusation,
      language,
      onCorrect: finishCase,
      onWrong: () => {
        app.updateProgress((progress) => recordWrongAccusation(progress, mission.id));
        renderCredibility();
      },
    });

  /** Renders the choice that ends the story. */
  const decisionForm = () =>
    createDecisionPanel({
      decision: mission.decision,
      language,
      onChoose: (endingId) => {
        app.updateProgress((progress) => closeCase(chooseEnding(progress, endingId), mission.id));
        app.navigate('ending');
      },
    });

  /** Renders the options that follow a closed case. */
  function closedPanel() {
    const nextId = findNextCase(missions, mission.id);
    const lastCase = !nextId;
    return h(
      'div',
      { class: 'lead__closed' },
      h('p', { class: 'stamp', 'aria-hidden': 'true' }, t(fileText.closedStamp)),
      h('p', {}, t(fileText.closedNote)),
      h('button', { class: 'text-button', type: 'button', onClick: showClosing }, t(fileText.reread)),
      lastCase
        ? h(
            'button',
            { class: 'button button--stamp', type: 'button', onClick: () => app.navigate(app.progress.ending ? 'ending' : 'missions') },
            t(app.progress.ending ? fileText.finish : fileText.toFiles),
          )
        : h('button', { class: 'button button--stamp', type: 'button', onClick: () => app.navigate('case', { caseId: nextId }) }, t(fileText.continue)),
    );
  }

  function renderLead() {
    const phase = currentPhase(mission, record());
    if (phase === 'leads') {
      const stage = currentStage();
      leadPanel.replaceChildren(
        h('p', { class: 'file__eyebrow' }, `${t(fileText.lead)} ${record().stage + 1} / ${mission.stages.length}`),
        h('h2', { class: 'lead__title' }, t(stage.title)),
        h('p', { class: 'lead__briefing' }, t(stage.briefing)),
      );
    } else if (phase === 'accusation' && mission.accusation && !leadPanel.dataset.accused) {
      leadPanel.replaceChildren(h('p', { class: 'file__eyebrow' }, t(fileText.allLeads)), accusationForm());
    } else if (phase === 'accusation' && mission.decision) {
      leadPanel.replaceChildren(decisionForm());
    } else {
      leadPanel.replaceChildren(closedPanel());
    }
  }

  function showClosing() {
    openCasePassage({ mission, texts: t(mission.closing), action: t(uiText.document.close), language });
  }

  /** Closes the case, or moves on to the decision when the story still needs it. */
  function finishCase() {
    if (mission.decision) {
      leadPanel.dataset.accused = 'true';
      renderLead();
      openCasePassage({ mission, texts: t(mission.closing), action: t(uiText.deduction.decide), language });
      return;
    }
    app.updateProgress((progress) => closeCase(progress, mission.id));
    renderLead();
    const nextId = findNextCase(missions, mission.id);
    openCasePassage({
      mission,
      texts: t(mission.closing),
      action: t(nextId ? fileText.continue : fileText.toFiles),
      language,
      onClose: () => app.navigate(nextId ? 'case' : 'missions', nextId ? { caseId: nextId } : undefined),
    });
  }

  /** Moves to the next lead, and to the end of the case after the last one. */
  function solveStage(stage) {
    app.updateProgress((progress) => advanceStage(progress, mission.id));
    setStatus(stage.reaction ? `${t(terminalText.leadSolved)} ${t(stage.reaction)}` : t(terminalText.leadSolved), 'success');
    renderNotebook();
    renderHints();
    if (record().stage === mission.stages.length && !mission.accusation && !mission.decision) finishCase();
    else renderLead();
  }

  function showHint() {
    app.updateProgress((progress) => revealHint(progress, mission.id, record().stage));
    renderHints();
    renderCredibility();
  }

  /** Shows the result of a query and checks it against the current lead. */
  function showResult(result) {
    resultArea.replaceChildren(
      result.values.length
        ? createResultsTable(result)
        : h('p', { class: 'terminal__empty' }, t(terminalText.noRows)),
    );
    const count = result.values.length;
    setStatus(`${count} ${t(count === 1 ? terminalText.row : terminalText.rows)}`);

    const stage = currentStage();
    if (!stage) return;
    const outcome = checkResult(result, { expected: localizeRows(stage.expected, language), ordered: stage.ordered });
    if (outcome.match) solveStage(stage);
    else setStatus(`${count} ${t(count === 1 ? terminalText.row : terminalText.rows)}. ${fill(t(terminalText.mismatch[outcome.reason]), outcome)}`, 'warning');
  }

  /** Runs what is written in the editor. */
  async function runQuery() {
    runButton.disabled = true;
    runButton.textContent = t(terminalText.running);
    try {
      const session = { tables, hideSchema: mission.hideSchema };
      const meta = runMetaCommand(editor.value, session);
      if (meta) {
        // Terminal commands explore the archive: they never answer a lead.
        resultArea.replaceChildren(createResultsTable(meta));
        setStatus('');
      } else {
        showResult(executeQuery(await app.loadSql(), tables, editor.value));
      }
    } catch (error) {
      const message = terminalText.errors[error.code];
      if (message) setStatus(`${t(message)}${error.detail ? ` ${error.detail}` : ''}`, 'error');
      else setStatus(t(terminalText.engineFailed), 'error');
    } finally {
      runButton.disabled = false;
      runButton.textContent = t(terminalText.run);
    }
  }

  /** Puts a query on a table in the editor and runs it. */
  function previewTable(name) {
    editor.value = `SELECT * FROM ${name} LIMIT 5;`;
    runQuery();
  }

  renderNotebook();
  renderHints();
  renderLead();
  renderCredibility();

  /** Opens the opening scene of the case. */
  function showScene(onClose) {
    openCasePassage({ mission, texts: t(mission.scene), action: t(fileText.toTerminal), language, onClose });
  }

  /**
   * Plays what comes before the first query, one window after another: the instructions
   * on the first case ever, the prologue of a new chapter and the scene of a new case.
   */
  function playIntroduction() {
    const chapter = getChapter(mission.chapter);
    const steps = [
      !app.progress.helpSeen && ((next) => {
        app.updateProgress(markHelpSeen);
        openHelp({ language, onClose: next });
      }),
      !app.progress.prologuesSeen.includes(chapter.id) && ((next) => {
        app.updateProgress((progress) => markPrologueSeen(progress, chapter.id));
        openPrologue({ chapter, language, onClose: next });
      }),
      !record().sceneSeen && ((next) => {
        app.updateProgress((progress) => markSceneSeen(progress, mission.id));
        showScene(next);
      }),
    ].filter(Boolean);

    const runNext = () => {
      const step = steps.shift();
      if (step) step(runNext);
      else editor.focus();
    };
    runNext();
  }
  queueMicrotask(playIntroduction);

  return [
    h(
      'div',
      { class: 'screen-bar' },
      h('button', { class: 'back-button', type: 'button', onClick: () => app.navigate('missions') }, `← ${t(fileText.back)}`),
      credibilityLabel,
    ),
    h(
      'main',
      { id: 'game', class: `case chapter-theme chapter-theme--${mission.chapter}`, tabindex: '-1' },
      h(
        'article',
        { class: 'file' },
        h('p', { class: 'file__eyebrow' }, t(mission.location)),
        h('h1', { class: 'file__title' }, t(mission.title)),
        h('p', { class: 'file__concepts' }, mission.concepts.map((concept) => h('span', {}, concept))),
        leadPanel,
        notebookPanel,
        createArchivePanel({ tables, hideSchema: mission.hideSchema, language, onPreview: previewTable }),
        h(
          'div',
          { class: 'file__actions' },
          h('button', { class: 'text-button', type: 'button', onClick: () => showScene() }, t(fileText.readScene)),
          h('button', { class: 'text-button', type: 'button', onClick: () => openHandbook({ language }) }, t(fileText.handbook)),
        ),
      ),
      h(
        'section',
        { class: 'terminal', 'aria-labelledby': 'terminal-title' },
        h('h2', { id: 'terminal-title', class: 'terminal__title' }, t(terminalText.title)),
        h('label', { class: 'sr-only', for: 'query' }, t(terminalText.label)),
        editor,
        h('div', { class: 'terminal__actions' }, runButton, hintButton, h('span', { class: 'terminal__shortcut' }, t(terminalText.shortcut))),
        hintArea,
        statusLine,
        h('h3', { class: 'terminal__subtitle' }, t(terminalText.results)),
        resultArea,
      ),
    ),
  ];
}
