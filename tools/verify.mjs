// Verify a theme change against the running Obsidian over the Chromium debugging port.
// Relaunch Obsidian with:  open -a Obsidian --args --remote-debugging-port=9222
// Typical run, from the theme folder:
//   node tools/verify.mjs setup tools/check-note.md
//   node tools/verify.mjs snapshot before
//   python3 fonts/embed.py && node tools/verify.mjs reload
//   node tools/verify.mjs snapshot after
//   node tools/verify.mjs diff before after      → "NO DIFFERENCES" apart from the cursor-blink noise
//   node tools/verify.mjs teardown
// Take before and after in the same tab: CodeMirror renders only a viewport slice,
// and a reopened note gives a different element count. A snapshot brings its tab
// to the front for a few seconds and then returns to the tab that was active.
//
// Commands:
//   node tools/verify.mjs setup <note.md>       create the check note and open it in a new tab
//   node tools/verify.mjs snapshot <name>       store computed styles in the page under that name
//                                      (LP + Reading × light/dark × desktop/mobile body classes)
//   node tools/verify.mjs diff <a> <b>          compare two stored snapshots, print differences
//   node tools/verify.mjs reload                app.customCss.requestLoadTheme()
//   node tools/verify.mjs teardown              close the tab and move the check note to the trash
//   node tools/verify.mjs eval "<js>"           run an expression
//   node tools/verify.mjs settings [tab ...]     open Settings and measure, for every heading in each
//                                      tab, the left edge of its name against the name of the
//                                      row below it (light/dark × desktop/mobile body classes);
//                                      default tabs: editor, appearance and every plugin tab;
//                                      a tab id Obsidian does not know is reported, not measured
// diff and settings exit 1 when they find something, so either can gate a script.
//
// SECURITY: while Obsidian runs with the debugging port open, any process on
// this machine can run code inside it, with the vault and the file system in
// reach. This script talks to 127.0.0.1 only and refuses a target that is not
// on it. Quit Obsidian and start it normally when the check is done.
import { readFileSync } from "node:fs";

const NOTE = "_klartext-check.md";
const PORT = 9222;
const HOST = "127.0.0.1";
const TIMEOUT_MS = 60_000;   // one CDP call; a snapshot walks ~8 contexts and takes ~20s
const CONNECT_MS = 5_000;    // the /json listing, and opening the socket it names

const USAGE = `usage:
  node tools/verify.mjs setup <note.md>
  node tools/verify.mjs snapshot <name>
  node tools/verify.mjs diff <a> <b>
  node tools/verify.mjs reload | teardown
  node tools/verify.mjs eval "<js>"
  node tools/verify.mjs settings [tab ...]`;
const ARITY = { setup: 1, snapshot: 1, diff: 2, reload: 0, teardown: 0, eval: 1, settings: 0 };
const [cmd, a1, a2] = process.argv.slice(2);
if (!(cmd in ARITY) || process.argv.slice(3).length < ARITY[cmd]) {
  console.error(cmd in ARITY ? `${cmd}: missing argument\n${USAGE}` : USAGE);
  process.exit(2);
}
for (const name of cmd === "snapshot" ? [a1] : cmd === "diff" ? [a1, a2] : []) {
  if (!/^[\w.-]+$/.test(name)) {
    console.error(`snapshot names are letters, digits, "_", "-" and "." — got "${name}"`);
    process.exit(2);
  }
}

