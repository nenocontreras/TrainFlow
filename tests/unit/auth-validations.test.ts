import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { isRole, landingPathFor } from "@/types";

describe("landingPathFor", () => {
  it("manda al coach a /dashboard y al atleta a /hoy", () => {
    expect(landingPathFor("coach")).toBe("/dashboard");
    expect(landingPathFor("athlete")).toBe("/hoy");
  });
});

describe("isRole", () => {
  it("acepta solo 'coach' y 'athlete'", () => {
    expect(isRole("coach")).toBe(true);
    expect(isRole("athlete")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normaliza email (trim + lowercase)", () => {
    const r = loginSchema.parse({ email: "  ME@Mail.COM ", password: "x" });
    expect(r.email).toBe("me@mail.com");
  });

  it("exige email válido y password no vacío", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = { fullName: "Ana Coach", email: "ana@b.com", password: "secret12", role: "coach" };

  it("acepta un registro válido", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza password < 8", () => {
    const r = registerSchema.safeParse({ ...base, password: "short" });
    expect(r.success).toBe(false);
  });

  it("rechaza rol fuera de coach/athlete", () => {
    expect(registerSchema.safeParse({ ...base, role: "superadmin" }).success).toBe(false);
  });

  it("rechaza nombre demasiado corto", () => {
    expect(registerSchema.safeParse({ ...base, fullName: "A" }).success).toBe(false);
  });
});
