import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

describe("FormField", () => {
  it("associates label with input via htmlFor", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <Input id="email" />
      </FormField>
    );
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });
  it("renders error message", () => {
    render(
      <FormField label="X" htmlFor="x" error="Requerido">
        <Input id="x" />
      </FormField>
    );
    expect(screen.getByText("Requerido")).toBeInTheDocument();
  });
});