let res;
try {
  res = await fetch(`http://${HOST}:${PORT}/json`, { signal: AbortSignal.timeout(CONNECT_MS) });
} catch (e) {
  console.error(`No debugging port on ${HOST}:${PORT} (${e.cause?.code ?? e.name}). Relaunch Obsidian with:\n  open -a Obsidian --args --remote-debugging-port=${PORT}`);
  process.exit(2);
}
// Something answers on the port, but not necessarily Chromium: say so rather
// than telling the user to relaunch an Obsidian that may not be the listener.
const targets = await res.json().catch(() => null);
if (!Array.isArray(targets)) {
  console.error(`${HOST}:${PORT} answered /json with HTTP ${res.status} and no target list; is another program using the port?`);
  process.exit(2);
}
const pages = targets.filter(t => t.type === "page");
const page = pages.find(t => /\bObsidian v?\d+\.\d+/.test(t.title));
if (!page) throw new Error("no Obsidian page target among: " + (pages.map(t => JSON.stringify(t.title)).join(", ") || "none"));
// Only a socket on this machine, on the port asked for: a /json answered by
// something else must not be able to hand this script another host.
const wsUrl = new URL(page.webSocketDebuggerUrl);
if (wsUrl.protocol !== "ws:" || !["127.0.0.1", "localhost", "[::1]"].includes(wsUrl.hostname) || wsUrl.port !== String(PORT)) {
  throw new Error(`refusing debugger socket ${wsUrl.origin}: not ${HOST}:${PORT}`);
}
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => {
  const timer = setTimeout(() => { ws.close(); j(new Error(`the debugger socket did not open within ${CONNECT_MS / 1000}s`)); }, CONNECT_MS);
  ws.onopen = () => { clearTimeout(timer); r(); };
  ws.onerror = () => { clearTimeout(timer); j(new Error("could not open the debugger socket")); };
});
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
ws.onclose = e => { for (const [, res] of pending) res({ error: "socket closed " + e.code }); pending.clear(); };
const send = (method, params = {}) => new Promise(res => {
  const i = ++id;
  const timer = setTimeout(() => { pending.delete(i); res({ error: `${method} timed out after ${TIMEOUT_MS / 1000}s — is Obsidian showing a dialog?` }); }, TIMEOUT_MS);
  pending.set(i, (m) => { clearTimeout(timer); res(m); });
  ws.send(JSON.stringify({ id: i, method, params }));
});
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.error) throw new Error(typeof r.error === "string" ? r.error : JSON.stringify(r.error));
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails, null, 1).slice(0, 3000));
  return r.result?.result?.value;
}
await send("Emulation.setFocusEmulationEnabled", { enabled: true });

