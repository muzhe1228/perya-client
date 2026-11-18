import type { ComponentType } from "react";
import { LobbyLayout } from "@/layouts/LobbyLayout";
import { LobbyActivityPage } from "@/views/LobbyActivityPage";
import { LobbyMapPage } from "@/views/LobbyMapPage";

export type RouteConfig = {
  path: string;
  label: string;
  element: ComponentType;
  children?: RouteConfig[];
};

export const routes: RouteConfig[] = [
  {
    path: "/",
    label: "大厅",
    element: LobbyLayout,
    children: [
      { path: "", label: "首页", element: LobbyMapPage },
      { path: "activity", label: "Activity", element: LobbyActivityPage },
    ],
  },
];