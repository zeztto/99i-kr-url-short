# Vultr Deploy

이 문서는 `99i.kr` 운영 서버(`p1zza-1st`)에 현재 프로젝트를 수동 배포할 때의 기준 절차입니다.

## 전제

- 대상 서버 경로: `/opt/99i-kr-url-short`
- 대상 compose 파일: `/opt/99i-kr-url-short/compose.yml`
- 대상 Caddy site file: `/opt/caddy/sites-enabled/99i.kr.caddy`
- 앱 컨테이너: `i99-kr-app`
- DB 컨테이너: `i99-kr-db`
- gateway network: `i99-kr_default`

## 주의

- 서버에는 다른 서비스가 많이 돌고 있으므로, `docker system prune`, 전역 compose 명령, Caddy 전체 재구성 같은 파괴적 작업은 금지합니다.
- 항상 `/opt/99i-kr-url-short` 프로젝트만 대상으로 작업합니다.
- 운영 env는 `.env.production` 을 사용합니다. Git에 secrets를 넣지 않습니다.
- `compose.yml` 은 `${DB_*}` 치환을 사용하므로 실행할 때 `--env-file .env.production` 을 반드시 함께 넘깁니다.

## 배포 전 점검

```bash
ssh p1zza-1st 'docker compose --env-file /opt/99i-kr-url-short/.env.production -f /opt/99i-kr-url-short/compose.yml ps'
ssh p1zza-1st 'docker ps --format "table {{.Names}}\t{{.Status}}" | grep i99-kr'
ssh p1zza-1st 'sed -n "1,120p" /opt/caddy/sites-enabled/99i.kr.caddy'
```

## 코드 업로드

로컬 저장소에서 서버로 파일을 동기화합니다. secrets 파일은 제외합니다.

```bash
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  ./ p1zza-1st:/opt/99i-kr-url-short/
```

## 운영 env 반영

필수 env 예시:

- `DATABASE_URL`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `BASE_URL=https://99i.kr`
- `AUTH_URL=https://99i.kr`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` 또는 `GOOGLE_CLIENT_ID`
- `AUTH_GOOGLE_SECRET` 또는 `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAILS=zeztto@gmail.com`
- `TURNSTILE_ENABLED`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_EXPECTED_HOSTNAME=99i.kr`
- `TURNSTILE_SECRET_KEY`

## 배포 명령

DB schema 반영:

```bash
ssh p1zza-1st 'cd /opt/99i-kr-url-short && docker compose --env-file .env.production -f compose.yml --profile migration run --rm migrator'
```

앱 재빌드/재기동:

```bash
ssh p1zza-1st 'cd /opt/99i-kr-url-short && docker compose --env-file .env.production -f compose.yml up -d --build app'
```

필요 시 DB까지 포함한 상태 확인:

```bash
ssh p1zza-1st 'cd /opt/99i-kr-url-short && docker compose --env-file .env.production -f compose.yml ps'
```

반복 배포용 스크립트:

```bash
ssh p1zza-1st 'bash /opt/99i-kr-url-short/ops/vultr/deploy.sh'
```

## 배포 후 검증

```bash
ssh p1zza-1st 'curl -I -s https://99i.kr'
ssh p1zza-1st 'curl -I -s https://99i.kr/admin'
ssh p1zza-1st 'docker logs --tail 100 i99-kr-app'
```

확인 포인트:

- `https://99i.kr` 가 `200`
- `/admin` 이 더 이상 `404` 가 아니고 인증 흐름으로 진입
- `i99-kr-app` healthcheck 정상
- Caddy가 계속 `i99-kr-app:3000` 으로 reverse proxy

## 롤백

이 프로젝트는 서버에서 Git checkout 이 아니라 파일 복사본으로 운영됩니다.

롤백 기본 전략:

1. `/opt/99i-kr-url-short` 의 직전 백업 디렉터리를 보관
2. 이전 파일셋을 다시 rsync
3. `docker compose --env-file .env.production -f compose.yml up -d --build app`

Compose나 env를 바꾸기 전에는 타임스탬프 백업을 먼저 만드는 것을 권장합니다.
