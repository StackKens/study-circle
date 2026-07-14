import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "~/store/notificationStore";

describe("Notification Store", () => {
  beforeEach(() => {
    useNotificationStore.setState({
      unreadCount: 0,
      dmUnreadCount: 0,
    });
  });

  it("has initial state", () => {
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.dmUnreadCount).toBe(0);
  });

  it("sets unread count", () => {
    const { setUnreadCount } = useNotificationStore.getState();
    setUnreadCount(5);
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it("sets unread DM count", () => {
    const { setDmUnreadCount } = useNotificationStore.getState();
    setDmUnreadCount(10);
    expect(useNotificationStore.getState().dmUnreadCount).toBe(10);
  });

  it("increments unread count", () => {
    useNotificationStore.setState({ unreadCount: 3 });
    const { incrementUnread } = useNotificationStore.getState();
    incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it("resets counts", () => {
    useNotificationStore.setState({ unreadCount: 10, dmUnreadCount: 5 });
    useNotificationStore.setState({ unreadCount: 0, dmUnreadCount: 0 });
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.dmUnreadCount).toBe(0);
  });
});
