import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "@/components/ui/chip";
import { vi } from "vitest";

describe("Chip", () => {
  it("renders label", () => {
    render(<Chip>Pokémon</Chip>);
    expect(screen.getByText("Pokémon")).toBeInTheDocument();
  });
  it("calls onRemove when X clicked", async () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>tag</Chip>);
    await userEvent.click(screen.getByRole("button", { name: /quitar/i }));
    expect(onRemove).toHaveBeenCalled();
  });
});
