"use client";

import React, { useEffect, useState } from "react";
import HasilJuz from "@/components/result-page/hasil-juz";
import { decompressFromEncodedURIComponent } from "lz-string";

export default function SharePage() {
  const [payload, setPayload] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");

    if (!d) {
      queueMicrotask(() => {
        if (mounted) setPayload(null);
      });
      return () => {
        mounted = false;
      };
    }

    try {
      const json = decompressFromEncodedURIComponent(d);
      if (!json) {
        queueMicrotask(() => {
          if (mounted) setPayload(null);
        });
        return () => {
          mounted = false;
        };
      }
      const parsed = JSON.parse(json as string);
      queueMicrotask(() => {
        if (mounted) setPayload(parsed);
      });
    } catch (err) {
      console.error("Failed to decode share payload:", err);
      queueMicrotask(() => {
        if (mounted) setPayload(null);
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  if (payload === undefined) {
    return <div>Loading...</div>;
  }

  if (payload === null) {
    return <div>Invalid or missing data.</div>;
  }

  const immediateResult = {
    id: payload.result_id || payload.resultId || null,
    final_juz: payload.final_juz ?? null,
    juz_scores: payload.juz_scores ?? null,
    personality: payload.personality ?? null,
    completed: payload.completed ?? null,
    _rawSubmitPayload: payload,
  };

  return (
    <div className="px-4">
      <HasilJuz result={immediateResult} />
    </div>
  );
}
