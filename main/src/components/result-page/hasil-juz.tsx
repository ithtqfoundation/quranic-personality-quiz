import React from "react";
import { Check } from "lucide-react";

export default function HasilJuz({ result }: { result?: any }) {
  if (!result) {
    return null;
  }

  const personality = result.personality ?? {};

  const name = personality.name ?? "Hasil";
  const tagline = personality.tagline ?? "";
  const description = personality.description ?? "Deskripsi tidak tersedia.";
  const strengths: string[] = personality.strengths ?? [];
  const challenges: string[] = personality.challenges ?? [];

  // const branch: string | null =
  //   (result.branch_category as string) ??
  //   (result._rawSubmitPayload?.branch_category as string) ??
  //   (result._rawSubmitPayload?.branch as string) ??
  //   (typeof window !== "undefined"
  //     ? localStorage.getItem("branchCategory")
  //     : null) ??
  //   null;

  // const egoLevel =
  //   branch && branch.length >= 2
  //     ? branch.charAt(1) === "H"
  //       ? "HIGH"
  //       : "LOW"
  //     : null;
  // const neoLevel =
  //   branch && branch.length >= 4
  //     ? branch.charAt(3) === "H"
  //       ? "HIGH"
  //       : "LOW"
  //     : null;

  return (
    <div id="hasil-juz-root" className="flex flex-col lg:gap-8 gap-4 mt-4.5">
      <div className="">
        <div
          className="relative bg-neutral-50 text-neutral-25 rounded-[10px] bg-no-repeat lg:bg-[length:100.94%_376.958%]  lg:bg-[-6px_-13px] bg-[length:100%_auto] bg-[0px_0px] bg-opa 
            md:bg-[length:100%_250%] md:bg-[0px_-10px] bg-center before:absolute before:inset-0 before:bg-[rgba(61,159,142,0.20)] before:rounded-[10px] before:z-0 px-4 pt-20 pb-6 xxs:pt-32 xxs:pb-8 xs:px-8 xs:pt-34 xs:pb-8 md:px-40 md:py-8 lg:px-50 lg:py-12 xl:pt-17 xl:pb-16 xl:pl-81.5 xl:pr-99"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.20), rgba(0,0,0,0.10)), url(/image/juz-result-bg.webp)",
          }}
        >
          <h4 className="relative z-10 font-bold lg:text-[38px] text-[26px]">
            {name}
          </h4>
          <p className="relative z-10 lg:text-[22px] text-[16px]">{tagline}</p>
        </div>
        <div className=" pt-9.25">
          <div className="lg:text-[18px] text-[14px] flex flex-col gap-4 items-start">
            <p className="lg:text-[22px] text-[16px] text-[#006557] font-bold pb-2 border-b border-neutral-200 w-full">
              Gambaran Umum
            </p>
            <p className="text-justify text-center lg:text-[18px] text-[14px]">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex lg:flex-row flex-col items-stretch justify-center gap-[25px]">
        <div className="rounded-[10px] shadow-sm bg-neutral-50 px-5.5 pt-7 pb-13 flex-1">
          <p className="font-bold lg:text-[22px] text-[16px] pb-[9px] border-b  border-neutral-200 w-full text-[#006557]">
            Kekuatan Utama
          </p>
          <div className="w-full flex flex-col gap-2 mt-2">
            {strengths.length > 0 ? (
              strengths.map((strength, i) => (
                <span key={i}>
                  <Check className="inline-block mr-2 text-tosca" size={24} />
                  <span>{strength}</span>
                  {strengths.length - 1 !== i && <span>, </span>}
                </span>
              ))
            ) : (
              <p></p>
            )}
          </div>
        </div>
        <div className="rounded-[10px] shadow-sm bg-neutral-50 px-5.5 pt-7 pb-13 flex-1">
          <p className="font-bold lg:text-[22px] text-[16px] pb-[9px] border-b border-neutral-200 w-full text-[#006557]">
            Tantangan yang Perlu Disadari
          </p>
          <div className="w-full flex flex-col gap-2 mt-2">
            {challenges.length > 0 ? (
              challenges.map((strength, i) => (
                <span key={i}>
                  <div className="inline-block mr-2 bg-neutral-200-400 rounded-full w-[15px] h-[15px]"></div>
                  <span>{strength}</span>
                  {challenges.length - 1 !== i && <span>, </span>}
                </span>
              ))
            ) : (
              <p></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
