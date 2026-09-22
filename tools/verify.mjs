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
//   node tools/verify.mjs teardown              close the tab and delete the check note
//   node tools/verify.mjs eval "<js>"           run an expression
import { readFileSync } from "node:fs";

const NOTE = "_klartext-check.md";
const targets = await (await fetch("http://localhost:9222/json")).json();
const page = targets.find(t => t.type === "page" && /Obsidian 1\./.test(t.title));
if (!page) throw new Error("no Obsidian page target");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
ws.onclose = e => { for (const [, res] of pending) res({ error: "socket closed " + e.code }); pending.clear(); };
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.error) throw new Error(r.error);
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails, null, 1).slice(0, 3000));
  return r.result?.result?.value;
}
await send("Emulation.setFocusEmulationEnabled", { enabled: true });

const [cmd, a1, a2] = process.argv.slice(2);
try {
  if (cmd === "setup") {
    const content = readFileSync(a1, "utf8");
    console.log(await ev(`(async () => {
      const path = ${JSON.stringify(NOTE)};
      let f = app.vault.getAbstractFileByPath(path);
      if (!f) f = await app.vault.create(path, ${JSON.stringify(content)});
      const leaf = app.workspace.getLeaf('tab');
      await leaf.openFile(f);
      return 'opened ' + path;
    })()`));
  } else if (cmd === "reload") {
    console.log(await ev(`(async () => { app.customCss.requestLoadTheme(); await new Promise(r => setTimeout(r, 1000)); return 'reloaded theme ' + app.customCss.theme; })()`));
  } else if (cmd === "teardown") {
    console.log(await ev(`(async () => {
      const path = ${JSON.stringify(NOTE)};
      app.workspace.iterateAllLeaves(l => { if (l.view?.file?.path === path) l.detach(); });
      const f = app.vault.getAbstractFileByPath(path);
      if (f) await app.vault.delete(f);
      delete window.__kxSnaps; return 'removed ' + path;
    })()`));
  } else if (cmd === "eval") {
    console.log(JSON.stringify(await ev(a1), null, 1));
  } else if (cmd === "snapshot") {
    console.log(await ev(`(async () => {
      const path = ${JSON.stringify(NOTE)};
      let leaf = null; app.workspace.iterateAllLeaves(l => { if (l.view?.file?.path === path) leaf = l; });
      if (!leaf) throw new Error('check note not open');
      const wait = ms => new Promise(r => setTimeout(r, ms));
      // The leaf must be laid out: a background tab has no boxes and every
      // computed length reads as auto. Reveal it for the snapshot and hand the
      // previously active tab back afterwards.
      const prevLeaf = app.workspace.activeLeaf;
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
      const origDark = body.classList.contains('theme-dark');
      const snap = {};
      document.activeElement?.blur?.();
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
      for (const c of ['is-mobile', 'is-phone', 'is-ios']) body.classList.remove(c);
      body.classList.toggle('theme-dark', origDark); body.classList.toggle('theme-light', !origDark);
      await setMode('source');
      if (prevLeaf && prevLeaf !== leaf) { try { app.workspace.revealLeaf(prevLeaf); } catch (e) {} }
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
      for (const [label, from, to] of [['only in ${a1}', A.names, ib], ['only in ${a2}', B.names, ia]]) {
        const only = from.filter((n) => !to.has(n));
        if (only.length) lines.push(label + ': ' + only.join(', '));
      }
      for (const ctx of Object.keys(A.snap)) {
        for (const root of Object.keys(A.snap[ctx])) {
          const la = A.snap[ctx][root], lb = B.snap[ctx][root] || [];
          if (la.length !== lb.length) lines.push(ctx + '/' + root + ': element count ' + la.length + ' → ' + lb.length);
          const bm = new Map(lb);
          for (const [key, rec] of la) {
            const rb = bm.get(key);
            if (!rb) { total++; if (lines.length < 400) lines.push(ctx + '/' + root + ' gone: ' + key); continue; }
            for (const part of new Set([...Object.keys(rec), ...Object.keys(rb)])) {
              if (rec[part] === rb[part]) continue;
              const va = (rec[part] || '').split(SEP), vb = (rb[part] || '').split(SEP);
              for (const name of shared) {
                const x = va[ia.get(name)], y = vb[ib.get(name)];
                if (x === y) continue;
                total++;
                if (lines.length < 400) lines.push(ctx + '/' + root + ' ' + key + ' ' + part + ' ' + name + ': ' + x + ' → ' + y);
              }
            }
          }
        }
      }
      return { total, lines };
    })()`);
    console.log(out.lines.join("\n"));
    console.log(out.total === 0 ? "NO DIFFERENCES" : out.total + " differences");
  } else throw new Error("unknown command");
} finally { ws.close(); }