try {
  if (cmd === "setup") {
    const content = readFileSync(a1, "utf8");
    console.log(await ev(`(async () => {
      const path = ${JSON.stringify(NOTE)};
      const content = ${JSON.stringify(content)};
      let f = app.vault.getAbstractFileByPath(path), note = 'created';
      if (!f) f = await app.vault.create(path, content);
      else if ((await app.vault.read(f)) !== content) { await app.vault.modify(f, content); note = 'refreshed'; }
      else note = 'reused';
      const leaf = app.workspace.getLeaf('tab');
      await leaf.openFile(f);
      return note + ' and opened ' + path;
    })()`));
  } else if (cmd === "reload") {
    console.log(await ev(`(async () => { app.customCss.requestLoadTheme(); await new Promise(r => setTimeout(r, 1000)); return 'reloaded theme ' + app.customCss.theme; })()`));
  } else if (cmd === "teardown") {
    console.log(await ev(`(async () => {
      const path = ${JSON.stringify(NOTE)};
      app.workspace.iterateAllLeaves(l => { if (l.view?.getViewType?.() === 'markdown' && l.view.file?.path === path) l.detach(); });
      const f = app.vault.getAbstractFileByPath(path);
      if (f) await app.vault.trash(f, true);   // the system trash, so it can be recovered
      delete window.__kxSnaps; return (f ? 'moved to the trash: ' : 'nothing to remove at ') + path;
    })()`));
  } else if (cmd === "settings") {
    const tabs = process.argv.slice(3);
    const out = await ev(`(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      app.setting.open(); await wait(600);
      const asked = ${JSON.stringify(tabs)};
      const ids = asked.length ? asked : ['editor', 'appearance', ...new Set((app.setting.pluginTabs ?? []).map(t => t.id))];
      // Settings may open in a pop-out window: classes go on that window's body.
      const body = app.setting.modalEl.ownerDocument.body;
      const orig = body.className;
      const rows = [];
      const nameLeft = el => el.querySelector('.setting-item-name')?.getBoundingClientRect().left;
      try {
      for (const id of ids) {
        app.setting.openTabById(id); await wait(500);
        // openTabById ignores an id it does not know and leaves the last tab
        // open, which would be measured under this id. (activeTab is
        // internal; without it the check is skipped rather than failing all.)
        if (app.setting.activeTab && app.setting.activeTab.id !== id) { rows.push(id.padEnd(16) + 'no such settings tab'); continue; }
        for (const dark of [false, true]) for (const mobile of [false, true]) {
          body.classList.toggle('theme-dark', dark); body.classList.toggle('theme-light', !dark);
          for (const c of ['is-mobile', 'is-phone']) body.classList.toggle(c, mobile);
          await wait(120);
          const root = app.setting.modalEl.querySelector('.vertical-tab-content');
          const items = [...root.querySelectorAll('.setting-item')].filter(e => e.getClientRects().length);
          let worst = 0, n = 0;
          items.forEach((h, i) => {
            if (!h.classList.contains('setting-item-heading')) return;
            const row = items.slice(i + 1).find(e => !e.classList.contains('setting-item-heading'));
            const hl = nameLeft(h), rl = row && nameLeft(row);
            if (hl === undefined || rl === undefined) return;   // a custom row without a name element
            const d = hl - rl;
            n++; if (Math.abs(d) > Math.abs(worst)) worst = d;
          });
          if (n) rows.push(id.padEnd(16) + (dark ? 'dark ' : 'light') + ' ' + (mobile ? 'mobile ' : 'desktop') + '  ' + n + ' headings, worst offset ' + (Math.round(worst * 10) / 10) + 'px');
        }
      }
      } finally {
        body.className = orig;
        app.setting.close();
      }
      return rows;
    })()`);
    console.log(out.join("\n"));
    const unknown = out.filter((l) => l.endsWith("no such settings tab"));
    const off = out.filter((l) => !unknown.includes(l) && !/worst offset -?0px$/.test(l));
    if (unknown.length) console.log(unknown.length + " tab ids not found");
    console.log(off.length ? off.length + " contexts with a heading off its rows" : "EVERY HEADING FLUSH WITH ITS ROWS");
    if (off.length || unknown.length) process.exitCode = 1;
  } else if (cmd === "eval") {
    console.log(JSON.stringify(await ev(a1), null, 1));
  } else if (cmd === "snapshot") {
    console.log(await ev(`(async () => {
      const path = ${JSON.stringify(NOTE)};
      // The markdown view only: the backlinks pane carries the same file, and
      // as the last leaf iterated it won, so a snapshot measured the sidebar.
      let leaf = null; app.workspace.iterateAllLeaves(l => { if (l.view?.getViewType?.() === 'markdown' && l.view.file?.path === path) leaf = l; });
      if (!leaf) throw new Error('check note not open');
      const wait = ms => new Promise(r => setTimeout(r, ms));
      // The leaf must be laid out: a background tab has no boxes and every
      // computed length reads as auto. Reveal it for the snapshot and hand the
      // previously active tab back afterwards.
      const prevLeaf = app.workspace.activeLeaf;
      const prevState = leaf.getViewState();   // the mode it was in, restored at the end
      app.workspace.revealLeaf(leaf); await wait(500);
      if (!leaf.view.containerEl.getClientRects().length) throw new Error('check note leaf is hidden');
      const setMode = async mode => { const vs = leaf.getViewState(); vs.state = { ...vs.state, mode, source: false }; await leaf.setViewState(vs); await wait(700); };
      const SEP = '\\u001f';
      let names = null;
      const walk = (root, limit) => {
        const res = []; if (!root) return res;
        const els = [root, ...root.querySelectorAll('*')].slice(0, limit);
        els.forEach((el, i) => {
          if (el.closest && el.closest('svg')) return;             // svg internals (mermaid, icons) are not the theme's DOM
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\\s+/).filter(c => c && !/^(cm-active|cm-focused|is-focused|mod-active|has-focus|is-hovered|is-flashing)$/.test(c)).sort().join('.') : '';
          const key = i + ':' + el.tagName.toLowerCase() + (cls ? '.' + cls : '');
          const rec = {};
          for (const pseudo of [null, '::before', '::after', '::marker']) {
            const cs = getComputedStyle(el, pseudo);
            if (pseudo && cs.content === 'none') continue;
            if (!names) { names = []; for (let k = 0; k < cs.length; k++) names.push(cs[k]); }
            const vals = new Array(names.length);
            for (let k = 0; k < names.length; k++) vals[k] = cs.getPropertyValue(names[k]);
            rec[pseudo || 'self'] = vals.join(SEP);
          }
          res.push([key, rec]);
        });
        return res;
      };
      const roots = () => ([
        ['note', leaf.view.containerEl, 5000],
        ['tabs', document.querySelector('.mod-root .workspace-tab-header-container'), 200],
        ['left', document.querySelector('.workspace-split.mod-left-split'), 250],
        ['status', document.querySelector('.status-bar'), 100],
        ['ribbon', document.querySelector('.workspace-ribbon.mod-left'), 100],
      ]);
      const body = document.body;
      const origClasses = body.className;
      const snap = {};
      document.activeElement?.blur?.();
      try {
      for (const mode of ['source', 'preview']) {
        await setMode(mode);
        if (mode === 'source') { try { leaf.view.editor.setCursor({ line: 0, ch: 0 }); } catch (e) {} }
        await wait(300);
        for (const dark of [false, true]) {
          body.classList.toggle('theme-dark', dark); body.classList.toggle('theme-light', !dark);
          for (const mobile of [false, true]) {
            for (const c of ['is-mobile', 'is-phone', 'is-ios']) body.classList.toggle(c, mobile);
            await wait(150);
            const s = {};
            for (const [name, root, limit] of roots()) s[name] = walk(root, limit);
            snap[mode + '/' + (dark ? 'dark' : 'light') + '/' + (mobile ? 'mobile' : 'desktop')] = s;
          }
        }
      }
      } finally {
        // Whatever happened above, the user's window gets its own classes,
        // mode and tab back rather than staying in the emulated state.
        body.className = origClasses;
        try { await leaf.setViewState(prevState); await wait(300); } catch (e) {}
        if (prevLeaf && prevLeaf !== leaf) { try { app.workspace.revealLeaf(prevLeaf); } catch (e) {} }
      }
      window.__kxSnaps = window.__kxSnaps || {};
      window.__kxSnaps[${JSON.stringify(a1)}] = { names, snap };
      const n = Object.values(snap).reduce((a, s) => a + Object.values(s).reduce((b, l) => b + l.length, 0), 0);
      return 'stored snapshot ' + ${JSON.stringify(a1)} + ': ' + n + ' element records in ' + Object.keys(snap).length + ' contexts, ' + names.length + ' properties';
    })()`));
  } else if (cmd === "diff") {
    const out = await ev(`(() => {
      const A = window.__kxSnaps?.[${JSON.stringify(a1)}], B = window.__kxSnaps?.[${JSON.stringify(a2)}];
      if (!A || !B) throw new Error('missing snapshot');
      const SEP = '\\u001f'; const lines = []; let total = 0;
      // Values are stored positionally against the snapshot's own property
      // list, and that list is whatever the browser reported at the time. Add
      // a custom property to the stylesheet and the list grows, so comparing
      // by index reads every later value against its neighbour and calls the
      // whole snapshot a difference — two million of them, none real. Compare
      // by NAME, and say plainly which properties only one side had.
      const ia = new Map(A.names.map((n, i) => [n, i]));
      const ib = new Map(B.names.map((n, i) => [n, i]));
      const shared = A.names.filter((n) => ib.has(n));
      const push = (line) => { total++; if (lines.length < 400) lines.push(line); };
      for (const [label, from, to] of [['only in ' + ${JSON.stringify(a1)}, A.names, ib], ['only in ' + ${JSON.stringify(a2)}, B.names, ia]]) {
        const only = from.filter((n) => !to.has(n));
        if (only.length) push(label + ': ' + only.join(', '));
      }
      // Every context and root either side has, so one missing on a side is a
      // difference to report rather than a property of undefined.
      for (const ctx of new Set([...Object.keys(A.snap), ...Object.keys(B.snap)])) {
        const ca = A.snap[ctx] || {}, cb = B.snap[ctx] || {};
        if (!A.snap[ctx] || !B.snap[ctx]) { push(ctx + ': context only in ' + (A.snap[ctx] ? ${JSON.stringify(a1)} : ${JSON.stringify(a2)})); continue; }
        for (const root of new Set([...Object.keys(ca), ...Object.keys(cb)])) {
          const la = ca[root] || [], lb = cb[root] || [];
          if (la.length !== lb.length) push(ctx + '/' + root + ': element count ' + la.length + ' → ' + lb.length);
          const bm = new Map(lb), am = new Map(la);
          for (const [key] of lb) if (!am.has(key)) push(ctx + '/' + root + ' new: ' + key);
          for (const [key, rec] of la) {
            const rb = bm.get(key);
            if (!rb) { push(ctx + '/' + root + ' gone: ' + key); continue; }
            for (const part of new Set([...Object.keys(rec), ...Object.keys(rb)])) {
              if (rec[part] === rb[part]) continue;
              const va = (rec[part] || '').split(SEP), vb = (rb[part] || '').split(SEP);
              for (const name of shared) {
                const x = va[ia.get(name)], y = vb[ib.get(name)];
                if (x === y) continue;
                push(ctx + '/' + root + ' ' + key + ' ' + part + ' ' + name + ': ' + x + ' → ' + y);
              }
            }
          }
        }
      }
      return { total, lines };
    })()`);
    console.log(out.lines.join("\n"));
    if (out.total > out.lines.length) console.log(`… ${out.total - out.lines.length} more not shown (the first ${out.lines.length} are above)`);
    console.log(out.total === 0 ? "NO DIFFERENCES" : out.total + " differences");
    if (out.total) process.exitCode = 1;
  }
} finally { ws.close(); }
