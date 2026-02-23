"use client";

import React, { useEffect, useState } from "react";
import HasilJuz from "@/components/result-page/hasil-juz";
import RestartTest from "@/components/result-page/restart-test-button";
import ShareButton from "@/components/result-page/share-button";
import KonsultasiCard from "@/components/result-page/konsultasi-card";
import Footer from "@/components/landing-page/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
export default function Result() {
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadResult = async () => {
      setLoading(true);
      try {
        // First, check if there's an in-progress or completed quiz
        const resumeResponse = await fetch('/api/quiz/resume', {
          method: 'GET',
          credentials: 'include',
        });

        if (resumeResponse.ok) {
          const resumeData = await resumeResponse.json();
          
          // If quiz is in-progress, redirect to continue
          if (resumeData.state === 'in_progress') {
            const layer = resumeData.current_layer || 1;
            let redirectUrl = `/test/${layer}`;
            
            if (layer === 3 && resumeData.branch_category) {
              redirectUrl += `?branch=${resumeData.branch_category}`;
            } else if (layer === 4 && resumeData.tiebreaker_params) {
              const { juzA, juzB } = resumeData.tiebreaker_params;
              redirectUrl += `?juzA=${juzA}&juzB=${juzB}`;
            }
            
            window.location.href = redirectUrl;
            return;
          }
          
          // If quiz is completed, continue to load result
          if (resumeData.state === 'completed' && resumeData.result_id) {
            const resultResponse = await fetch(
              `/api/quiz/results?id=${resumeData.result_id}`
            );
            
            if (resultResponse.ok && mounted) {
              const resultData = await resultResponse.json();
              setResult(resultData.result);
              setLoading(false);
              return;
            }
          }
        }

        // Fallback: try localStorage (fastest for fresh submissions)
        const raw =
          typeof window !== "undefined"
            ? localStorage.getItem("lastResultPayload")
            : null;
        if (raw) {
          try {
            const payload = JSON.parse(raw);
            const immediateResult = {
              id: payload.result_id || payload.resultId || null,
              final_juz: payload.final_juz ?? null,
              juz_scores: payload.juz_scores ?? null,
              personality: payload.personality ?? null,
              completed: payload.completed ?? null,
              _rawSubmitPayload: payload,
            };
            if (mounted) {
              setResult(immediateResult);
              setLoading(false);
            }
            return;
          } catch (e) {
            console.error('Failed to parse localStorage:', e);
          }
        }

        // Last resort: fetch latest result from API
        const response = await fetch('/api/quiz/results');
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const data = await response.json();
        const results = data.results || [];
        
        // Get most recent completed result
        const latestResult = results.find((r: any) => r.completed_at);
        
        if (latestResult && mounted) {
          // Fetch personality details
          const personalityResponse = await fetch(
            `/api/quiz/results?id=${latestResult.id}`
          );
          
          if (personalityResponse.ok) {
            const personalityData = await personalityResponse.json();
            setResult(personalityData.result);
          } else {
            setResult(latestResult);
          }
        } else if (mounted) {
          setResult(null);
        }
      } catch (e) {
        if (mounted) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(`Failed to load result: ${msg}`);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadResult();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <>
      <div className="lg:mx-21 md:mx-10 mx-5">
        <Link href="/">
          <Button className="bg-neutral-25 text-neutral-800 !rounded-[8px]  mt-8 lg:mb-8 mb-4 shadow-sm hover:scale-105">
            <ChevronLeft className="mr-2" />
            <p className="text-sm text-neutral-800 font-bold">Keluar</p>
          </Button>
        </Link>
        {loading && <p>Loading result...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !result && <p>Hasil tidak ditemukan</p>}

        {result && <HasilJuz result={result} />}
        <div className="flex flex-row md:justify-end justify-center items-center gap-5 my-8">
          <RestartTest />
          <ShareButton />
        </div>
        <KonsultasiCard />
      </div>
      <Footer />
    </>
  );
}
