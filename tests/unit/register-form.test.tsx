// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/auth", () => ({
  signUpAction: vi.fn(async () => ({})),
}));

import { RegisterForm } from "@/app/(auth)/register/register-form";

afterEach(() => vi.clearAllMocks());

describe("<RegisterForm />", () => {
  it("por defecto marca 'atleta' y refleja el rol en el input oculto", async () => {
    const { container } = render(<RegisterForm />);
    const hidden = container.querySelector('input[name="role"]') as HTMLInputElement;
    expect(hidden.value).toBe("athlete");

    await userEvent.click(screen.getByRole("button", { name: /soy coach/i }));
    expect(hidden.value).toBe("coach");
    expect(screen.getByRole("button", { name: /soy coach/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
