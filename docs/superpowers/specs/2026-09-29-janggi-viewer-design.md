# 장기 기보 뷰어 — 설계 문서

작성일: 2026-09-29
상태: 자율 세션에서 가정을 명시하고 진행 (사용자 사후 검토)

## 1. 목표

`.gib` 장기 기보 파일을 열어 수순을 재생하는 웹 뷰어를 만든다.
뷰어는 파일 형식과 분리된 도메인 모델(`GameRecord`) 위에서 동작해, 추후 만들 장기 게임이
같은 모델로 자기 대국을 넘기면 그대로 재생할 수 있어야 한다.

- 저장소: 이 포트폴리오 레포 (`~/Desktop/portfolio`), 라우트 `/janggi`
- 참조 데이터: `~/Downloads/카카오장기기보/*.gib` (19파일, 1,905국) + `2023 신인왕전 결승.gib` (1국)

## 2. 범위

### 포함
- GIB 텍스트 파서 (협회 표기, 카카오 표기, 접장기 `판` 태그, 한수쉼, `{주석}`, 다중 대국 파일)
- EUC-KR/UTF-8 자동 디코딩
- 도메인 모델과 재생 엔진 (수 적용, 프레임 계산, 무결성 오류 보고)
- GIB 직렬화 (게임이 대국을 저장할 때 사용, 파서 라운드트립 검증 겸용)
- React 뷰어: SVG 장기판, 수순 목록, 재생 컨트롤(처음/이전/재생/다음/끝, 키보드, 자동 재생), 대국 정보
- `/janggi` 페이지: 파일 열기(선택/드래그), 다중 대국 선택, 샘플 기보
- Vitest 테스트 + 로컬 코퍼스 전수 재생 테스트(코퍼스 폴더가 있을 때만)

### 제외
- 합법수 생성·검증, 장군/외통 판정 (기보에 적힌 `장군` 표기만 표시)
- 기보 편집, 변화수(variation), 저장 UI
- 다크 모드, i18n

## 3. GIB 형식 (조사 결과)

인코딩은 CP949(EUC-KR), 줄바꿈 CRLF, 파일 끝에 `\x1a`가 올 수 있다.
한 파일에 대국이 여러 개 이어지며, 각 대국은 `[대회명 "..."]`으로 시작한다.

### 3.1 헤더
`[키 "값"]` 한 줄씩. 관측된 키: 대회명, 회전, 대국일자, 대국장소, 초대국자, 한대국자,
초차림, 한차림, 제한시간, 총수, 대국결과, 판. 접장기(12국)는 초차림/한차림 대신 `판`이 온다.

- 차림: `마상상마` 같은 4글자. 초 기준 왼쪽부터 2·3·7·8열에 대응하며 한도 같은 방향으로 읽는다.
- 판: `행1/행2/.../행10 <초|한> 접장기`. 첫 행이 10행(초 진영 끝), 마지막이 1행. 행 안은 왼쪽부터
  기물 글자 또는 빈칸 수, 오른쪽 빈칸은 생략된다. 초 기물은 한글(차마상사장포졸), 한 기물은
  한자(車馬象士將包兵). 접미사의 진영이 선수다.
- 대국결과: `한 완승`, `초 시간승`, `한 점수승`, `한 접속 끊김 승`, `한 0.5점 승`, 오타(`완슫`),
  한자 진영(`漢 시간승`), `미상` 등 자유 텍스트.
- 총수: 본문의 수 슬롯 수(한수쉼 포함)와 1,906국 모두 일치.

### 3.2 수 목록
`번호. 수` 쌍이 공백으로 구분. 줄 단위 의미 없음. 수 문법:

```
<출발 2자리>[진영 楚|漢]<기물 1글자><도착 2자리>[잡은기물 1글자][장군]
한수쉼
```

- 칸은 `행열`. 행 1(한 끝)~10(초 끝), 10은 `0`. 열은 초 기준 왼쪽부터 1~9.
- 협회 파일은 진영 없이 한글 기물(초 졸, 한 병, 양쪽 장). 카카오는 楚/漢 + 한자(卒/兵/將).
- 잡은 기물 글자도 같은 글자 집합. `장군`은 맨 끝.
- `{...}`는 주석. 수 사이 어디든 올 수 있다.
- 기본 배치의 선수는 초. 접장기는 `판` 접미사의 진영.

