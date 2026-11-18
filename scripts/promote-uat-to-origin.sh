#!/usr/bin/env bash
# 将远程 uat 原样同步到远程部署分支 origin（refs/heads/origin）。
# 避免在本地 merge/rebase 产生冲突；部署线只认 uat 的树。
#
# 用法：
#   npm run flow:promote-origin
#   FORCE=1 npm run flow:promote-origin   # 远程 origin 已分叉时强制以 uat 覆盖
#
# 说明：远程名与分支名均为 origin 时，推送 refspec 为 uat:origin（见 SRC/DST）。
set -euo pipefail

REMOTE=origin
SRC_BRANCH=uat
DST_BRANCH=origin

die() { echo "✗ $*" >&2; exit 1; }
info() { echo "→ $*"; }
ok() { echo "✓ $*"; }

ensure_clean() {
  [ -z "$(git status --porcelain)" ] || die "工作区不干净，先提交或 stash 再执行"
}

ensure_clean

git fetch "$REMOTE" "$SRC_BRANCH" "$DST_BRANCH"

SRC_REF="refs/remotes/${REMOTE}/${SRC_BRANCH}"
DST_REF="refs/remotes/${REMOTE}/${DST_BRANCH}"

git rev-parse "$SRC_REF" >/dev/null 2>&1 || die "找不到 ${SRC_REF}，请先 fetch 或确认远程存在 uat 分支"

SRC_SHA=$(git rev-parse "$SRC_REF")
info "uat @ $(git rev-parse --short "$SRC_SHA")"

if git rev-parse "$DST_REF" >/dev/null 2>&1; then
  DST_SHA=$(git rev-parse "$DST_REF")
  if [ "$SRC_SHA" = "$DST_SHA" ]; then
    ok "远程 origin 已与 uat 相同，无需推送"
    exit 0
  fi
  info "远程 origin @ $(git rev-parse --short "$DST_SHA")"
else
  DST_SHA=""
  info "远程尚无 ${DST_BRANCH} 分支，将首次创建"
fi

PUSH_SPEC="refs/remotes/${REMOTE}/${SRC_BRANCH}:refs/heads/${DST_BRANCH}"

do_push_ff() {
  git push "$REMOTE" "$PUSH_SPEC"
}

do_push_force_with_lease() {
  if [ -n "$DST_SHA" ]; then
    git push --force-with-lease="refs/heads/${DST_BRANCH}:${DST_SHA}" \
      "$REMOTE" "$PUSH_SPEC"
  else
    git push "$REMOTE" "$PUSH_SPEC"
  fi
}

if [ -z "$DST_SHA" ]; then
  do_push_ff
  ok "已推送 uat → origin（新建分支）"
  exit 0
fi

if git merge-base --is-ancestor "$DST_SHA" "$SRC_SHA"; then
  do_push_ff
  ok "已 fast-forward 推送 uat → origin"
  exit 0
fi

echo "✗ 远程 origin 与 uat 已分叉（不要用 merge/rebase 合 origin 分支）" >&2
git log --oneline -5 "${SRC_SHA}..${DST_SHA}" 2>/dev/null | sed 's/^/    origin 独有: /' || true
git log --oneline -5 "${DST_SHA}..${SRC_SHA}" 2>/dev/null | sed 's/^/    uat 独有:    /' || true

if [ "${FORCE:-}" != "1" ]; then
  die "要以 uat 覆盖远程 origin，请执行: FORCE=1 npm run flow:promote-origin"
fi

do_push_force_with_lease
ok "已 force-with-lease 同步 uat → origin"
