"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuestions } from "../../../components/test-page/questions-provider";
import { ChevronLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import BackButton from "../../../components/test-page/back-button";
import NextButton from "../../../components/test-page/next-button";
import ProgressBar from "../../../components/test-page/progress-bar";
import NavbarTestPage from "@/components/test-page/navbar-test-page";

export default function TestPage() {
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const params = useParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.page) || 1);
  const { answers, setAnswers } = useQuestions();
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [bagian, setBagian] = useState(0);
  const TOTAL_PAGES = 3;
  const start = 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isTieBreaker, setIsTieBreaker] = useState<boolean>(false);
  const [tiebreakerAnswer, setTiebreakerAnswer] = useState<"A" | "B" | null>(
    null,
  );
  const searchParams = useSearchParams();
  const [branchCategory, setBranchCategory] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined"
        ? (searchParams?.get("branch") ?? null)
        : null;
    } catch {
      return null;
    }
  });

  const [resultId, setResultId] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("quizResultId")
        : null;
    } catch {
      return null;
    }
  });

  const normalize = (raw: any[]) =>
    (raw || []).map((q: any) => ({
      id: q.id,
      text: q.question_text,
      order_number: q.order_number,
      branch_category: q.branch_category,
      options: (q.quiz_options || []).map((o: any) => ({
        id: o.id,
        label: o.option_text,
        value: o.option_value ?? null,
        points: o.points ?? null,
      })),
    }));

  useEffect(() => {
    let mounted = true;

    // Check and resume in-progress quiz from database
    const checkResumeQuiz = async () => {
      try {
        const response = await fetch('/api/quiz/resume', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          console.log('Resume check failed, starting fresh');
          return false;
        }

        const data = await response.json();
        
        // If completed quiz exists, redirect to result
        if (data.state === 'completed' && data.result_id) {
          console.log('✅ Quiz completed, redirecting to result');
          router.push(`/result?id=${data.result_id}`);
          return true;
        }

        // If in-progress quiz exists, restore state
        if (data.state === 'in_progress' && data.result_id) {
          console.log('🔄 Resuming quiz from Layer', data.current_layer);
          
          // Restore resultId
          setResultId(data.result_id);
          try {
            localStorage.setItem('quizResultId', data.result_id);
          } catch {}

          // Restore branch category
          if (data.branch_category) {
            setBranchCategory(data.branch_category);
            try {
              localStorage.setItem('branchCategory', data.branch_category);
            } catch {}
          }

          // If tiebreaker needed (Layer 4)
          if (data.current_layer === 4 && data.tiebreaker_params) {
            const { juzA, juzB } = data.tiebreaker_params;
            try {
              localStorage.setItem('tiebreaker_juzA', String(juzA));
              localStorage.setItem('tiebreaker_juzB', String(juzB));
            } catch {}
            
            // Navigate to tiebreaker page
            if (page !== 4) {
              router.push(`/test/4?juzA=${juzA}&juzB=${juzB}`);
              return true;
            }
          }

          // Navigate to current layer if different from current page
          // Only redirect on initial load (page 1) to avoid redirect loops
          if (data.current_layer !== page && page === 1) {
            const targetLayer = data.current_layer;
            if (targetLayer === 3 && data.branch_category) {
              router.push(`/test/3?branch=${data.branch_category}`);
            } else {
              router.push(`/test/${targetLayer}`);
            }
            return true;
          }

          return false;
        }

        return false;
      } catch (error) {
        console.error('Resume check error:', error);
        return false;
      }
    };

    const tryLoadPersistedTieBreaker = (): boolean => {
      try {
        const sp = searchParams;
        const pJuzA = sp?.get("juzA");
        const pJuzB = sp?.get("juzB");
        if (page === 4 && (pJuzA || pJuzB)) {
          const raw =
            typeof window !== "undefined"
              ? localStorage.getItem("lastTieBreakerQuestions")
              : null;
          const rawParams =
            typeof window !== "undefined"
              ? localStorage.getItem("lastTieBreakerParams")
              : null;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (mounted) {
              setQuestions(parsed);
              setIsTieBreaker(true);
            }
            return true;
          }
        }
      } catch {}
      return false;
    };

    const fetchQuestionsForLayer = async (layerToFetch: number) => {
      setLoading(true);
      setError(null);
      setBagian(layerToFetch);
      try {
        let url = `/api/quiz/questions?layer=${layerToFetch}`;
        if (layerToFetch === 3) {
          if (!branchCategory) {
            setLoading(false);
            return;
          }
          url += `&branch=${encodeURIComponent(branchCategory)}`;
        }

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const rawText = await res.text().catch(() => "");
          console.error("Failed fetching questions:", {
            url,
            status: res.status,
            body: rawText,
          });
          throw new Error(
            rawText || `Failed to fetch questions (status ${res.status})`,
          );
        }

        const qText = await res.text().catch(() => "");
        let qjson: any = {};
        try {
          qjson = qText ? JSON.parse(qText) : {};
        } catch (parseErr) {
          qjson = { raw: qText };
          console.error("Failed to parse next-layer response JSON", {
            url,
            parseErr,
            raw: qText,
          });
        }
        if (!res.ok) {
          console.error("Next-layer questions fetch failed:", {
            url,
            status: res.status,
            body: qjson,
          });
          setError(
            qjson.error ||
              qjson.raw ||
              `Gagal mengambil pertanyaan layer berikutnya (status ${res.status})`,
          );
          return;
        }
        const fetchedQuestions = normalize(qjson.questions || qjson);
        setQuestionsCount(fetchedQuestions.length);
        if (mounted) {
          if (
            !fetchedQuestions ||
            fetchedQuestions.length === 0 ||
            (page === 3 &&
              questions.length > 0 &&
              questions[0]?.branch_category === branchCategory)
          ) {
            setLoading(false);
            return;
          }
          setQuestions(fetchedQuestions);
          setError(null);
          setIsTieBreaker(false);
        }
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Error loading questions");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Main initialization flow
    const init = async () => {
      // First check if we should resume from database
      const shouldReturn = await checkResumeQuiz();
      if (shouldReturn) {
        return;
      }

      // Then try loading persisted tiebreaker
      if (tryLoadPersistedTieBreaker()) {
        return;
      }

      // Finally fetch questions for current layer
      await fetchQuestionsForLayer(page);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [page, branchCategory]);

  useEffect(() => {
    if (page !== 1) return;
    if (typeof window === "undefined") return;

    const urlSp = new URL(window.location.href).searchParams;
    const isFreshQuery = urlSp.get("fresh") === "1";
    const shouldClear =
      isFreshQuery || localStorage.getItem("clearQuizOnStart") === "1";

    if (!shouldClear) return;

    const keysToClear = [
      "quizResultId",
      "lastTieBreakerQuestions",
      "lastTieBreakerParams",
      "lastResultPayload",
      "branchCategory",
      "answers",
      "quizAnswers",
    ];

    keysToClear.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
    try {
      localStorage.removeItem("clearQuizOnStart");
    } catch {}

    try {
      if (typeof setAnswers === "function") {
        if ((setAnswers as any).length === 1) {
          (setAnswers as any)({});
        } else if (answers && typeof answers === "object") {
          Object.keys(answers).forEach((k) => {
            try {
              (setAnswers as any)(Number(k), "");
            } catch {}
          });
        }
      }
    } catch {}

    if (!isFreshQuery) {
      const nextUrl =
        window.location.pathname +
        (window.location.search
          ? window.location.search + "&fresh=1"
          : "?fresh=1");
      window.location.replace(nextUrl);
      return;
    } else {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, "", cleanUrl);
    }
  }, [page, setAnswers, answers]);

  const pageQs = questions.slice(start, questions.length);
  const setAnswer = (qKey: string | number, value: string) =>
    setAnswers(qKey as number, value);

  const allAnswered = pageQs.every((q, idx) => {
    const key = q.id ?? start + idx;
    return answers?.[key] !== undefined && answers?.[key] !== "";
  });
  const allAnsweredForSubmit = isTieBreaker
    ? tiebreakerAnswer !== null
    : allAnswered;

  const totalPages = TOTAL_PAGES;

  const submitLayer = async () => {
    try {
      let anonUserId =
        typeof window !== "undefined"
          ? localStorage.getItem("anonUserId")
          : null;

      if (!anonUserId && typeof window !== "undefined") {
        anonUserId = `anon_${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        try {
          localStorage.setItem("anonUserId", anonUserId);
        } catch {}
        try {
          document.cookie = `anonUserId=${anonUserId}; path=/;`;
        } catch {}
      }

      const currentQuestionIds = new Set(questions.map((q) => String(q.id)));
      const answersArray = Object.entries(answers || {})
        .filter(([k]) => currentQuestionIds.has(String(k)))
        .map(([k, v]) => {
          const opt = String(v ?? "");
          const numericMatch = opt.match(/^\d+$/);
          return {
            question_id: Number(k),
            option_id: numericMatch ? Number(opt) : opt,
          };
        })
        .filter((a) => typeof a.option_id === "number");

      if (!isTieBreaker && answersArray.length === 0) {
        setError("Tidak ada jawaban numerik untuk dikirim pada layer ini.");
        return;
      }

      let payload: any = null;
      if (isTieBreaker || page === 4) {
        if (!tiebreakerAnswer) {
          setError("Silakan pilih jawaban tie-breaker (A atau B).");
          return;
        }
        payload = {
          layer: 4,
          answers: [],
          resultId: resultId ?? undefined,
          anonUserId: anonUserId ?? undefined,
          tiebreakerAnswer: tiebreakerAnswer,
        };
      } else {
        payload = {
          layer: page,
          answers: answersArray,
          anonUserId: anonUserId ?? undefined,
        };
        if (page > 1 && resultId) payload.resultId = resultId;
      }

      Object.keys(payload).forEach(
        (k) =>
          (payload[k] === undefined || payload[k] === null) &&
          delete payload[k],
      );

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let json: any;
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch (e) {
        json = { error: "Invalid JSON response", raw };
      }

      if (json.branch_category) {
        try {
          setBranchCategory(String(json.branch_category));
        } catch {}
        try {
          localStorage.setItem("branchCategory", String(json.branch_category));
        } catch {}
      }

      if (!res.ok) {
        console.error(
          "Submit error status:",
          res.status,
          "body:",
          json,
          "raw:",
          raw,
        );
        setError(json.error || "Gagal submit layer.");
        return;
      }

      const returnedResultId =
        json.result_id || json.result?.id || json.resultId || null;
      if (returnedResultId) {
        setResultId(String(returnedResultId));
        try {
          localStorage.setItem("quizResultId", String(returnedResultId));
        } catch {}
      }

      console.log('📥 Submit response:', {
        completed: json.completed,
        next_layer: json.next_layer,
        had_tie: json.had_tie,
        message: json.message,
        has_questions: Array.isArray(json.questions),
      });

      // CASE 1: Quiz completed (no tiebreaker) -> navigate to result page
      if (
        json.completed === true ||
        /quiz completed/i.test(json.message || "")
      ) {
        console.log('CASE 1: Quiz completed, navigating to /result');
        const idToShow = returnedResultId;
        try {
          const payloadToStore = {
            ...json,
            branch_category:
              json.branch_category ??
              branchCategory ??
              (typeof window !== "undefined"
                ? localStorage.getItem("branchCategory")
                : null) ??
              null,
          };
          localStorage.setItem(
            "lastResultPayload",
            JSON.stringify(payloadToStore),
          );
        } catch {}
        if (idToShow) {
          router.push(`/result?id=${encodeURIComponent(idToShow)}`);
          return;
        } else {
          router.push("/result");
          return;
        }
      }

      // CASE 2: Tie detected -> fetch tiebreaker questions (layer 4) and navigate
      if (
        json.had_tie ||
        json.next_layer === 4 ||
        json.next_action === "fetch_tiebreaker"
      ) {
        const params = json.tiebreaker_params || json.tiebreakerParams || {};
        try {
          if (returnedResultId)
            localStorage.setItem("quizResultId", String(returnedResultId));
          if (params.juzA)
            localStorage.setItem("tiebreaker_juzA", String(params.juzA));
          if (params.juzB)
            localStorage.setItem("tiebreaker_juzB", String(params.juzB));
          localStorage.setItem("lastResultPayload", JSON.stringify(json));
        } catch {}

        if (params.juzA && params.juzB) {
          const juzA =
            params.juzA ?? params.juz_a ?? json.top_juz_1 ?? json.top_juz1;
          const juzB =
            params.juzB ?? params.juz_b ?? json.top_juz_2 ?? json.top_juz2;

          if (!juzA || !juzB) {
            setError("Missing tie-breaker parameters.");
            return;
          }

          const tbr = await fetch(
            `/api/quiz/tie-breaker?juzA=${encodeURIComponent(String(juzA))}&juzB=${encodeURIComponent(String(juzB))}`,
            { method: "GET", credentials: "include" },
          );

          const tbJson = await tbr.json();

          if (!tbr.ok) {
            setError(tbJson.error || "Gagal mengambil tie-breaker questions.");
            return;
          }

          // API returns { tiebreaker: {...}, layer:4, description: ... }
          const tb =
            tbJson.tiebreaker ||
            tbJson.tiebreakerQuestion ||
            tbJson.tiebreaker_question;
          if (!tb) {
            setError("Tie-breaker question not found in response.");
            return;
          }

          // convert tie-breaker shape to the quiz question shape used by the UI
          const tbQuestion = {
            id: tb.id ?? 0,
            question_text:
              tb.question_text ?? tb.question ?? "Pertanyaan tie-breaker",
            branch_category: null,
            order_number: 1,
            quiz_options: [
              {
                id: `A_${tb.id}`,
                points: 0,
                option_text:
                  tb.option_a_description ?? tb.optionA ?? "Pilihan A",
                option_value: "A",
                order_number: 1,
              },
              {
                id: `B_${tb.id}`,
                points: 0,
                option_text:
                  tb.option_b_description ?? tb.optionB ?? "Pilihan B",
                option_value: "B",
                order_number: 2,
              },
            ],
          };

          const tbq = normalize([tbQuestion]);
          // persist tie-breaker payload so the remounted page can load it
          try {
            localStorage.setItem(
              "lastTieBreakerQuestions",
              JSON.stringify(tbq),
            );
            localStorage.setItem(
              "lastTieBreakerParams",
              JSON.stringify({ juzA: String(juzA), juzB: String(juzB) }),
            );
          } catch {}
          setQuestions(tbq);
          setIsTieBreaker(true);
          // include juzA/juzB in URL so new page instance knows it's a tie-breaker page
          router.push(
            `/test/4?juzA=${encodeURIComponent(String(juzA))}&juzB=${encodeURIComponent(String(juzB))}`,
          );
          return;
        }

        if (json.tie_breaker?.questions || json.tieBreaker?.questions) {
          const tb = json.tie_breaker || json.tieBreaker;
          const tbq = normalize(tb.questions);
          setQuestions(tbq);
          setIsTieBreaker(true);
          router.push(`/test/4`);
          return;
        }

        setError("Tie detected but no tiebreaker parameters available.");
        return;
      }

      // CASE 3: Normal next_layer flow (including layer 3 branch)
      if (json.next_layer && typeof json.next_layer === "number") {
        console.log('CASE 3: next_layer =', json.next_layer);
        const nextLayer = json.next_layer;
        const branchForNext = json.branch_category ?? null;
        const url =
          nextLayer === 3 && branchForNext
            ? `/api/quiz/questions?layer=3&branch=${encodeURIComponent(branchForNext)}`
            : `/api/quiz/questions?layer=${nextLayer}`;

        console.log('Fetching questions for next layer:', url);
        const qres = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        const qText = await qres.text().catch(() => "");
        let qjson: any = {};
        try {
          qjson = qText ? JSON.parse(qText) : {};
        } catch (parseErr) {
          qjson = { raw: qText };
          console.error("Failed to parse next-layer response JSON", {
            url,
            parseErr,
            raw: qText,
          });
        }
        if (!qres.ok) {
          console.error("Next-layer questions fetch failed:", {
            url,
            status: qres.status,
            body: qjson,
          });
          setError(
            qjson.error ||
              qjson.raw ||
              `Gagal mengambil pertanyaan layer berikutnya (status ${qres.status})`,
          );
          return;
        }
        const nx = normalize(qjson.questions || qjson);
        console.log('Questions loaded, navigating to:', nextLayer === 3 && branchForNext ? `/test/3?branch=${branchForNext}` : `/test/${nextLayer}`);
        setQuestions(nx);
        setIsTieBreaker(false);
        if (nextLayer === 3 && branchForNext) {
          router.push(`/test/3?branch=${encodeURIComponent(branchForNext)}`);
        } else {
          router.push(`/test/${nextLayer}`);
        }
        return;
      }

      // CASE 4: Questions returned directly in response
      if (Array.isArray(json.questions) && json.questions.length > 0) {
        console.log('CASE 4: Questions in response, loading...');
        const nx = normalize(json.questions);
        setQuestions(nx);
        setIsTieBreaker(false);
        if (page < TOTAL_PAGES) router.push(`/test/${page + 1}`);
        return;
      }

      // Fallback: No clear next action
      console.warn('No next_layer or questions found, falling back to /result', json);
      router.push("/result");
    } catch (err) {
      console.error("Submit exception:", err);
      setError("Terjadi kesalahan saat submit.");
    }
  };

  const handleOptionChange = (
    key: string | number,
    optionId: string,
    opt: any,
  ) => {
    const numericKey = typeof key === "string" ? parseInt(key, 10) : key;
    setAnswer(numericKey, optionId);

    if (isTieBreaker) {
      const val = opt.value ?? opt.option_value ?? null;
      if (val === "A" || val === "B") {
        setTiebreakerAnswer(val);
      } else {
        const inferred = String(optionId).startsWith("A_")
          ? "A"
          : String(optionId).startsWith("B_")
            ? "B"
            : null;
        setTiebreakerAnswer(inferred as "A" | "B" | null);
      }
    }

    // Auto-scroll logic
    setTimeout(() => {
      const currentIndex = pageQs.findIndex((q) => {
        const qKey = q.id ?? start + pageQs.indexOf(q);
        return qKey === key;
      });

      const nextQuestion = pageQs[currentIndex + 1];
      if (nextQuestion) {
        const nextKey = nextQuestion.id ?? start + currentIndex + 1;
        const nextElement = questionRefs.current[nextKey];
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const next = () => {
    submitLayer();
  };

  const prev = () => {
    if (page > 1) {
      router.push(`/test/${page - 1}`);
    }
  };

  return (
    <div>
      <NavbarTestPage />
      <div className="flex flex-row gap-4 items-center mx-8"></div>

      <div className="mt-6 relative">
        <div className="lg:mx-36.75 mx-4.5 flex flex-col">
          <Link href="/">
            <Button className="bg-neutral-25 text-neutral-800 !rounded-[8px] lg:absolute left-8 top-4 max-lg:mb-6 shadow-sm hover:scale-105">
              <ChevronLeft className="mr-2" />
              <p className="text-sm text-neutral-800 font-bold">Keluar</p>
            </Button>
          </Link>
          <div className="sticky top-0 z-20 bg-white py-4 rounded-xl">
            <ProgressBar
              currentPage={page}
              totalPages={totalPages}
              questionsCount={questionsCount}
              bagian={bagian}
            ></ProgressBar>
          </div>

          {loading && <p className="text-center mt-6">Loading questions...</p>}
          {error && <p className="text-center text-red-500 mt-6">{error}</p>}

          {pageQs.map((q, idx) => {
            const key = q.id ?? start + idx;
            const numericKey =
              typeof key === "string" ? parseInt(key, 10) : key;
            return (
              <div
                key={key}
                className="lg:pt-7 pt-4"
                ref={(el) => {
                  questionRefs.current[numericKey] = el;
                }}
              >
                <div className="py-9.25 lg:px-15.25 px-5.5 bg-neutral-25 border-0.5 border-neutral-100 rounded-[15px] shadow-xs">
                  <legend className="mb-5.5 font-bold lg:text-[18px] text-sm">
                    {q.text}
                  </legend>
                  <div className="grid lg:grid-cols-2 grid-cols-1 gap-4 auto-rows-fr">
                    {(q.options ?? []).map((opt: any) => {
                      const optionId = String(opt.id);
                      const optionLabel = opt.label ?? optionId;
                      const clicked = answers?.[numericKey] === optionId;
                      return (
                        <label
                          key={optionId}
                          className={`flex items-center gap-2 h-full px-5 py-2.5 rounded-[10px] border border-neutral-400 cursor-pointer hover:bg-[#BEDED066]  ${
                            clicked ? "bg-[#BEDED066]" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${numericKey}`}
                            value={optionId}
                            checked={answers?.[numericKey] === optionId}
                            onChange={() =>
                              handleOptionChange(numericKey, optionId, opt)
                            }
                            className={`w-6 h-6 flex-shrink-0 cursor-pointer ${
                              clicked ? "accent-background-2" : ""
                            }`}
                          />
                          <span className="lg:text-[18px] text-sm">
                            {optionLabel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-neutral-25 border-1 border-neutral-100 mt-15">
        <div className="mt-6 flex flex-row justify-between lg:mx-19.25 mx-4.5 gap-3">
          <BackButton prev={prev} page={page} />

          <NextButton
            next={next}
            allAnswered={allAnsweredForSubmit}
            page={page}
            questions={questions}
            totalPages={totalPages}
          />
        </div>
        <p className="text-center text-sm text-neutral-500 mt-2 mb-3.75">
          Jawab semua pertanyaan terlebih dahulu
        </p>
      </div>
    </div>
  );
}
