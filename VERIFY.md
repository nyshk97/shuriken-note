# 動作確認

## 環境

- API: `docker compose up` (port: 3000)
- Web: `cd apps/web && npm run dev` (port: 3001)
- DB: PostgreSQL (Docker Compose 内)

## 確認手順

### API ヘルスチェック

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/up
# 期待: 200
```

### API テスト

```bash
docker compose exec -e RAILS_ENV=test api bundle exec rspec
# 期待: 全テスト pass
```

### Rubocop

```bash
docker compose exec api bin/rubocop
# 期待: no offenses detected
```

### Web ビルド

```bash
cd apps/web && npx next build
# 期待: ビルド成功
```

### 公開記事ページ（いいね・チップ）

```bash
# いいね
curl -s -X POST http://localhost:3000/articles/<uuid>/like -w "%{http_code}"
# 期待: 201

# チップセッション作成
curl -s -X POST http://localhost:3000/articles/<uuid>/tip \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "success_url": "http://localhost:3001", "cancel_url": "http://localhost:3001"}' \
  -w "\n%{http_code}"
# 期待: 201 + session_url を含む JSON
```

### 本番ヘルスチェック

```bash
curl -s -o /dev/null -w "%{http_code}" https://api.d0ne1s.com/up
# 期待: 200

# DNS キャッシュを疑う場合（本番サーバー直指定）
curl -s -o /dev/null -w "%{http_code}" --resolve api.d0ne1s.com:443:133.18.145.214 https://api.d0ne1s.com/up
# 期待: 200
```
