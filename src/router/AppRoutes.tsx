import { Routes, Route, Navigate } from "react-router-dom";
import { type RouteConfig, routes } from "./routes";

function renderRoute(r: RouteConfig) {
  const Comp = r.element;
  if (r.children?.length) {
    return (
      <Route key={r.path} path={r.path} element={<Comp />}>
        {r.children.map((child) => {
          const index = child.path === "";
          const Child = child.element;
          return (
            <Route
              key={child.path || "index"}
              index={index}
              path={index ? undefined : child.path}
              element={<Child />}
            />
          );
        })}
      </Route>
    );
  }

  return <Route key={r.path} path={r.path} element={<Comp />} />;
}

export function AppRoutes() {
  return (
    <Routes>
      {routes.map(renderRoute)}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
