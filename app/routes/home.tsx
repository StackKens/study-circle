import type { Route } from "./+types/home";
import Welcome from "~/components/ui/welcome";
export function meta({}: Route.MetaArgs) {
  return [{ title: "StudyCircle" }, { name: "description", content: "Home" }];
}

export default function Home() {
  return <Welcome />;
}