이 규칙으로 1,906국 전수 보드 시뮬레이션이 오류 없이 통과했다.

## 4. 디렉터리 구조

```
lib/janggi/                 # 프레임워크 무의존 코어 (React import 금지)
  types.ts                  # 도메인 모델 + 파서/직렬화 인터페이스
  pieces.ts                 # 기물 글자 매핑(한글/한자), 진영 헬퍼
  board.ts                  # 표준 배치, 판 표기 파싱/직렬화, applyPly
  replay.ts                 # createReplay: 프레임 계산
  notation.ts               # Ply → 표시 문자열
  gib/decode.ts             # bytes → string
  gib/parse.ts              # GIB 텍스트 → GameRecord[]
  gib/serialize.ts          # GameRecord[] → GIB 텍스트
  gib/index.ts              # gibParser, gibSerializer
  index.ts
components/janggi/          # React (Next 무의존, Tailwind 사용)
  JanggiBoard.tsx           # SVG 장기판 (표시 전용, 클릭 콜백 제공)
  MoveList.tsx
  ReplayControls.tsx
  GameInfoPanel.tsx
  JanggiViewer.tsx          # record → 뷰어 조립
  useReplay.ts              # 재생 상태 훅
  GibFileViewer.tsx         # "use client": 파일 열기 + 대국 선택 + JanggiViewer
app/janggi/page.tsx         # metadata + GibFileViewer
public/samples/2023-rookie-final.gib
test/janggi/                # 단위·컴포넌트·코퍼스 테스트, fixtures/
```

## 5. 도메인 모델 (`lib/janggi/types.ts`)

```ts
export type Side = "cho" | "han";
export type PieceType =
  | "king" | "advisor" | "elephant" | "horse" | "chariot" | "cannon" | "soldier";
export type Piece = { side: Side; type: PieceType };
export type Square = { rank: number; file: number };   // rank 1~10, file 1~9
export type Board = ReadonlyArray<ReadonlyArray<Piece | null>>; // board[rank-1][file-1]
export type Formation = "마상상마" | "마상마상" | "상마상마" | "상마마상";

export type MovePly = {
  kind: "move"; side: Side; piece: PieceType;
  from: Square; to: Square; captured?: PieceType; check: boolean;
};
export type PassPly = { kind: "pass"; side: Side };
export type Ply = MovePly | PassPly;

export type Player = { name: string; grade?: string };
export type ResultReason = "decisive" | "time" | "points" | "disconnect" | "unknown";
export type GameResult = { winner: Side | null; reason: ResultReason; raw: string };
export type GameMeta = {
  event: string; round: string; date: string; site: string;
  players: Record<Side, Player>;
  timeControl: string;
  result: GameResult;
  tags: Record<string, string>;                         // 원본 태그 전체
};
export type Setup = {
  board: Board; turn: Side;
  formations?: Record<Side, Formation>;                 // 접장기면 없음
  handicap: boolean;
};
export type Comment = { ply: number; text: string };    // ply번째 수 뒤에 붙은 주석 (0 = 시작 전)
export type GameRecord = { meta: GameMeta; setup: Setup; plies: Ply[]; comments: Comment[] };

export interface GameRecordParser { readonly format: string; parse(text: string): GameRecord[]; }
export interface GameRecordSerializer { readonly format: string; serialize(records: GameRecord[]): string; }
```

추후 게임과의 계약은 `GameRecord`다. 게임은 `createStandardSetup(formations)`로 `Setup`을 만들고,
자기 수를 `MovePly`로 `plies`에 쌓으며, 뷰어에는 `GameRecord`만 넘긴다. 저장은 `gibSerializer`.

## 6. 코어 동작

