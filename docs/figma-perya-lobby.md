# Perya 大厅 — Figma 设计稿与规范摘要

来源文件：[Perya大廳（Figma）](https://www.figma.com/design/H2yMrlt0xorVELcsx663FF/Perya%E5%A4%A7%E5%8E%85?node-id=1986-23673)

| 字段 | 值 |
|------|-----|
| `fileKey` | `H2yMrlt0xorVELcsx663FF` |
| 默认链接节点 | `1986:23673`（Page：**後期_開發**） |
| 规范形态 | 画布文字 + Frame 终稿（**无**嵌入式 Figma Spec 文档） |
| 摘要整理日期 | 2026-11-12 |

---

## 1. 文件结构（3 个顶层 Page）

| Page | `node-id` | 用途 |
|------|-----------|------|
| 初期_規劃設計 | [57:14](https://www.figma.com/design/H2yMrlt0xorVELcsx663FF?node-id=57-14) | PRD、Moodboard、UX Wireframe、PRODUCTION 分工 |
| 中期_UXUI | [807:2731](https://www.figma.com/design/H2yMrlt0xorVELcsx663FF?node-id=807-2731) | 迭代稿、色票、**規格問題整理**、Banner/列表 |
| 後期_開發 | [1986:23673](https://www.figma.com/design/H2yMrlt0xorVELcsx663FF?node-id=1986-23673) | **導覽**规范、动效、H5 终稿、共用元件 |

---

## 2. 视觉规范（`後期_開發` → Section **導覽**）

### 2.1 色彩（色块实测）

| 标注 | Hex（约） | 用途 |
|------|-----------|------|
| 主色漸層01 | `#023C73` | 主色渐变 |
| 主色漸層02 | `#095A91` | 主色渐变 |
| 沿用色 | `#03306E` | 主色沿用 |
| 沿用色 | `#117298` | 主色沿用 |
| 淺圖標01 | `#84C7FF` | 浅图标 |
| 淺圖標02 | `#E2F0FD` | 浅图标 |
| 深圖標01 | `#024277` | 深图标 |
| 深圖標2 | `#0B5FA0` | 深图标 |
| 淺色（文字） | — | 浅色字 |
| 待補 | — | 部分文字色未终稿 |

### 2.2 字体

- **Title**：**Baloo 2**（含 `₱`、大写字母与数字）
- **Content**：**Inter Medium / Bold**

### 2.3 交互 / 导航（Frame **操作說明**）

- **系统类页签**：放在**页面下方**
- **排行榜页签**：放在**页面上方**
- **弹窗**：右上角 **红色 X** 关闭
- **满版页**：左上角 **白色返回**；层级过深时可增加 **回大厅**（造型须与「回主站」区分）
- **系统说明**：新增说明按钮 + 说明弹窗（与中期稿「首次进系统弹说明」一致）

### 2.4 地图建筑 / 动效（**Preview解說**）

| 建物状态 | 表现 |
|----------|------|
| 无活动 | 播放循环 **mp4**；视频屏后发光；右上 Jackpot Icon **弹跳** |
| 活动中 | 同上 + 建筑整体发光 + 活动特效（**循环 Spine**） |
| 活动并联动中 | 活动建筑 Spine + **两栋建筑联动 Spine** + Jackpot 弹跳 |

技术栈对齐：**Web 视频 + Spine 循环动画**（非 Unity 宿主）。

---

## 3. 后期主要画板（H5 对照）

`後期_開發` 页节选（实现时以 `get_design_context` / 切图为准）：

| 画板 | 说明 |
|------|------|
| [Lobby_正常狀態_h5](https://www.figma.com/design/H2yMrlt0xorVELcsx663FF?node-id=1986-25794) | 大厅主态 |
| Lobby_加載失敗 | 加载失败态 |
| 讀取_正在加载2-* | 加载中 |
| Lobby_循環影片 | 建筑循环视频说明 |
| Color Game大廳優化 | 房间列表优化稿 |
| Section **共用元件整理** | 组件库 |
| Section **動效** | 动效说明 |

房间相关组件命名（稿内）：`ui_game room`、`room`、`room_type_jp`、`title room`、`info_room name`、`info_room id` 等。

---

## 4. 产品范围（`初期_規劃設計` → PRODUCTION）

模块清单（多标 P0）：

- 大厅主页、Mission、Wallet、背景 BG
- 游戏入口 Icon：**Color Game / Dropball / PulaPuti / Hantak**
- 点击单一游戏 Icon → **半弹窗**，展示该游戏各直播间
- 任务：**每日任务 Daily Tasks**、**每日奖励 Daily Bonus**
- 活动：**Banner**、首充 First Deposit Bonus、幸运转盘 Lucky Spin、**Jackpot 区**、**Ranking**
- 美术：整体风格对齐现有产品 **3D 画面**（稿内参考视频）

PRD 区还引用外部文档标题（需团队文档权限）：

- Perya 游戏大厅产品说明文档
- 自研 Perya 类型游戏大厅方案
- 美术世界观最终方案
- 绿幕 Perya 游戏大厅整合美术 review

---

## 5. 待产品确认（`中期_UXUI` → **規格問題整理**）

下列条目影响接口与 UI 分支，开发前建议 PM 拍板。

### Jackpot

- 票券条：累积上限、是否「每 3 局 1 张票」
- 不同游戏所需局数是否不同
- 开奖后当期票券是否归零
- 「任玩 3 款游戏」类任务是否需 **选游戏弹窗**（不宜单一 Go 按钮）

### 排行榜

- 展示玩家信息的用途
- 发奖：进大厅自动弹 vs 进排行榜页弹；或红点 **手动领奖**
- 今日/本周/本月奖励差异是否写在 **右上角系统说明**

### Banner / 活动任务

- 先进活动列表再进详情，还是直进详情
- 与任务列表是否联动、能否同时累积
- 任务底板按 **4 种游戏色** 区分
- 下方 3 个奖励是任务奖励还是阶段奖励
- 活动是否要手动参加 / 消耗道具
- 右上角 **玩法说明**（仅首次进活动弹窗）
- **取消 Banner 内独立游戏入口**（回大厅再点游戏）

### 每日任务 / 每日奖励 / 转盘 / 首充

- 累积奖励按任务个数还是积分点；三阶段奖励展示方式
- 自动获奖弹窗 vs 手动领；每日任务是否每日重置或累积型
- 转盘：Free 提示、灰态、进度条 vs 任务奖励「转盘 ×1」
- 首充：与「任意金额充值」是否区分；领完后面板是否消失

### 通用

- 统一规则：完成任务后在 **当前画面 / 回大厅 / 进系统页** 之一弹获奖窗
- **经验值功能已删除**（标注日期 26/8/28）
- 有说明的系统：右上角固定说明按钮，**首次进入弹说明**

---

## 6. 与 `perya-client` 实现对照

| 设计项 | 仓库现状 |
|--------|----------|
| 大厅地图 + PLAY + 房间列表 | `LobbyPage` scaffold；色/字体/切图未完全对齐 token |
| 底栏 LIVE/E-GAME + 游戏图标条 | `LobbyGameDock` |
| 房间列表滚动加载 | `useInfiniteScroll` + `InfiniteList` + `lobbyRoomsFetch` mock |
| 促销 Banner 轮播 | `LobbyBanner`（地图顶栏，与底栏游戏条不同） |
| Spine 演示 | `/spine-demo`、`SpinePlayer` |
| HTTP | `src/api/http.ts`（masskara 口径，无 bizCode） |
| 建筑 mp4 + Spine 状态、Jackpot 弹跳 | 未做 |
| 半弹窗直播间、任务/活动/Jackpot 全系统 | 未做 |

---

## 7. 开发引用方式

1. **对齐单屏**：在 Figma 复制带 `node-id` 的链接，对应用 `get_design_context` 或按 Frame 名在本文档检索。
2. **样式 token**：优先使用本文 **§2.1–2.2**；落地时建议同步到 `src/styles/_variables.scss` 或设计 token 文件。
3. **交互**：弹窗关闭、返回、页签上下位置以 **§2.3** 为准。
4. **动效**：地图建筑以 **§2.4** 为准（mp4 + Spine）。

---

## 8. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-11-12 | 从 Figma MCP 读取導覽 / 規格問題整理 / PRODUCTION 等区块，初版落库 |
