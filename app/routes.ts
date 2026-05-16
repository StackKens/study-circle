import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layout/app_layout.tsx", [
    index("routes/home.tsx"),
    route("study-way", "./routes/study-way.tsx"),
    route("features", "./routes/features.tsx"),
    route("stories", "./routes/stories.tsx"),
    route("auth/login", "routes/auth/login.tsx"),
    route("auth/register", "routes/auth/register.tsx"),
  ]),
] satisfies RouteConfig;
