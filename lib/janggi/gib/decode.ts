/**
 * GIB 파일 바이트를 문자열로 바꾼다.
 *
 * 협회·카카오 기보는 CP949(EUC-KR)로 저장된다. UTF-8로 저장된 파일도 받을 수 있게
 * 먼저 엄격한 UTF-8 디코딩을 시도하고, 실패하면 EUC-KR로 읽는다.
 * 한글 EUC-KR 바이트열은 UTF-8로는 거의 항상 유효하지 않으므로 오판 위험이 낮다.
 * 파일 끝의 Ctrl-Z(`\x1a`)와 BOM은 제거한다.
 */
export function decodeGib(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("euc-kr").decode(bytes);
  }
  return text.replace(/^﻿/, "").replace(//g, "");
}
