#!/usr/bin/env node
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const usage = `Enable prompt-skill for Codex without replacing existing instructions.
Usage:
  node scripts/enable.mjs --project <directory> [--check | --disable]
  node scripts/enable.mjs --global [--check | --disable]
Use --global only for a user-wide default. Reopen the Codex session after enabling.`;

async function optionalText(path) {
  try { return await readFile(path, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) { console.log(usage); return; }
  let project, global = false, check = false, disable = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--project') {
      if (project || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('--project needs one directory.');
      project = resolve(args[++i]);
    } else if (arg === '--global') global = true;
    else if (arg === '--check') check = true;
    else if (arg === '--disable') disable = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (Boolean(project) === global || (check && disable)) throw new Error(usage);

  const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'SKILL.md');
  await readFile(skill, 'utf8'); // Refuse to create a rule pointing to a missing installation.
  const target = global ? resolve(process.env.CODEX_HOME || join(homedir(), '.codex')) : project;
  const override = join(target, 'AGENTS.override.md');
  const file = (await optionalText(override)).trim() ? override : join(target, 'AGENTS.md');
  try {
    if ((await lstat(file)).isSymbolicLink()) throw new Error(`Instruction file is a link; edit its intended target manually: ${file}`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const old = await optionalText(file);
  const scope = global ? 'global' : 'project';
  const start = `<!-- prompt-skill:${scope}:start -->`;
  const end = `<!-- prompt-skill:${scope}:end -->`;
  const count = (text) => old.split(text).length - 1;
  if (count(start) !== count(end) || count(start) > 1 || (count(start) && old.indexOf(end) < old.indexOf(start))) {
    throw new Error(`Incomplete or repeated managed markers in ${file}; no file changed.`);
  }
  const local = relative(target, skill);
  const entry = (!global && local && !local.startsWith('..') && !isAbsolute(local) ? local : skill).replaceAll('\\', '/');
  if (/[`\r\n]/.test(entry)) throw new Error('Installation path contains unsupported Markdown characters.');
  const block = `${start}
## Prompt Skill ${global ? '用户默认' : '项目默认'}入口

用户已启用${global ? '当前用户' : '本项目'}每轮可见 prompt。每个用户回合先读取并遵循 \`${entry}\`，整理目标、有效上下文、约束优先级、执行步骤和验收，再完成原任务；无需用户每次手动提及技能。短问答精简，不默认等待确认，不展示隐藏推理。

用户对整段输出限定JSON、固定行数或禁止标题/粗体时采用兼容形式，无法兼容时本轮省略独立prompt展示；不要破坏具体输出契约。用户明确关闭或调整时遵循指定范围。

按技能流程恢复当前真实会话ID的规则快照；项目约束、会话约定和单次任务参数保持隔离。实质歧义或冲突先查已有上下文，仍未解决时明确说明“prompt-skill 已拦截”、原因、暂停范围、必要问题和恢复条件，附技能入口链接。只暂停依赖答案的操作，不因语气或明确修订拦截。

本入口不提高权限，不覆盖更高层指令或当前用户的明确修订；技能缺失时报告路径，不假称已加载，不擅自重新安装。
${end}`;
  const existing = count(start) ? old.slice(old.indexOf(start), old.indexOf(end) + end.length) : null;
  if (check) {
    console.log(`${existing === block ? 'Enabled' : existing ? 'Entry needs update' : 'Not enabled'}: ${file}`);
    process.exitCode = existing === block ? 0 : 1;
    return;
  }
  let next;
  if (existing) next = old.replace(existing, disable ? '' : block);
  else next = disable ? old : old + (old && !old.endsWith('\n') ? '\n\n' : old ? '\n' : '') + block + '\n';
  if (next === old) { console.log(`Unchanged: ${file}`); return; }
  await mkdir(target, { recursive: true });
  await writeFile(file, next, 'utf8');
  console.log(`${disable ? 'Disabled' : 'Enabled'}: ${file}`);
  console.log('Existing instructions outside the managed block were preserved. Reopen the Codex session to load changes.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
