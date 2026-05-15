import { useState } from "react";
import { Button } from "./Button";
import Input from "./Input";

export default function Welcome() {
  const [email, setEmail] = useState("");

  const handleEmail = (e) => {
    setEmail(e.target.value);
  };
  return (
    <div>
      <p className="text-2xl   text-center text-gray-400 font-bold">
        Welcome to studyCircle
      </p>

      <Button variant="primary" size="sm">
        Get startted{" "}
      </Button>
      <Input
        value={email}
        label="Email"
        placeholder="Enter your email"
        type="email"
        onChange={handleEmail}
      />
    </div>
  );
}
