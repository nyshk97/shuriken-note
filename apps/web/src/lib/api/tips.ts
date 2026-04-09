const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface CreateTipParams {
  amount: number;
  tipper_name?: string;
  message?: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateTipResponse {
  session_url: string;
}

export async function createTipSession(
  articleId: string,
  params: CreateTipParams
): Promise<CreateTipResponse> {
  const res = await fetch(`${API_BASE_URL}/articles/${articleId}/tip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tip: params }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message || "Failed to create tip session");
  }

  return res.json();
}
