#!/usr/bin/env node
'use strict';

// Interactive installer for the spec-draft / spec-impl skills.
//
// Usage:
//   npx github:FrancoCabrera25/skill-spec
//   npx github:FrancoCabrera25/skill-spec --agent=cursor
//   npx github:FrancoCabrera25/skill-spec --agent=all --dir=/path/to/project --yes
//
// No external dependencies on purpose: `npx github:owner/repo` runs this
// straight after cloning, so keeping the dependency tree empty avoids an
// extra `npm install` (and its network round-trip) before anything happens.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const REPO_ROOT = path.join(__dirname, '..');
const SKILLS_SRC = path.join(REPO_ROOT, 'skills', 'engineering');

const AGENTS = [
  { id: 'claude', label: 'Claude Code' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'codex', label: 'Codex CLI (AGENTS.md)' },
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'gemini', label: 'Gemini CLI (GEMINI.md)' },
  { id: 'all', label: 'Todos / all of the above' },
];

function parseArgs(argv) {
  const out = { agent: null, dir: null, yes: false };
  for (const arg of argv) {
    if (arg.startsWith('--agent=')) out.agent = arg.slice('--agent='.length).trim().toLowerCase();
    else if (arg.startsWith('--dir=')) out.dir = arg.slice('--dir='.length).trim();
    else if (arg === '--yes' || arg === '-y') out.yes = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`skill-spec installer

Usage:
  npx github:FrancoCabrera25/skill-spec [options]

Options:
  --agent=<name>   claude | cursor | codex | antigravity | gemini | all
                    (skips the interactive question)
  --dir=<path>      Target project directory (default: current directory)
  --yes, -y         Skip confirmations
  --help, -h        Show this help
`);
}

function askAgent() {
  return new Promise((resolve) => {
    console.log('\n¿En qué agente de IA vas a instalar la skill? / Which AI agent are you installing into?\n');
    AGENTS.forEach((a, i) => console.log(`  ${i + 1}. ${a.label}`));
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\nElegí un número / pick a number: ', (answer) => {
      rl.close();
      const idx = parseInt(answer.trim(), 10) - 1;
      if (idx >= 0 && idx < AGENTS.length) return resolve(AGENTS[idx].id);
      const byName = AGENTS.find((a) => a.id === answer.trim().toLowerCase());
      resolve(byName ? byName.id : null);
    });
  });
}

// Strips a Claude Code SKILL.md's YAML frontmatter entirely, keeping the
// markdown body (which already opens with its own H1 title). Mirrors
// scripts/install-to-agent.sh's strip_claude_frontmatter, kept in sync by
// hand since it's ~10 lines either way.
function stripClaudeFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return content;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') { end = i; break; }
  }
  if (end === -1) return content;
  return lines.slice(end + 1).join('\n');
}

function listSkillDirs() {
  return fs
    .readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(SKILLS_SRC, name, 'SKILL.md')))
    .sort();
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function symlinkOrCopy(src, dest) {
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  try {
    fs.symlinkSync(src, dest, 'dir');
  } catch (err) {
    // Symlinks can fail without elevated privileges on Windows — fall back
    // to a plain recursive copy so the install still succeeds there.
    fs.cpSync(src, dest, { recursive: true });
  }
}

function writeStrippedSkill(name, targetDir) {
  mkdirp(targetDir);
  const skillSrc = path.join(SKILLS_SRC, name, 'SKILL.md');
  const templateSrc = path.join(SKILLS_SRC, name, 'template.md');
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), stripClaudeFrontmatter(fs.readFileSync(skillSrc, 'utf8')));
  if (fs.existsSync(templateSrc)) {
    fs.copyFileSync(templateSrc, path.join(targetDir, 'template.md'));
  }
}

