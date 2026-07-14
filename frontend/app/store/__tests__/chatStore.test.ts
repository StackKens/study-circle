import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "~/store/chatStore";

describe("Chat Store", () => {
  beforeEach(() => {
    useChatStore.setState({ generalMessageCount: 0 });
  });

  it("has initial state", () => {
    const state = useChatStore.getState();
    expect(state.generalMessageCount).toBe(0);
  });

  it("sets general message count", () => {
    const { setGeneralMessageCount } = useChatStore.getState();
    setGeneralMessageCount(5);
    expect(useChatStore.getState().generalMessageCount).toBe(5);
  });

  it("updates general message count multiple times", () => {
    const { setGeneralMessageCount } = useChatStore.getState();
    setGeneralMessageCount(10);
    setGeneralMessageCount(20);
    expect(useChatStore.getState().generalMessageCount).toBe(20);
  });
});
