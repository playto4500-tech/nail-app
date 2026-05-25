export type ActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error?: string;
    };

export function actionOk(): ActionResult {
  return { ok: true };
}

export function actionError(error?: string): ActionResult {
  return {
    ok: false,
    error,
  };
}
