interface CheckoutPreferenceLike {
  id?: string | null;
  initPoint?: string | null;
  sandboxInitPoint?: string | null;
}

/**
 * Decide qual URL de checkout deve ser usada.
 * Preferimos `sandboxInitPoint` apenas quando a preferência é claramente de teste (TEST-).
 * Para IDs reais usamos `initPoint`, caindo para sandbox apenas se necessário.
 */
export function pickCheckoutPreferenceUrl(pref: CheckoutPreferenceLike): string {
  const prefId = pref.id ?? "";
  const initPoint = pref.initPoint ?? "";
  const sandboxInitPoint = pref.sandboxInitPoint ?? "";

  const isTestPreference = prefId.startsWith("TEST-");
  return isTestPreference
    ? sandboxInitPoint || initPoint
    : initPoint || sandboxInitPoint;
}
