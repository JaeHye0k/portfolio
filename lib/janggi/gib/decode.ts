/** 파일 끝에 붙는 DOS EOF 문자(Ctrl-Z). 소스에 제어 문자를 직접 넣지 않기 위해 코드로 만든다. */
export const CTRL_Z = String.fromCharCode(0x1a);
const BOM = String.fromCharCode(0xfeff);

/** 텍스트에서 Ctrl-Z를 모두 지운다. `parseGib`도 직접 받은 텍스트에 같은 처리를 한다. */
export function stripControlChars(text: string): string {
  return text.split(CTRL_Z).join("");
}

/**
 * GIB 파일 바이트를 문자열로 바꾼다.
 *
 * 협회·카카오 기보는 CP949(EUC-KR)로 저장된다. UTF-8로 저장된 파일도 받을 수 있게
 * 먼저 엄격한 UTF-8 디코딩을 시도하고, 실패하면 EUC-KR로 읽는다.
 * 한글 EUC-KR 바이트열은 UTF-8로는 거의 항상 유효하지 않으므로 오판 위험이 낮다.
 * 파일 끝의 Ctrl-Z와 BOM은 제거한다.
 */
export function decodeGib(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("euc-kr").decode(bytes);
  }
  if (text.startsWith(BOM)) text = text.slice(1);
  return stripControlChars(text);
}