function readFrontmatterValue(content, key) {
  const m = content.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

function installClaude(projectRoot) {
  const targetBase = path.join(projectRoot, '.claude', 'skills');
  mkdirp(targetBase);
  for (const name of listSkillDirs()) {
    const src = path.join(SKILLS_SRC, name);
    const dest = path.join(targetBase, name);
    symlinkOrCopy(src, dest);
    console.log(`  claude       -> ${path.relative(projectRoot, dest)}`);
  }
}

function installCursor(projectRoot) {
  const targetDir = path.join(projectRoot, '.cursor', 'rules');
  mkdirp(targetDir);
  for (const name of listSkillDirs()) {
    const skillMd = fs.readFileSync(path.join(SKILLS_SRC, name, 'SKILL.md'), 'utf8');
    const description = readFrontmatterValue(skillMd, 'description') || `${name} skill`;
    const body = stripClaudeFrontmatter(skillMd);
    const out = `---\ndescription: ${description}\nalwaysApply: false\n---\n${body}`;
    const outPath = path.join(targetDir, `${name}.mdc`);
    fs.writeFileSync(outPath, out);
    console.log(`  cursor       -> ${path.relative(projectRoot, outPath)} (invocar con @${name})`);
  }
}

function installAgentsMdStyle(projectRoot, { skillsSubdir, memoryFile }) {
  const targetBase = path.join(projectRoot, skillsSubdir);
  const memoryPath = path.join(projectRoot, memoryFile);
  if (!fs.existsSync(memoryPath)) fs.writeFileSync(memoryPath, '');
  let memory = fs.readFileSync(memoryPath, 'utf8');
  if (!/^## Skills$/m.test(memory)) {
    memory += `${memory.endsWith('\n') || memory === '' ? '' : '\n'}\n## Skills\n\n`;
  }
  for (const name of listSkillDirs()) {
    const dest = path.join(targetBase, name);
    writeStrippedSkill(name, dest);
    const relSkillPath = `${skillsSubdir}/${name}/SKILL.md`;
    const bullet = `- \`${name}\`: see \`${relSkillPath}\``;
    if (!memory.includes(relSkillPath)) memory = memory.trimEnd() + '\n' + bullet + '\n';
    console.log(`  ${memoryFile.padEnd(12)} -> ${path.relative(projectRoot, dest)}/SKILL.md, referenced from ${memoryFile}`);
  }
  fs.writeFileSync(memoryPath, memory);
}

function installCodex(projectRoot) {
  installAgentsMdStyle(projectRoot, { skillsSubdir: '.codex/skills', memoryFile: 'AGENTS.md' });
}

function installGemini(projectRoot) {
  installAgentsMdStyle(projectRoot, { skillsSubdir: '.gemini/skills', memoryFile: 'GEMINI.md' });
}

function installAntigravity(projectRoot) {
  const targetBase = path.join(projectRoot, '.antigravity', 'skills');
  for (const name of listSkillDirs()) {
    const dest = path.join(targetBase, name);
    writeStrippedSkill(name, dest);
    console.log(`  antigravity  -> ${path.relative(projectRoot, dest)}/SKILL.md`);
  }
}

const INSTALLERS = {
  claude: installClaude,
  cursor: installCursor,
  codex: installCodex,
  antigravity: installAntigravity,
  gemini: installGemini,
};

function noteSpecsFolder(projectRoot) {
  const specsDir = path.join(projectRoot, 'specs');
  if (!fs.existsSync(specsDir)) {
    console.log(
      `\nNota: ${path.relative(projectRoot, specsDir) || 'specs'} todavía no existe. spec-draft va a crear\n` +
        'specs/NN-slug.md y specs/.spec-config.yml la primera vez que lo corras,\n' +
        'o podés crear specs/ vos mismo ahora.'
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();

  const projectRoot = path.resolve(args.dir || process.cwd());
  if (!fs.existsSync(projectRoot)) {
    console.error(`El directorio destino no existe: ${projectRoot}`);
    process.exitCode = 1;
    return;
  }

  let agent = args.agent;
  if (agent && !AGENTS.some((a) => a.id === agent)) {
    console.error(`Agente desconocido: '${agent}'. Esperaba: ${AGENTS.map((a) => a.id).join(' | ')}`);
    process.exitCode = 1;
    return;
  }
  if (!agent) {
    agent = await askAgent();
    if (!agent) {
      console.error('No entendí la selección. Corré de nuevo o usá --agent=<nombre>.');
      process.exitCode = 1;
      return;
    }
  }

  console.log(`\nInstalando en: ${projectRoot}`);
  const targets = agent === 'all' ? Object.keys(INSTALLERS) : [agent];
  for (const target of targets) {
    console.log(`\n== ${target} ==`);
    INSTALLERS[target](projectRoot);
  }

  noteSpecsFolder(projectRoot);
  console.log('\nListo. Ver README.md / README-es.md para el flujo de uso (spec-draft / spec-impl).');
}

main();
