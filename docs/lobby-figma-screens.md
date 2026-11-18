# 大厅 Figma 画板 → 代码实现范围

你当前开发的 **5 张画板**（其中 `Color Game大廳優化` 为两个变体）与仓库模块的对应关系如下。实现顺序建议按表中 **Phase** 从上到下。

| Figma 画板 | node-id | 是什么 | 代码落点 | Phase |
|------------|---------|--------|----------|-------|
| **Lobby_正常狀態_h5** | `1986:25794` | 大厅地图主态（顶栏/Banner/跑马灯/四游戏建筑/Jackpot/底栏 PLAY） | `LobbyHeader` + `LobbyBanner` + `LobbyMapView` + `LobbyBottomBar` + `public/lobby/*` 切图 | A |
| **Lobby_加載失敗** | `2061:99788` | 与主态相同 UI + **Notice 弹窗**（Failed to load / Retry） | `useLobbyMapBootstrap` + `LobbyNoticeModal`（`variant="load-failure"`） | A |
| **Lobby_循環影片** | `2232:29011` | **资产说明帧**（非整页）：四路建筑预览视频参考 | `lobbyBuildingVideos.ts` + `LobbyMapBuilding` `<video loop muted playsInline>` | A |
| **Color Game大廳優化** | `2257:33675` | 房间列表：**标准滚动列表**（无顶部分割 message/banner 条） | `LobbyListView` + `listVariant="default"` | B |
| **Color Game大廳優化** | `2257:35578` | 房间列表：**带 message/banner switch + 顶 banner** | `LobbyListView` + `listVariant="with-top-banner"` | B |

Figma 文件：[Perya大廳](https://www.figma.com/design/H2yMrlt0xorVELcsx663FF/Perya%E5%A4%A7%E5%8E%85) · Page `後期_開發` `1986:23673`

---

## Phase A — 大厅地图三态 + 循环视频

### A1. 状态机

```
mapLoadState: "loading" | "ready" | "error"
```

| 状态 | 表现 | 对照画板 |
|------|------|----------|
| `loading` | 可先保留主态占位或 skeleton（稿中有「正在加载」系列 Frame，后续再接） | `讀取_正在加载2-*`（本范围外可选） |
| `ready` | 正常地图 + 建筑视频窗循环播放 | `Lobby_正常狀態_h5` |
| `error` | 主态模糊/压暗 + Notice 弹窗 | `Lobby_加載失敗` |

- 逻辑：`src/views/LobbyPage/useLobbyMapBootstrap.ts`
- 开发模拟：`?lobbyFail=1` 强制 `error`；大厅 Retry 重新拉取

### A2. 循环影片（`Lobby_循環影片`）

稿内四格命名与游戏 ID 映射：

| Figma 层名 | gameId | 本地路径（占位，后续换正式 mp4） |
|------------|--------|--------------------------------|
| `PL_CG_Video` | `color-game` | `/lobby/video/color-game.mp4` |
| `PL_DB_Video` | `drop-ball` | `/lobby/video/drop-ball.mp4` |
| `PL_HT_Video` | `hantak` | `/lobby/video/hantak.mp4` |
| `PL_PP_Video` | `pula-puti` | `/lobby/video/pula-puti.mp4` |

配置：`src/config/lobbyBuildingVideos.ts` · 组件：`LobbyMapBuilding.tsx`

视频失败时：显示建筑静态图（从 Figma 导出 `PL_*_NormalBase` / poster），不阻断整页——整页失败才走 `mapLoadState=error`。

### A3. 切图与样式

`Lobby_正常狀態_h5` 子树含大量位图（`PL_Bg`、`PL_Island`、各游戏建筑、Jackpot 等）。建议：

1. 用 Figma `download_assets` / 设计导出到 `public/lobby/`
2. `LobbyMapView` 用 **分层背景 + 绝对定位建筑**（替代当前 CSS 渐变占位）
3. 色字 token 对齐 `docs/figma-perya-lobby.md` §2

Jackpot 弹跳、建筑 glow：Phase A 可先 CSS，活动态 Spine 见 `docs/figma-perya-lobby.md` §2.4。

---

## Phase B — Color Game 大厅优化（两张稿）

两帧 **结构相同**，差异主要在列表区顶部：

- **`2257:33675`**：直接进入 `ui_game room` 列表 + 底栏 dock + 无限滚动
- **`2257:35578`**：额外 `message / banner switch` 与顶部 `banner` 条（滚动时 message 与 banner 切换逻辑待产品）

| 能力 | 实现 |
|------|------|
| 列表 + 分页 | 已有 `useInfiniteScroll` + `fetchLobbyRoomsPage` |
| 房间卡 | 对齐稿中 `room` / `room_type_jp` 组件（替换 `lobby-room` 占位） |
| 顶栏回大厅 | `LobbyHeader` `showHome`（列表态） |
| 变体切换 | `useLobbyStore.colorGameListVariant` 或后端字段；默认 `default` |

对齐单屏时对该节点调用 `get_design_context`（`2257:33675` / `2257:35578`）。

---

## Phase C — 不在本 5 张内、但会接壤

- 活动/Mission/Wallet 真实数据与路由
- 建筑活动态 Spine、双游戏联动
- 半弹窗直播间（点击建筑先进房列表）

---

## 本地调试

| 目的 | 方式 |
|------|------|
| 加载失败 UI | 打开 `/?lobbyFail=1` |
| 列表带顶 Banner 变体 | `useLobbyStore.getState().setColorGameListVariant('with-top-banner')`（或后续 UI 开关） |
| 建筑视频 | 将 mp4 放入 `public/lobby/video/`，见 `lobbyBuildingVideos.ts` |
| 地图底图 | `public/lobby/map-bg.png`（占位参考图，热点见 `MAP_GAMES`） |
| 建筑视频 | `public/lobby/video/*.mp4` + `posters/*`（对齐 `2232:29011`） |
| 列表变体 | `setColorGameListVariant('with-top-banner')` → `2257:35578` |

---

## 修订

| 日期 | 说明 |
|------|------|
| 2026-11-12 | 按用户指定 5 画板建立实现映射与 Phase |
