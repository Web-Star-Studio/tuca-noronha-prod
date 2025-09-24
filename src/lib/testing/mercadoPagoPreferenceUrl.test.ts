import { describe, expect, it } from "bun:test";
import { pickCheckoutPreferenceUrl } from "../../../convex/domains/mercadoPago/helpers";

describe("pickCheckoutPreferenceUrl", () => {
  it("usa sandbox para preferências de teste", () => {
    const url = pickCheckoutPreferenceUrl({
      id: "TEST-123",
      initPoint: "https://www.mercadopago.com/init",
      sandboxInitPoint: "https://www.mercadopago.com/sandbox",
    });

    expect(url).toBe("https://www.mercadopago.com/sandbox");
  });

  it("cai para initPoint em produção", () => {
    const url = pickCheckoutPreferenceUrl({
      id: "123",
      initPoint: "https://www.mercadopago.com/init",
      sandboxInitPoint: "https://www.mercadopago.com/sandbox",
    });

    expect(url).toBe("https://www.mercadopago.com/init");
  });

  it("usa sandbox apenas quando initPoint estiver ausente em produção", () => {
    const url = pickCheckoutPreferenceUrl({
      id: "123",
      sandboxInitPoint: "https://www.mercadopago.com/sandbox",
    });

    expect(url).toBe("https://www.mercadopago.com/sandbox");
  });

  it("retorna string vazia quando nenhuma URL disponível", () => {
    const url = pickCheckoutPreferenceUrl({ id: "123" });
    expect(url).toBe("");
  });
});
