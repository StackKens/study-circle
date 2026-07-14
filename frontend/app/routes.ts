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
    route("blog/:slug", "routes/blog_post.tsx"),
    route("contact", "routes/contact.tsx"),
    route("privacy", "routes/legal/privacy.tsx"),
    route("terms", "routes/legal/terms.tsx"),
    route("guidelines", "routes/legal/guidelines.tsx"),
    route("verify-email", "routes/verify-email.tsx"),
    route("join/:token", "routes/group_join.tsx"),
  ]),

  // Private routes, protected by a component
  layout("layout/dashboard_layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),

    // Student routes
    route("dashboard/assignments", "routes/dashboard/student_assignments.tsx"),
    route("dashboard/groups", "routes/dashboard/groups.tsx"),
    route("dashboard/groups/:groupId", "routes/dashboard/group_detail.tsx"),
    route("dashboard/groups/:groupId/chat", "routes/dashboard/group_chat.tsx"),
    route("dashboard/chat", "routes/dashboard/general_chat.tsx"),
    route("dashboard/sessions", "routes/dashboard/sessions.tsx"),
    route("dashboard/resources", "routes/dashboard/resources.tsx"),
    route("dashboard/progress", "routes/dashboard/progress.tsx"),
    route("dashboard/friends", "routes/dashboard/friends.tsx"),
    route("dashboard/library", "routes/dashboard/library.tsx"),
    route("dashboard/messages", "routes/dashboard/messages.tsx"),
    route("dashboard/instructors", "routes/dashboard/instructors.tsx"),
    route("dashboard/courses", "routes/dashboard/courses.tsx"),
    route("dashboard/courses/:courseId", "routes/dashboard/course_detail.tsx"),
    route("dashboard/profile", "routes/dashboard/profile.tsx"),

    // Instructor routes
    route("dashboard/instructor", "routes/dashboard/instructor/index.tsx"),
    route(
      "dashboard/instructor/courses",
      "routes/dashboard/instructor/courses.tsx",
    ),
    route(
      "dashboard/instructor/announcements",
      "routes/dashboard/instructor/announcements.tsx",
    ),
    route(
      "dashboard/instructor/resources",
      "routes/dashboard/instructor/resources.tsx",
    ),
    route(
      "dashboard/instructor/assignments",
      "routes/dashboard/instructor/assignments.tsx",
    ),
    route(
      "dashboard/instructor/submissions",
      "routes/dashboard/instructor/submissions.tsx",
    ),
    route(
      "dashboard/instructor/discussions",
      "routes/dashboard/instructor/discussions.tsx",
    ),
    route(
      "dashboard/instructor/courses/:courseId",
      "routes/dashboard/instructor/course_detail.tsx",
      [
        route(
          "announcements",
          "routes/dashboard/instructor/course_announcements.tsx",
        ),
        route("resources", "routes/dashboard/instructor/course_resources.tsx"),
        route(
          "assignments",
          "routes/dashboard/instructor/course_assignments.tsx",
        ),
        route(
          "discussions",
          "routes/dashboard/instructor/course_discussions.tsx",
        ),
      ],
    ),
  ]),
] satisfies RouteConfig;
