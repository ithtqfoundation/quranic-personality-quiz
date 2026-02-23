import React from "react";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackButton({
  prev,
  page,
}: {
  prev: () => void;
  page: number;
}) {
  return (
    <Button
      onClick={prev}
      disabled={page === 1}
      className="px-4 py-2 rounded-[8px] bg-neutral-25 text-neutral-700 disabled:opacity-50 flex flex-row hover:scale-105"
    >
      <ArrowLeft className="mr-2" />
      <p>Sebelumnya</p>
    </Button>
  );
}
