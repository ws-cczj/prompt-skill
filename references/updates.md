# 检查与更新已安装的技能

安装得到的是某个版本的文件，远端发布不会自动替换用户电脑。`scripts/check-update.mjs` 仅比较远端发布清单、本地发布清单及本地文件摘要；不下载并执行新脚本、不写入技能文件、不自动覆盖。

清单只覆盖随技能分发的文本文件，摘要统一为UTF-8并将CRLF转换为LF，避免Git在Windows上的换行转换被误报为本地修改。清单外的个人文件也应在更新前自行备份；检查通过不表示没有额外文件。

新会话首次使用且网络允许时检查一次，已有当前会话检查记录且无新线索时不重复。收到用户反馈缺少新功能、显式询问更新时可再次检查。失败、限流、超时均为“无法确认”，不是“已经最新版”。

检查示例（项目安装）：

```bash
node .agents/skills/prompt-skill/scripts/check-update.mjs
```

检测到不同发布版本时提示用户；用户要求更新或已有明确持续更新授权时才执行。先检查输出中的本地修改提示，保存或合并改动；没有旧清单的安装不能可靠判断本地修改，先备份。不要用force覆盖，运行中的任务先保存检查点。

通过skills CLI安装的项目版本：

```bash
npx skills update prompt-skill --project
node .agents/skills/prompt-skill/scripts/enable.mjs --project .
```

全局安装使用 `npx skills update prompt-skill --global`，更新后按安装路径重新运行 `enable.mjs --global`。版本清单不存在的旧安装也可用原安装命令重新安装；先保护本地修改。重新打开会话，确认新技能与入口加载。只更新prompt-skill，不默认更新所有技能。

手动Git安装时先检查对应仓库状态，在正确分支且无本地修改时快进更新；不将当前业务项目误当技能仓库。开发目录联接跟随源目录内容变化，仍需在新会话确认重新加载。

技能未被加载时自身检查也不会运行；不承诺后台自动更新。需要无人值守更新时，单独明确检查周期、通知方式、目标范围、本地修改处理及回滚方案，不擅自创建计划任务。

CLI依据：[skills更新命令](https://github.com/vercel-labs/skills/blob/main/docs/commands.md#skills-update)。清单差异只表示发布内容不同，不按任意版本字符串断言远端一定更“新”，也不将自定义检查当作供应链签名验证。
