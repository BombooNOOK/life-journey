/** Safari 等で JSON 不正時に出る SyntaxError を分かりやすい文言にする */
export async function parseFetchJsonResponse<T>(
  res: Response,
  fallbackError: string,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(res.ok ? "サーバーから空の応答がありました。" : fallbackError);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    if (!res.ok) {
      throw new Error(fallbackError);
    }
    throw new Error("サーバー応答の形式が不正です。時間をおいて再度お試しください。");
  }
}
