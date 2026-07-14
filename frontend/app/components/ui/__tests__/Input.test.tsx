import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Input from "~/components/ui/Input";

describe("Input Component", () => {
  it("renders label correctly", () => {
    render(
      <Input
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Email")).toBeDefined();
  });

  it("renders placeholder", () => {
    render(
      <Input
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
        placeholder="Enter your email"
      />,
    );
    expect(screen.getByPlaceholderText("Enter your email")).toBeDefined();
  });

  it("calls onChange when value changes", () => {
    const handleChange = vi.fn();
    render(
      <Input
        label="Email"
        type="email"
        value=""
        onChange={handleChange}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "test@test.com" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("displays current value", () => {
    render(
      <Input
        label="Email"
        type="email"
        value="test@test.com"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("test@test.com");
  });

  it("shows error message when provided", () => {
    render(
      <Input
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
        error="Email is required"
      />,
    );
    expect(screen.getByText("Email is required")).toBeDefined();
  });

  it("applies error styling when error is provided", () => {
    render(
      <Input
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
        error="Email is required"
      />,
    );
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("applies full width when fullWidth is true", () => {
    const { container } = render(
      <Input
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
        fullWidth
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("w-full");
  });

  it("has correct input type", () => {
    render(
      <Input
        label="Password"
        type="password"
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByDisplayValue("");
    expect(input).toHaveAttribute("type", "password");
  });
});