- `decodeGib(bytes)`: UTF-8 fatal 디코딩을 먼저 시도하고 실패하면 EUC-KR. `\x1a` 제거.
- `parseGib(text)`: 태그 블록이 새로 시작하는 줄마다 대국을 분리한다 (특정 키에 의존하지 않아
  첫 태그가 `대회명`이 아닌 파일도 받는다). 본문은 `{주석}`과 공백·중괄호 아닌 글자 덩어리를
  한 정규식으로 차례로 뽑아, 주석은 직전 수 번호에 붙이고 나머지는 수로 해석한다. 주석이 수에
  붙어 있어도(`79졸78{좋은 수}`) 분리된다. 문법에 맞지 않는 토큰과 범위 밖 칸은 `GibParseError`
  (대국 인덱스, 수 번호, 토큰 포함). 태그 누락은 빈 문자열로 관용 처리.
- `판` 태그와 차림 태그가 함께 있으면 표준 배치에서 선수만 다른 대국으로 본다. 직렬화는
  `handicap`이거나 차림이 없거나 선수가 초가 아닐 때 `판`을 쓴다.
- `createStandardSetup(formations)`, `parseBoardNotation(판)`, `formatBoardNotation(setup)`.
- `applyPly(board, ply)`: 출발칸 기물·잡은 기물이 일치하지 않으면 `ReplayError`. 새 보드 반환.
- `createReplay(record)`: 프레임 `{ ply, board, turn, lastPly, error? }`를 0..n까지 한 번에 계산.
  무결성 오류가 나면 그 수부터는 마지막 정상 보드를 유지하고 `error`를 채운다. 뷰어는 이를 표시.
- `formatPly(ply, "hangul" | "hanja")`: 수순 목록 표기. `formatSquare`.

## 7. UI

- `JanggiBoard`: SVG. 9×10 교차점, 궁성 대각선, 기물은 팔각형 배경 + 한자. 초는 초록, 한은 빨강.
  `orientation`(아래쪽 진영, 기본 초), `lastPly` 강조(출발·도착), `checkedSide`(장군 당한 장에
  점선 링), `onSquareClick(square, piece)`·`highlights`·`selected`는 게임에서 재사용하기 위한 훅.
  칸 단위 키보드 포커스 이동은 게임의 입력 방식이 정해질 때 함께 설계한다.
- `useReplay(record, { initialPly, intervalMs, followTip })`: `ply`, `frame`,
  `goTo/next/prev/first/last`, `playing/toggle`, `intervalMs`. record가 바뀌면 `initialPly`로
  리셋하되, `followTip`이면 끝을 보고 있던 경우 새 끝으로 따라가고 아니면 보던 위치를 유지한다
  (진행 중인 대국 복기용). 자동 재생은 한 수마다 `setTimeout`.
- `JanggiViewer`: 좌측 판, 우측 정보·컨트롤·수순 목록. 키보드 ←/→/Home/End/Space는 창 전체에서
  받되, 입력 요소에 포커스가 있으면 무시하고 버튼에 포커스가 있으면 스페이스를 버튼에 양보한다.
  뷰어가 여럿이면 마지막으로 만진 뷰어만 반응한다. 모바일은 세로 스택.
- 색상은 `components/janggi/theme.ts` 한 곳에 둔다 (게임 프로젝트로 옮길 때 전역 CSS에 의존하지
  않도록 `@theme` 토큰 대신 상수).
- `GibFileViewer`: `<input type="file">` + 드롭존, 샘플 버튼, `?sample` 쿼리로 샘플 자동 열기.
  파일은 10MB 상한 안에서 `arrayBuffer()` → `decodeGib` → `parseGib`. 여러 대국이면 `<select>`로
  선택. 파싱 오류는 대국 번호·수 번호를 붙인 인라인 메시지.

## 8. 테스트

- `gib-parse.test.ts`: 협회 표기, 카카오 표기, 한수쉼, 주석, 판 태그, 다중 대국, `\x1a`, 결과 파싱
- `board.test.ts`: 표준 배치, 판 파싱(오른쪽 빈칸 생략), 판 직렬화 라운드트립
- `replay.test.ts`: 이동·캡처·패스, 불일치 시 error 프레임
- `gib-serialize.test.ts`: parse → serialize → parse 동치
- `decode.test.ts`: EUC-KR 바이트 디코딩
- `corpus.test.ts`: `JANGGI_CORPUS_DIR`(기본 `~/Downloads/카카오장기기보`)가 있으면 전수 재생, 없으면 skip
- `JanggiViewer.test.tsx`: 렌더, 버튼·키보드로 수 이동, 마지막 수에서 next 무효
