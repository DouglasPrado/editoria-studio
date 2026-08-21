export const EXTERNAL_SIGN_IN_PATH = "/sign-in";

export function loginDestination(isExternalRuntime: boolean): string | null {
  return isExternalRuntime ? EXTERNAL_SIGN_IN_PATH : null;
}
