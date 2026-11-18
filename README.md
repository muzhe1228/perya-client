## 文档

- [Perya 大厅 Figma 设计稿与规范摘要](docs/figma-perya-lobby.md)
- [当前迭代的 5 张画板实现映射](docs/lobby-figma-screens.md)

## Git hooks（中文 commit）

```bash
git config core.hooksPath .githooks
```

`commit-msg` 要求 subject 含汉字；`pre-commit` 跑 `npm run type-check`。

## Git 工作流

```bash
npm run flow:start -- feat/xxx
npm run flow:done -- feat/xxx
npm run flow:release -- sit
```

## 图片压缩

```bash
npm run images:compress          # 写回 src/assets
npm run images:compress -- --check   # dry-run
```

## 环境

| 命令 | mode |
|------|------|
| `npm run dev` | development |
| `npm run dev:qat` / `uat` / `prod` | 对应 `.env.*` |
| `npm run build:prod` 等 | 同名 build |
