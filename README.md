# prompt-skill

把零散需求与相关对话整理为清晰、可执行的 prompt，帮助 agent 保留上下文约束、理解修改意图，并完成用户真正需要的任务。

## 功能

- 提取目标、输入、交付物、限制和偏好，区分用户要求与待确认的假设。
- 按领域整理设计简报与修改意见，结合用途、受众、参考维度和交付媒介选择检查项。
- 处理多轮补充、修改和撤销，保留仍然有效的约束。
- 生成结构清晰的 Markdown prompt，包含执行步骤和验收标准。
- 对影响结果的歧义或冲突提出具体问题，澄清后继续。
- 按项目或会话维护有效规则，辅助长对话恢复。

## 安装

### 使用 npx 安装（推荐）

需要已安装 Node.js 和 npm，并满足 [skills CLI](https://github.com/vercel-labs/skills) 的 Node.js 版本要求。执行：

```bash
npx skills add ws-cczj/prompt-skill
```

可选择安装的 agent 和范围；在 agent 内运行时，CLI 可能自动选择当前 agent。默认安装到当前项目。仅为当前项目的 Codex 安装：

```bash
npx skills add ws-cczj/prompt-skill --agent codex
```

为当前用户的 Codex 安装，供不同项目使用：

```bash
npx skills add ws-cczj/prompt-skill --agent codex --global
```

仅查看仓库内可安装的技能：

```bash
npx skills add ws-cczj/prompt-skill --list
```

**安装不等于默认每轮启用。** npx 只安装技能，普通任务是否自动调用由 agent 决定；若希望当前项目每轮都使用，安装后在项目根目录继续执行：

```bash
node .agents/skills/prompt-skill/scripts/enable.mjs --project .
```

此命令在项目规则入口中合并一个独立区块，保留原有内容；存在生效的 `AGENTS.override.md` 时使用该入口。然后重新打开项目中的 Codex 会话。已有安装可先重新运行上面的安装命令获取新版脚本。

### 手动安装

也可以将仓库克隆到 Codex 的用户技能目录：

```bash
git clone https://github.com/ws-cczj/prompt-skill.git ~/.agents/skills/prompt-skill
```

Windows PowerShell：

```powershell
git clone https://github.com/ws-cczj/prompt-skill.git "$env:USERPROFILE/.agents/skills/prompt-skill"
```

仓库根目录就是技能目录，`SKILL.md` 无须再移动一层。目标目录已存在时，先检查已有内容，避免覆盖本地修改。

安装后可在 Codex 中通过 `$prompt-skill` 调用。如果技能列表尚未显示，重新打开 Codex 后再试。其他支持 `SKILL.md` 的 agent，可按其技能安装约定放置本仓库。

## 使用

整理需求并执行：

```text
使用 $prompt-skill，结合前面的讨论整理执行 prompt，然后完成这个任务：
根据我提供的论文制作中文组会 PPT，汇报十分钟，不要动画。
```

只生成 prompt：

```text
使用 $prompt-skill，把下面的需求整理成可执行 prompt，暂不执行：
整理每周项目进展，包含已完成事项、风险和下周计划，只依据我提供的信息。
```

在当前会话中持续展示：

```text
使用 $prompt-skill，本会话每轮先展示 Markdown 执行 prompt，再继续任务。
```

需要先审阅再执行时，可加上“确认后执行”；要结束持续展示，可说“本会话停止展示 prompt”。需要创建可复用技能时，可明确要求“将这些需求生成 SKILL.md”。

## 输出形式

prompt 根据任务复杂度组织为以下内容，简单请求会适当精简：

1. 目标与交付物。
2. 相关语境与输入。
3. 优先级与约束：必须满足、尽量满足、可调整假设。
4. 执行步骤。
5. 验收标准。
6. 必要的待确认项。

用户明确修订旧要求时，采用新要求并保留其他有效约束。遇到影响执行的未解决歧义或冲突，会说明具体问题、需要暂停的操作和恢复条件；信息充分时直接继续。

## 可选：默认每轮启用

项目级安装后启用与检查：

```bash
node .agents/skills/prompt-skill/scripts/enable.mjs --project .
node .agents/skills/prompt-skill/scripts/enable.mjs --project . --check
```

取消项目默认入口时使用同一路径并加上 `--disable`；只移除该脚本维护的区块，不删除技能或其他规则。

全局安装后，为当前用户默认启用（Windows PowerShell）：

```powershell
node "$env:USERPROFILE/.agents/skills/prompt-skill/scripts/enable.mjs" --global
```

macOS / Linux：

```bash
node ~/.agents/skills/prompt-skill/scripts/enable.mjs --global
```

全局命令合并到 `<CODEX_HOME 或 ~/.codex>/AGENTS.md`，存在生效的 `AGENTS.override.md` 时使用后者。也可手动参考 [默认入口模板](assets/global-AGENTS.md) 合并规则。

新开会话后确认是否加载。安装技能本身不等于每轮都会调用；全局入口用于设置默认行为，用户仍可在具体会话中关闭或调整。

## 规则与经验

项目持续规则维护在对应项目的 `AGENTS.md`；会话约定按真实会话 ID 隔离保存，不将一次性偏好扩展到其他任务。会话快照需要技能或入口显式读取，并非宿主内置的自动恢复功能。

经验只用于辅助检查，不能覆盖当前用户的明确要求，也不能扩大操作权限。详细流程见 [技能入口](SKILL.md) 和 [规则同步说明](references/rule-sync.md)。

## 更新

远端发布不会自动替换已安装的文件。新版技能在新会话首次使用且网络允许时检查一次发布清单；也可手动检查项目安装：

```bash
node .agents/skills/prompt-skill/scripts/check-update.mjs
```

检查只读，不覆盖文件；无网络时返回“无法确认”并继续任务。发现更新后，先备份本地修改，再更新当前项目的技能并刷新入口：

```bash
npx skills update prompt-skill --project
node .agents/skills/prompt-skill/scripts/enable.mjs --project .
```

全局安装使用 `npx skills update prompt-skill --global`，之后按全局安装路径运行 `enable.mjs --global`。重新打开Codex会话以加载新内容。没有检查脚本的旧版可重新执行安装命令，先保护本地修改。技能未被加载时不会自行检查，也不会创建后台更新任务。详见 [更新说明](references/updates.md)。
