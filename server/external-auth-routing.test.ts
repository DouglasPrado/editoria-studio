import { describe, expect, it } from "vitest";
import { EXTERNAL_SIGN_IN_PATH, loginDestination } from "../client/src/lib/auth-routing";

describe("roteamento de autenticação externa", () => {
  it("direciona o runtime externo à página Clerk registrada", () => {
    expect(loginDestination(true)).toBe(EXTERNAL_SIGN_IN_PATH);
    expect(EXTERNAL_SIGN_IN_PATH).toBe("/sign-in");
  });

  it("mantém o fluxo gerenciado sem destino externo", () => {
    expect(loginDestination(false)).toBeNull();
  });
});
