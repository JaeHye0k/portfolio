import type { Metadata } from "next";
import Link from "next/link";
import GibFileViewer from "@/components/janggi/GibFileViewer";

export const metadata: Metadata = {
  title: "장기 기보 뷰어",
  description: "장기 기보(.gib) 파일을 열어 수순을 재생하는 뷰어.",
};

export default function JanggiPage() {
  return (
    <main className="container-page flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-divider pb-4">
        <div>
          <h1 className="text-[22px]">장기 기보 뷰어</h1>
          <p className="mt-1 text-[13px] text-neutral-700">
            대한장기협회·장기 for Kakao 형식의 .gib 파일을 지원합니다. 파일은 브라우저 안에서만 읽습니다.
          </p>
        </div>
        <Link href="/" className="text-[13px]">
          ← 포트폴리오
        </Link>
      </header>
      <GibFileViewer sampleUrl="/samples/2023-rookie-final.gib" sampleLabel="2023 신인왕전 결승 열기" />
    </main>
  );
}
