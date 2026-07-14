import { describe, it, expect, beforeEach } from "vitest";
import { useGroupStore } from "~/store/groupStore";

describe("Group Store", () => {
  beforeEach(() => {
    useGroupStore.setState({
      groups: [],
      page: 1,
      total: 0,
      loading: false,
      hasMore: true,
    });
  });

  it("has initial state", () => {
    const state = useGroupStore.getState();
    expect(state.groups).toEqual([]);
    expect(state.page).toBe(1);
    expect(state.total).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.hasMore).toBe(true);
  });

  it("sets groups", () => {
    const mockGroups = [
      { id: "1", name: "Group 1", subject: "CS" },
      { id: "2", name: "Group 2", subject: "Math" },
    ];
    useGroupStore.setState({ groups: mockGroups });
    expect(useGroupStore.getState().groups).toEqual(mockGroups);
  });

  it("sets loading state", () => {
    useGroupStore.setState({ loading: true });
    expect(useGroupStore.getState().loading).toBe(true);
  });

  it("sets pagination info", () => {
    useGroupStore.setState({ page: 2, total: 50, hasMore: false });
    const state = useGroupStore.getState();
    expect(state.page).toBe(2);
    expect(state.total).toBe(50);
    expect(state.hasMore).toBe(false);
  });

  it("appends groups to existing list", () => {
    const existingGroups = [{ id: "1", name: "Group 1", subject: "CS" }];
    const newGroups = [{ id: "2", name: "Group 2", subject: "Math" }];

    useGroupStore.setState({ groups: existingGroups });
    const currentGroups = useGroupStore.getState().groups;
    useGroupStore.setState({ groups: [...currentGroups, ...newGroups] });

    expect(useGroupStore.getState().groups).toHaveLength(2);
  });
});
