# 장기 기보 뷰어 — 구현 계획

스펙: `docs/superpowers/specs/2026-09-29-janggi-viewer-design.md`

## 작업 순서

1. **코어 타입과 보드** — `lib/janggi/types.ts`, `pieces.ts`, `board.ts`, `notation.ts`
   - 테스트: `test/janggi/board.test.ts` (표준 배치, 판 파싱/직렬화, applyPly 오류)
2. **재생 엔진** — `lib/janggi/replay.ts`
   - 테스트: `test/janggi/replay.test.ts`
3. **GIB 파서/디코더/직렬화** — `lib/janggi/gib/*`
   - 테스트: `gib-parse.test.ts`, `gib-serialize.test.ts`, `decode.test.ts`
   - 픽스처: `test/janggi/fixtures.ts` (협회·카카오·접장기·주석·패스 샘플, 이름 익명화)
4. **코퍼스 전수 테스트** — `test/janggi/corpus.test.ts` (폴더 없으면 skip)
5. **React 컴포넌트** — `components/janggi/*`, `useReplay`
   - 테스트: `test/janggi/JanggiViewer.test.tsx`
6. **페이지와 샘플** — `app/janggi/page.tsx`, `public/samples/2023-rookie-final.gib` (`?sample`로 자동 열기)
7. **검증** — `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, 브라우저 확인
8. **리뷰** — code-reviewer 에이전트로 별도 검토 후 반영

각 단계는 테스트를 먼저 쓰고 구현한다. 커밋은 단계별로 나눈다.
