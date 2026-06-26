import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Public routes
  layout("layout/app_layout.tsx", [
    index("routes/home.tsx"),
    route("about", "routes/about.tsx"),
    route("blog", "routes/blog.tsx"),
    route("contact", "routes/contact.tsx"),
    route("privacy", "routes/legal/privacy.tsx"),
    route("terms", "routes/legal/terms.tsx"),
    route("guidelines", "routes/legal/guidelines.tsx"),
  ]),

  // Private routes, protected by a component
  layout("layout/dashboard_layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/groups", "routes/dashboard/groups.tsx"),
    route("dashboard/groups/:groupId", "routes/dashboard/group_detail.tsx"),
    route("dashboard/groups/:groupId/chat", "routes/dashboard/group_chat.tsx"),
    route("dashboard/sessions", "routes/dashboard/sessions.tsx"),
    route("dashboard/resources", "routes/dashboard/resources.tsx"),
    route("dashboard/progress", "routes/dashboard/progress.tsx"),
    route("dashboard/friends", "routes/dashboard/friends.tsx"),
    route("dashboard/library", "routes/dashboard/library.tsx"),
    route("dashboard/profile", "routes/dashboard/profile.tsx"),
  ]),
] satisfies RouteConfig;
