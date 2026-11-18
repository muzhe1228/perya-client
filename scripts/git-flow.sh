#!/usr/bin/env bash
# dev 主线工作流：sit/uat 纯部署分支，同一改动只在功能分支产生一次。
# 铁律：sit/uat 上永不直接 commit——发布只走 release（fast-forward 合 dev）。
#
# 用法（npm 入口，参数用 -- 分隔）：
#   npm run flow:init                    # 一次性：从 sit/uat 当前一致点建 dev 并推送
#   npm run flow:start -- feat/xxx       # 开工：同步 dev 最新并切出新分支
#   npm run flow:done -- [feat/xxx]      # 完成：合回 dev + 推送 + 删分支（缺省当前分支）
#   npm run flow:release -- sit|uat      # 发布：环境分支 fast-forward 到 dev 并推送
#   npm run flow:check                   # 体检：环境分支有无游离提交（dev 不含的）
#   npm run flow:promote-origin          # 部署：远程 uat → 远程 origin（避免本地 merge 冲突）
set -euo pipefail

MAIN="dev"
ENV_BRANCHES=(sit uat)

die() { echo "✗ $*" >&2; exit 1; }
info() { echo "→ $*"; }

# 所有流程动作前置：未提交改动会让 switch/pull 半途而废，先拦
ensure_clean() {
  [ -z "$(git status --porcelain)" ] || die "工作区不干净，先提交或暂存再操作"
}

sync_branch() {
  # 不用 git pull --ff-only：git 2.54 的 opportunistic fetch 会往 FETCH_HEAD 写入
  # 远端全部分支条目，pull 误判 "Cannot fast-forward to multiple branches" 直接失败；
  # 拆成 fetch + merge 显式 refspec 避开
  git fetch origin
  git switch "$1"
  git merge --ff-only "origin/$1"
}

cmd_init() {
  local from="${1:-sit}"
  ensure_clean
  sync_branch "$from"
  git switch -c "$MAIN"
  git push -u origin "$MAIN"
  info "dev 已建立并推送（基于 $from）"
}

cmd_start() {
  local branch="${1:?用法: flow:start <分支名，如 feat/xxx>}"
  ensure_clean
  sync_branch "$MAIN"
  git switch -c "$branch"
  info "已从最新 $MAIN 切出 $branch"
}

cmd_done() {
  local branch="${1:-$(git branch --show-current)}"
  [ -n "$branch" ] || die "不在任何分支上，需显式传分支名"
  [ "$branch" != "$MAIN" ] || die "不能对 $MAIN 本身执行 done"
  ensure_clean
  sync_branch "$MAIN"
  git merge --no-ff "$branch" -m "merge: ${branch} 合入 dev"
  git push origin "$MAIN"
  git branch -d "$branch"
  git push origin --delete "$branch" 2>/dev/null || true
  info "$branch 已合入 dev 并删除（本地+远端）"
}

cmd_release() {
  local target="${1:?用法: flow:release sit|uat}"
  [[ " ${ENV_BRANCHES[*]} " == *" $target "* ]] || die "目标只能是: ${ENV_BRANCHES[*]}"
  ensure_clean
  sync_branch "$target"
  # 护栏：环境分支一旦有游离提交（绕过流程直接 commit 过），这里会失败——
  # 按流程把该提交移回功能分支合 dev，不要用 merge 强推糊过去
  git merge --ff-only "$MAIN"
  git push origin "$target"
  info "$target 已发布（fast-forward 自 dev）"
}

cmd_check() {
  git fetch origin
  local dirty=0
  local b n
  for b in "${ENV_BRANCHES[@]}"; do
    n=$(git rev-list --count "origin/$MAIN..origin/$b")
    if [ "$n" -gt 0 ]; then
      echo "✗ $b 有 $n 个游离提交（dev 不含）："
      git log --oneline "origin/$MAIN..origin/$b"
      dirty=1
    else
      echo "✓ $b 干净（无 dev 外提交）"
    fi
  done
  [ "$dirty" -eq 0 ] || die "存在游离提交，release 会被护栏拦下，先按流程归位"
}

case "${1:-}" in
  init) shift; cmd_init "$@" ;;
  start) shift; cmd_start "$@" ;;
  done) shift; cmd_done "$@" ;;
  release) shift; cmd_release "$@" ;;
  check) cmd_check ;;
  promote-origin)
    exec "$(dirname "$0")/promote-uat-to-origin.sh"
    ;;
  *) die "子命令: init [基分支] | start <分支> | done [分支] | release sit|uat | check | promote-origin" ;;
esac
