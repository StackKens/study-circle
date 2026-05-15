import { Button } from "./Button";

export default function Welcome() {
  return (
    <div>
      <p className="text-2xl   text-center text-gray-400 font-bold">
        Welcome to studyCircle
      </p>

      <Button variant="primary" size="sm">
        Get startted{" "}
      </Button>
    </div>
  );
}
