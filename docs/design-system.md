# 99i.kr Design System

## Direction

`99i.kr`의 마케팅 홈은 빠르게 이해되고 바로 사용할 수 있는 URL 단축 도구를 첫 화면에 보여준다. 기본 테마는 light mode이며, 시각 언어는 과한 장식보다 자연스러운 여백, 신뢰감 있는 녹색, 절제된 데이터 시각화에 집중한다.

## Principles

- Light-first: 흰색과 연한 sage 계열의 표면을 기본으로 사용한다.
- One clear action: landing page의 주 행동은 링크 생성이며, CTA 문구는 행동을 직접 말한다.
- Functional marketing: hero는 브랜드와 제품 사용 장면을 동시에 보여주고, 아래 섹션은 기능과 운영 신뢰를 설명한다.
- Calm motion: hover와 focus는 180ms 안팎의 작은 이동과 색상 변화만 사용한다.
- Accessible contrast: 본문, CTA, form control은 밝은 배경에서 충분한 대비를 유지한다.

## Tokens

### Color

| Token | Value | Usage |
| --- | --- | --- |
| `--surface-canvas` | `#f7f8f4` | page background |
| `--surface-primary` | `#ffffff` | forms, cards, panels |
| `--surface-muted` | `#edf2ec` | secondary panels |
| `--surface-sage` | `#dce9df` | selection, chart accents |
| `--surface-ink` | `#17211c` | contrast band, product mock |
| `--text-primary` | `#17211c` | headings and primary text |
| `--text-secondary` | `#526258` | body text |
| `--text-muted` | `#748177` | helper text |
| `--accent-green` | `#2f6f5e` | primary action |
| `--accent-blue` | `#225f83` | links and data |
| `--accent-amber` | `#c5892c` | highlights |
| `--accent-red` | `#bc3f39` | errors |

### Shape

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-xs` | `4px` | charts and small marks |
| `--radius-sm` | `6px` | compact controls |
| `--radius-md` | `8px` | cards, buttons, inputs |

### Layout

| Token | Value | Usage |
| --- | --- | --- |
| `--space-page` | `clamp(20px, 5vw, 72px)` | responsive page gutters |
| `--container-max` | `1180px` | content max width |

## Components

- `hero-section`: first viewport, centered brand headline, short supporting copy, URL input, and one primary shortening button.
- `url-tool`: URL input, primary submit button, optional Turnstile slot, error, result panel.
- `bento-grid`: customer-facing FEATURES storytelling with 3-column, 3-row motion cards, capped at 8px radius and no card background gradients.
- `usecase-layout`: feature-to-campaign playbook with a left summary board and horizontal scenario rows.
- `pricing-grid`: Basic, Pro, Max, Enterprise plan cards with limits, annual/monthly prices or contact state, detailed benefits, and CTA buttons.
- `social-proof-section`: dark contrast section with anonymous role-based testimonials and company segment chips.
- `faq-list`: answer-first FAQ blocks for SEO, AEO, and GEO readability.
- `cta-panel`: final action block with one primary CTA.
- `site-footer`: quiet trust and navigation area with brand copy, service links, plan links, and marketing use-case links.

## Content Rules

- H1은 `99i.kr`처럼 큰 brand headline으로 노출하고, 바로 아래에 짧은 supporting copy를 둔다.
- 한국어 heading/title에는 브랜드명이나 도메인처럼 의미상 필요한 경우를 제외하고 마침표와 쉼표를 쓰지 않는다.
- CTA는 `줄이기`, `링크 만들기`처럼 사용자가 할 일을 직접 말한다.
- 보안 확인은 Turnstile이 활성화될 때만 노출하고, 비활성화 상태에서는 빈 공간을 남기지 않는다.
- 공개 landing navigation에는 백오피스인 Admin을 노출하지 않는다.
- 공개 footer에도 Admin, 내부 설정, 백오피스 링크를 노출하지 않는다.
- 플랜 정보는 링크 수, 접속 한도, 월 가격 또는 문의 상태, 핵심 차이, CTA, 세부 제공 기능을 표면화한다.
- FEATURES 섹션은 플랜명이 아니라 URL 생성, 통계, 캠페인 비교, 고유주소, 목적지 수정, QR 코드, 보고서, 전용 운영처럼 고객이 실제로 사용하는 기능을 3행 카드로 설명한다.
- FEATURES 섹션 문구는 비전문가도 바로 이해할 수 있도록 쉬운 동사 중심 표현을 사용한다.
- USE CASES 섹션은 FEATURES 기능이 추천인, 광고 소재, 채널 분리, QR 캠페인에서 실제로 어떤 흐름으로 쓰이는지 설명한다.
- USE CASES는 FEATURES 카드와 같은 grid card 반복을 피하고 playbook row 형태로 구성한다.
- 주요 landing section은 hero처럼 최소 한 화면 높이를 갖도록 구성한다.
- 가격 섹션은 연 구독을 기본 선택 상태로 먼저 보여주고 월 구독 전환을 제공한다.
- Max 플랜에는 최대 100개 주소 관리, 고유주소, 목적지 수정, 주소당 1,000,000회 접속, 상세 통계, 통계 보고서 다운로드, QR 목적지 수정/관리를 명시한다.
- Enterprise 플랜에는 맞춤 단축 주소 수와 접속 한도, 전용 도메인, SSO/SAML 로그인, SCIM 사용자 프로비저닝, 팀 권한과 승인 워크플로, 감사 로그, 대량 QR 캠페인, 맞춤 통계 리포트와 SLA를 명시한다.
- 마케팅 활용 사례는 추천인 링크, 전환율 측정, 채널별 추적처럼 실제 캠페인 의사결정에 연결되는 문장으로 쓴다.
- 추천사와 사용 기업 영역에는 실제 고객명이 확인되지 않은 브랜드명을 꾸며내지 않고, 역할/팀/기업 유형 중심으로 표현한다.
- FAQ는 질문에 바로 답하는 문장으로 작성해 검색엔진과 AI 답변 엔진이 정확히 요약할 수 있게 한다.
