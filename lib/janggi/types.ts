/**
 * 장기 기보 도메인 모델.
 *
 * 이 파일의 타입은 파일 형식(GIB 등)과 무관하다. 뷰어는 `GameRecord`만 알고,
 * 파서는 `GameRecordParser`를 구현해 형식별 텍스트를 `GameRecord`로 바꾼다.
 * 추후 만들 장기 게임도 자기 수순을 `GameRecord`로 만들어 뷰어에 넘기면 된다.
 */

/** 진영. `cho`(초, 楚)가 기본 선수, `han`(한, 漢)이 후수. */
export type Side = "cho" | "han";

export type PieceType =
  | "king" // 장(將) — 궁성 안의 왕. 기물에는 楚/漢으로 새겨진다.
  | "advisor" // 사(士)
  | "elephant" // 상(象)
  | "horse" // 마(馬)
  | "chariot" // 차(車)
  | "cannon" // 포(包)
  | "soldier"; // 졸(卒, 초) / 병(兵, 한)

export type Piece = { side: Side; type: PieceType };

/**
 * 판 위의 교차점.
 * - `rank`: 1(한 진영 끝) ~ 10(초 진영 끝). 기보 표기에서 10은 `0`으로 쓴다.
 * - `file`: 1 ~ 9. 초 진영에서 바라봤을 때 왼쪽이 1이다.
 */
export type Square = { rank: number; file: number };

/** `board[rank - 1][file - 1]`. 비어 있으면 `null`. 불변으로 다룬다. */
export type Board = ReadonlyArray<ReadonlyArray<Piece | null>>;

/** 마·상 차림. 초 기준 왼쪽부터 2·3·7·8열에 차례로 놓인다. 한도 같은 방향으로 읽는다. */
export type Formation = "마상상마" | "마상마상" | "상마상마" | "상마마상";

export type MovePly = {
  kind: "move";
  side: Side;
  piece: PieceType;
  from: Square;
  to: Square;
  /** 잡은 상대 기물. 없으면 undefined. */
  captured?: PieceType;
  /** 기보에 `장군`이 표기된 수인지. 뷰어는 판정하지 않고 표기만 따른다. */
  check: boolean;
};

/** 한수쉼(패스). */
export type PassPly = { kind: "pass"; side: Side };

export type Ply = MovePly | PassPly;

export type Player = { name: string; grade?: string };

export type ResultReason =
  | "decisive" // 완승 (외통 또는 투료)
  | "time" // 시간승
  | "points" // 점수승
  | "disconnect" // 접속 끊김
  | "unknown";

export type GameResult = { winner: Side | null; reason: ResultReason; raw: string };

export type GameMeta = {
  event: string;
  round: string;
  date: string;
  site: string;
  players: Record<Side, Player>;
  timeControl: string;
  result: GameResult;
  /** 원본 헤더 태그 전체. 구조화되지 않은 정보를 잃지 않기 위해 보존한다. */
  tags: Record<string, string>;
};

export type Setup = {
  board: Board;
  /** 첫 수를 두는 진영. */
  turn: Side;
  /** 표준 배치일 때의 차림. 접장기처럼 임의 배치면 없다. */
  formations?: Record<Side, Formation>;
  handicap: boolean;
};

/** `ply`번째 수 뒤에 붙은 주석. 0이면 첫 수 앞. */
export type Comment = { ply: number; text: string };

/**
 * 대국 하나. 불변으로 다룬다. 진행 중인 대국에 수를 더할 때는
 * `{ ...record, plies: [...record.plies, ply] }`처럼 새 객체를 만든다.
 */
export type GameRecord = {
  meta: GameMeta;
  setup: Setup;
  plies: ReadonlyArray<Ply>;
  comments: ReadonlyArray<Comment>;
};

/** 형식별 텍스트를 도메인 모델로 바꾼다. 한 텍스트에 여러 대국이 들어 있을 수 있다. */
export interface GameRecordParser {
  readonly format: string;
  parse(text: string): GameRecord[];
}

/** 도메인 모델을 형식별 텍스트로 바꾼다. */
export interface GameRecordSerializer {
  readonly format: string;
  serialize(records: readonly GameRecord[]): string;
}
