import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "~/store/sessionStore";

describe("Session Store", () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      page: 1,
      total: 0,
      loading: false,
      hasMore: true,
    });
  });

  it("has initial state", () => {
    const state = useSessionStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.page).toBe(1);
    expect(state.total).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.hasMore).toBe(true);
  });

  it("sets sessions", () => {
    const mockSessions = [
      { id: "1", title: "Session 1", start_time: "2026-01-01T10:00:00Z" },
      { id: "2", title: "Session 2", start_time: "2026-01-02T10:00:00Z" },
    ];
    useSessionStore.setState({ sessions: mockSessions });
    expect(useSessionStore.getState().sessions).toEqual(mockSessions);
  });

  it("sets loading state", () => {
    useSessionStore.setState({ loading: true });
    expect(useSessionStore.getState().loading).toBe(true);
  });

  it("sets pagination info", () => {
    useSessionStore.setState({ page: 2, total: 50, hasMore: false });
    const state = useSessionStore.getState();
    expect(state.page).toBe(2);
    expect(state.total).toBe(50);
    expect(state.hasMore).toBe(false);
  });

  it("appends sessions to existing list", () => {
    const existingSessions = [
      { id: "1", title: "Session 1", start_time: "2026-01-01T10:00:00Z" },
    ];
    const newSessions = [
      { id: "2", title: "Session 2", start_time: "2026-01-02T10:00:00Z" },
    ];

    useSessionStore.setState({ sessions: existingSessions });
    const currentSessions = useSessionStore.getState().sessions;
    useSessionStore.setState({
      sessions: [...currentSessions, ...newSessions],
    });

    expect(useSessionStore.getState().sessions).toHaveLength(2);
  });
});
