#!/usr/bin/env node
/**
 * SVG Linter & Fixer for MAD-AI (Angular 20 + Tailwind v4)
 *  - Lint: viewBox requerido, no width/height fijos en <svg>, fill/stroke => currentColor/none
 *  - Fix (--fix): remueve width/height fijos (si hay viewBox), crea viewBox desde width/height numéricos,
 *                 normaliza fill/stroke (root, hijos, style="" y <style>)
 *
 * Uso:
 *   node scripts/lint-icons.cjs
 *   node scripts/lint-icons.cjs --fix
 *   node scripts/lint-icons.cjs --fix --dry
 *   node scripts/lint-icons.cjs --paths=src/app/core/icons/svg,src/app/presentation/features --silent
 *   node scripts/lint-icons.cjs --fix --backup=false
 *
 * Exit codes:
 *   0 -> OK
 *   1 -> Violations (si no --fix o no todo pudo arreglarse)
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const pathsFromArgs = [];
let silent = false;
let doFix = false;
let dryRun = false;
let makeBackup = true;

for (const arg of argv) {
  if (arg.startsWith('--paths=')) {
    const val = arg.split('=')[1];
    if (val) val.split(',').forEach((p) => pathsFromArgs.push(p.trim()));
  } else if (arg === '--silent') {
    silent = true;
  } else if (arg === '--fix') {
    doFix = true;
  } else if (arg === '--dry') {
    dryRun = true;
  } else if (arg.startsWith('--backup=')) {
    const v = arg.split('=')[1];
    makeBackup = !(v === 'false' || v === '0' || v === 'no');
  }
}

const ROOT = process.cwd();
const DEFAULT_DIRS = [
  'src/app/presentation/shared/assets/icons',
  'src/app/presentation/pages',
  'src/app/presentation/shared',
];
const SEARCH_DIRS = (pathsFromArgs.length ? pathsFromArgs : DEFAULT_DIRS).map((p) =>
  path.resolve(ROOT, p)
);

const allowColor = new Set(['currentColor', 'none']);
const colorLikeRe = /^(#|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+)/;
const hardColorInCssRe = /:\s*(?!currentColor\b)(?!none\b)[^;}\s][^;}]+/i;

const issue = (arr, type, file, msg) => {
  arr.push({ type, file, msg });
};

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (dir.toLowerCase().endsWith('.svg')) out.push(dir);
    return;
  }
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (entry.toLowerCase().endsWith('.svg')) out.push(p);
  }
}

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}
function writeFile(p, content) {
  if (dryRun) return;
  if (makeBackup && !fs.existsSync(p + '.bak')) fs.copyFileSync(p, p + '.bak');
  fs.writeFileSync(p, content, 'utf8');
}

function getAttr(tag, name) {
  const re = new RegExp(name + String.raw`(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))`, 'i');
  const m = tag.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? null;
}
function hasAttr(tag, name) {
  const re = new RegExp(String.raw`\b` + name + String.raw`\b`, 'i');
  return re.test(tag);
}
function removeAttr(tag, name) {
  const re = new RegExp(
    String.raw`\s+` + name + String.raw`\s*=\s*("([^"]*)"|'([^']*)'|[^\s"'>]+)`,
    'ig'
  );
  return tag.replace(re, '');
}
function setAttr(tag, name, value) {
  if (hasAttr(tag, name)) {
    const re = new RegExp(name + String.raw`\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))`, 'i');
    return tag.replace(re, `${name}="${value}"`);
  } else {
    // insertar antes de '>'
    return tag.replace(/>$/, ` ${name}="${value}">`);
  }
}
function parseNumberPx(val) {
  if (val == null) return null;
  const v = String(val).trim();
  const m = v.match(/^(\d+(?:\.\d+)?)(px)?$/i);
  if (!m) return null;
  return parseFloat(m[1]);
}
function isFlexibleUnit(val) {
  if (val == null) return false;
  const v = String(val).trim();
  return v.endsWith('%') || v.endsWith('em') || v.endsWith('rem');
}

function lintSvg(file, txt) {
  const problems = [];
  const warnings = [];

  const svgTagMatch = txt.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) {
    issue(problems, 'error', file, 'No <svg> root tag found');
    return { problems, warnings };
  }
  const svgTag = svgTagMatch[0];

  // viewBox
  if (!/viewBox\s*=/.test(svgTag)) {
    issue(problems, 'error', file, 'Missing viewBox on <svg> root');
  }

  // width/height fixed
  const width = getAttr(svgTag, 'width');
  const height = getAttr(svgTag, 'height');
  const fixedWidth = width && !isFlexibleUnit(width) ? parseNumberPx(width) !== null : false;
  const fixedHeight = height && !isFlexibleUnit(height) ? parseNumberPx(height) !== null : false;
  if (fixedWidth) issue(problems, 'error', file, `Fixed width on <svg> root: width="${width}"`);
  if (fixedHeight) issue(problems, 'error', file, `Fixed height on <svg> root: height="${height}"`);

  // root fill/stroke
  const rootFill = getAttr(svgTag, 'fill');
  const rootStroke = getAttr(svgTag, 'stroke');
  if (rootFill && !allowColor.has(rootFill)) {
    issue(
      problems,
      'error',
      file,
      `Root fill must be 'currentColor' or 'none', found "${rootFill}"`
    );
  }
  if (rootStroke && !allowColor.has(rootStroke)) {
    issue(
      problems,
      'error',
      file,
      `Root stroke must be 'currentColor' or 'none', found "${rootStroke}"`
    );
  }

  // children attrs in body
  const body = txt.slice(svgTagMatch.index + svgTag.length);
  const attrRe = /(fill|stroke)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = attrRe.exec(body)) !== null) {
    const attr = m[1];
    const val = m[3] ?? m[4] ?? '';
    if (val && !allowColor.has(val) && colorLikeRe.test(val)) {
      issue(
        problems,
        'error',
        file,
        `Hard-coded ${attr}="${val}" in element (use currentColor/none)`
      );
    }
  }

  // style="..."
  const styleAttrRe = /style\s*=\s*("([^"]*)"|'([^']*)')/gi;
  while ((m = styleAttrRe.exec(txt)) !== null) {
    const val = m[2] ?? m[3] ?? '';
    if (/fill\s*:/.test(val) || /stroke\s*:/.test(val)) {
      const hasHard = /(fill|stroke)\s*:\s*(?!currentColor\b)(?!none\b)[^;}\s][^;}]+/i.test(val);
      if (hasHard)
        issue(
          problems,
          'error',
          file,
          `Inline style sets hard fill/stroke (use currentColor/none)`
        );
    }
  }

  // <style> blocks
  const styleTagRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleTagRe.exec(txt)) !== null) {
    const css = m[1];
    if (/fill\s*:\s*[^;}]+/i.test(css) || /stroke\s*:\s*[^;}]+/i.test(css)) {
      if (hardColorInCssRe.test(css)) {
        issue(warnings, 'warn', file, `<style> sets hard fill/stroke; prefer currentColor/none`);
      }
    }
  }

  return { problems, warnings };
}

function fixSvg(file, txt) {
  let changed = false;
  const fixes = [];

  const svgTagMatch = txt.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) return { changed, content: txt, fixes };

  let svgTag = svgTagMatch[0];
  const start = svgTagMatch.index;
  const end = start + svgTag.length;

  // 1) viewBox from width/height if missing and numeric
  let viewBox = getAttr(svgTag, 'viewBox');
  const wAttr = getAttr(svgTag, 'width');
  const hAttr = getAttr(svgTag, 'height');
  const wNum = parseNumberPx(wAttr);
  const hNum = parseNumberPx(hAttr);

  if (!viewBox && wNum != null && hNum != null) {
    svgTag = setAttr(svgTag, 'viewBox', `0 0 ${wNum} ${hNum}`);
    fixes.push(`Added viewBox="0 0 ${wNum} ${hNum}"`);
    changed = true;
    viewBox = `0 0 ${wNum} ${hNum}`;
  }

  // 2) remove fixed width/height on root (keep %/em/rem)
  if (wAttr && !isFlexibleUnit(wAttr) && (viewBox || wNum != null)) {
    svgTag = removeAttr(svgTag, 'width');
    fixes.push('Removed root width');
    changed = true;
  }
  if (hAttr && !isFlexibleUnit(hAttr) && (viewBox || hNum != null)) {
    svgTag = removeAttr(svgTag, 'height');
    fixes.push('Removed root height');
    changed = true;
  }

  // 3) normalize root fill/stroke
  const rootFill = getAttr(svgTag, 'fill');
  if (rootFill && !allowColor.has(rootFill) && colorLikeRe.test(rootFill)) {
    svgTag = setAttr(svgTag, 'fill', 'currentColor');
    fixes.push(`Root fill -> currentColor (was ${rootFill})`);
    changed = true;
  }
  const rootStroke = getAttr(svgTag, 'stroke');
  if (rootStroke && !allowColor.has(rootStroke) && colorLikeRe.test(rootStroke)) {
    svgTag = setAttr(svgTag, 'stroke', 'currentColor');
    fixes.push(`Root stroke -> currentColor (was ${rootStroke})`);
    changed = true;
  }

  // Rebuild with modified root tag
  let head = txt.slice(0, start);
  let body = txt.slice(end);

  // 4) attributes in body: fill/stroke -> currentColor (preserve 'none')
  body = body.replace(/(fill|stroke)\s*=\s*("([^"]*)"|'([^']*)')/gi, (m, attr, _q, dq, sq) => {
    const val = dq ?? sq ?? '';
    if (!val) return m;
    if (allowColor.has(val)) return m;
    if (!colorLikeRe.test(val)) return m;
    changed = true;
    fixes.push(`Attr ${attr}="${val}" -> ${attr}="currentColor"`);
    return `${attr}="currentColor"`;
  });

  // 5) style="..." attributes
  body = body.replace(/style\s*=\s*("([^"]*)"|'([^']*)')/gi, (m, _q, dq, sq) => {
    let val = dq ?? sq ?? '';
    let orig = val;
    // fill:
    val = val.replace(/(?:^|;)\s*fill\s*:\s*([^;]+)/gi, (mm, c) => {
      const color = String(c).trim();
      if (allowColor.has(color)) return mm; // keep
      if (!colorLikeRe.test(color)) return mm;
      changed = true;
      fixes.push(`style fill:${color} -> fill:currentColor`);
      return mm.replace(c, 'currentColor');
    });
    // stroke:
    val = val.replace(/(?:^|;)\s*stroke\s*:\s*([^;]+)/gi, (mm, c) => {
      const color = String(c).trim();
      if (allowColor.has(color)) return mm;
      if (!colorLikeRe.test(color)) return mm;
      changed = true;
      fixes.push(`style stroke:${color} -> stroke:currentColor`);
      return mm.replace(c, 'currentColor');
    });
    return m.replace(orig, val);
  });

  // 6) <style> blocks (shallow fix): replace hard fill/stroke with currentColor
  body = body.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (m, attrs, css) => {
    let newCss = css.replace(/fill\s*:\s*([^;}\n]+)/gi, (mm, c) => {
      const color = String(c).trim();
      if (allowColor.has(color)) return mm;
      if (!colorLikeRe.test(color)) return mm;
      changed = true;
      fixes.push(`<style> fill:${color} -> fill:currentColor`);
      return mm.replace(c, 'currentColor');
    });
    newCss = newCss.replace(/stroke\s*:\s*([^;}\n]+)/gi, (mm, c) => {
      const color = String(c).trim();
      if (allowColor.has(color)) return mm;
      if (!colorLikeRe.test(color)) return mm;
      changed = true;
      fixes.push(`<style> stroke:${color} -> stroke:currentColor`);
      return mm.replace(c, 'currentColor');
    });
    return `<style${attrs}>${newCss}</style>`;
  });

  const content = head + svgTag + body;
  return { changed, content, fixes };
}

function main() {
  const files = [];
  for (const d of SEARCH_DIRS) walk(d, files);

  const svgFiles = files.filter((f) => f.toLowerCase().endsWith('.svg'));
  if (!silent)
    console.log(
      `ℹ️  SVG Lint — scanning ${svgFiles.length} files${doFix ? ' (fix mode)' : ''}${
        dryRun ? ' [dry]' : ''
      }`
    );

  const allProblems = [];
  const allWarnings = [];
  let fixedCount = 0;

  for (const f of svgFiles) {
    const txt = readFile(f);
    const { problems, warnings } = lintSvg(f, txt);
    allWarnings.push(...warnings);

    if (doFix) {
      const { changed, content, fixes } = fixSvg(f, txt);
      if (changed) {
        fixedCount++;
        if (!silent) {
          console.log(`🔧 Fixed ${path.relative(ROOT, f)}:`);
          fixes.slice(0, 10).forEach((x) => console.log('   -', x));
          if (fixes.length > 10) console.log(`   - ...and ${fixes.length - 10} more`);
        }
        writeFile(f, content);
        // Re-lint after fix to catch remaining issues
        const post = lintSvg(f, content);
        if (post.problems.length) allProblems.push(...post.problems);
        if (post.warnings.length) allWarnings.push(...post.warnings);
      } else {
        if (problems.length) allProblems.push(...problems);
      }
    } else {
      if (problems.length) allProblems.push(...problems);
    }
  }

  if (allWarnings.length && !silent) {
    console.log('\n⚠️  Warnings:');
    for (const w of allWarnings) console.log(`  • ${w.file}\n    - ${w.msg}`);
  }

  if (doFix && !silent) {
    console.log(`\n🧹 Files changed: ${fixedCount}/${svgFiles.length}${dryRun ? ' (dry)' : ''}`);
  }

  if (allProblems.length) {
    console.log('\n❌ Violations (not auto-fixed):');
    for (const p of allProblems) console.log(`  • ${p.file}\n    - ${p.msg}`);
    process.exit(1);
  } else {
    if (!silent) console.log('\n✅ SVG check passed.');
    process.exit(0);
  }
}

main();
