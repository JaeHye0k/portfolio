"use client";

import { useCallback, useEffect, useId, useState, type ChangeEvent, type DragEvent } from "react";
import { FolderOpen, Upload } from "lucide-react";
import { decodeGib, GibParseError, parseGib } from "@/lib/janggi";
import type { GameRecord } from "@/lib/janggi";
import JanggiViewer from "./JanggiViewer";

export type GibFileViewerProps = {
  /** 예시로 열 수 있는 기보의 URL. */
  sampleUrl?: string;
  sampleLabel?: string;
};

type Loaded = { name: string; records: GameRecord[] };

function describe(record: GameRecord, index: number): string {
  const { cho, han } = record.meta.players;
  const result = record.meta.result.raw ? ` · ${record.meta.result.raw}` : "";
  return `${index + 1}. ${cho.name || "미상"} vs ${han.name || "미상"} (${record.plies.length}수${result})`;
}

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

function explain(e: unknown): string {
  if (e instanceof GibParseError) {
    const where = [
      `${e.gameIndex + 1}번째 대국`,
      e.moveNumber !== undefined ? `${e.moveNumber}수` : null,
      e.token ? `"${e.token}"` : null,
    ]
      .filter(Boolean)
      .join(" ");
    return `${where}: ${e.message}`;
  }
  return e instanceof Error ? e.message : String(e);
}

/** .gib 파일을 열어 대국을 고르고 `JanggiViewer`로 넘기는 껍데기. */
export default function GibFileViewer({ sampleUrl, sampleLabel = "샘플 기보 열기" }: GibFileViewerProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  const load = useCallback((name: string, bytes: ArrayBuffer) => {
    try {
      const records = parseGib(decodeGib(bytes));
      if (records.length === 0) throw new Error("기보가 들어 있지 않습니다.");
      setLoaded({ name, records });
      setIndex(0);
      setError(null);
    } catch (e) {
      setError(`${name}: ${explain(e)}`);
    }
  }, []);

  const loadFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      load(file.name, await file.arrayBuffer());
    },
    [load],
  );

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    void loadFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragging(false);
    void loadFile(e.dataTransfer.files?.[0]);
  };

  const loadSample = useCallback(() => {
    if (!sampleUrl) return;
    fetchBytes(sampleUrl).then(
      (bytes) => load(sampleUrl.split("/").pop() ?? "sample.gib", bytes),
      (e) => setError(`샘플을 불러오지 못했습니다: ${explain(e)}`),
    );
  }, [sampleUrl, load]);

  // `?sample`이 붙은 링크로 들어오면 샘플을 바로 연다.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("sample")) loadSample();
  }, [loadSample]);

  const record = loaded?.records[index];

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="기보 파일 열기"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-wrap items-center gap-3 border-2 border-dashed px-4 py-3 ${
          dragging ? "border-accent bg-accent-100" : "border-divider bg-surface"
        }`}
      >
        <Upload size={18} className="text-neutral-600" aria-hidden />
        <p className="text-[13px] text-neutral-700">.gib 파일을 여기에 끌어다 놓거나</p>
        <label
          htmlFor={inputId}
          className="cursor-pointer border border-ink bg-ink px-3 py-1.5 text-[13px] font-semibold text-ground hover:bg-accent hover:border-accent"
        >
          파일 선택
        </label>
        <input id={inputId} type="file" accept=".gib,text/plain" onChange={onInput} className="sr-only" />
        {sampleUrl && (
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1 border border-divider bg-ground px-3 py-1.5 text-[13px] hover:border-accent hover:text-accent"
          >
            <FolderOpen size={14} aria-hidden /> {sampleLabel}
          </button>
        )}
        {loaded && (
          <span className="ml-auto text-[12px] text-neutral-600">
            {loaded.name} · {loaded.records.length}국
          </span>
        )}
      </section>

      {error && (
        <p role="alert" className="border border-accent bg-accent-100 px-3 py-2 text-[13px] text-accent-800">
          {error}
        </p>
      )}

      {loaded && loaded.records.length > 1 && (
        <label className="flex items-center gap-2 text-[13px]">
          대국 선택
          <select
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="min-w-0 flex-1 border border-divider bg-surface px-2 py-1.5 text-[13px]"
          >
            {loaded.records.map((r, i) => (
              <option key={i} value={i}>
                {describe(r, i)}
              </option>
            ))}
          </select>
        </label>
      )}

      {record ? (
        <JanggiViewer key={`${loaded?.name}#${index}`} record={record} />
      ) : (
        <p className="py-10 text-center text-[13px] text-neutral-600">
          기보를 열면 여기에 장기판이 나타납니다. ←/→ 방향키와 스페이스로 수순을 넘길 수 있습니다.
        </p>
      )}
    </div>
  );
}
