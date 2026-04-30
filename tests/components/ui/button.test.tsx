import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Comprar</Button>);
    expect(screen.getByRole("button", { name: "Comprar" })).toBeInTheDocument();
  });
  it("disables when loading", () => {
    render(<Button loading>Cargando</Button>);
    expect(screen.getByRole("button", { name: /cargando/i })).toBeDisabled();
  });
  it("applies primary variant by default", () => {
    render(<Button>Primary btn</Button>);
    expect(screen.getByRole("button", { name: "Primary btn" }).className).toContain("bg-[var(--color-accent)]");
  });
});
