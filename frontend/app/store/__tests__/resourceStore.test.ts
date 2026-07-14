import { describe, it, expect, beforeEach } from "vitest";
import { useResourceStore } from "~/store/resourceStore";

describe("Resource Store", () => {
  beforeEach(() => {
    useResourceStore.setState({
      resources: [],
      page: 1,
      total: 0,
      loading: false,
      hasMore: true,
    });
  });

  it("has initial state", () => {
    const state = useResourceStore.getState();
    expect(state.resources).toEqual([]);
    expect(state.page).toBe(1);
    expect(state.total).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.hasMore).toBe(true);
  });

  it("sets resources", () => {
    const mockResources = [
      { id: "1", title: "Resource 1", type: "pdf" },
      { id: "2", title: "Resource 2", type: "link" },
    ];
    useResourceStore.setState({ resources: mockResources });
    expect(useResourceStore.getState().resources).toEqual(mockResources);
  });

  it("sets loading state", () => {
    useResourceStore.setState({ loading: true });
    expect(useResourceStore.getState().loading).toBe(true);
  });

  it("sets pagination info", () => {
    useResourceStore.setState({ page: 2, total: 50, hasMore: false });
    const state = useResourceStore.getState();
    expect(state.page).toBe(2);
    expect(state.total).toBe(50);
    expect(state.hasMore).toBe(false);
  });

  it("appends resources to existing list", () => {
    const existingResources = [{ id: "1", title: "Resource 1", type: "pdf" }];
    const newResources = [{ id: "2", title: "Resource 2", type: "link" }];

    useResourceStore.setState({ resources: existingResources });
    const currentResources = useResourceStore.getState().resources;
    useResourceStore.setState({
      resources: [...currentResources, ...newResources],
    });

    expect(useResourceStore.getState().resources).toHaveLength(2);
  });
});
