import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export default function NextButton({
  next,
  allAnswered,
  page,
  questions,
  totalPages,
}: {
  next: () => void;
  allAnswered: boolean;
  page: number;
  questions: any[];
  totalPages: number;
}) {
  const isLastPage = page >= totalPages;
  return (
    <Button
      onClick={next}
      disabled={!allAnswered}
      className={`px-4 py-2.5 rounded-[8px]  text-white disabled:opacity-50 flex flex-row hover:scale-105 hover:bg-tosca ${
        !isLastPage
          ? "bg-tosca"
          : "bg-gradient-to-t from-[#3D9F8E] to-[#0E5C51] shadow-xs hover:opacity-75"
      }`}
    >
      {!isLastPage ? "Selanjutnya" : "Selesai"}
      <ArrowRight className="ml-2" />
    </Button>
  );
}
