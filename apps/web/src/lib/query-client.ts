import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR では通常、staleTime を 0 より上に設定して
        // クライアントで即座に再フェッチしないようにする
        staleTime: 60 * 1000, // 1分間はキャッシュを使用
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // サーバー: 常に新しい QueryClient を作成
    return makeQueryClient();
  } else {
    // ブラウザ: シングルトンを使用
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
