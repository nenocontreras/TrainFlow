// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, act } from "@testing-library/react";
import { OfflineBanner } from "@/components/offline-banner";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setOnline(value: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(value);
  act(() => {
    window.dispatchEvent(new Event(value ? "online" : "offline"));
  });
}

describe("<OfflineBanner />", () => {
  it("no muestra nada cuando hay conexión", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("aparece al perder la conexión y desaparece al recuperarla", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    render(<OfflineBanner />);

    setOnline(false);
    expect(screen.getByRole("status")).toHaveTextContent(/sin conexión/i);

    setOnline(true);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
