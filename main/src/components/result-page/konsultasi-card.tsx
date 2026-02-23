import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

export default function KonsultasiCard() {
  return (
    <div
      className=" rounded-[10px] md:px-15.5 px-5 pt-8 pb-13 flex flex-col items-center my-21.5"
      style={{
        background: `linear-gradient(92deg, rgba(61, 159, 142, 0.42) 7.43%, rgba(61, 159, 142, 0.60) 57.44%), url(/image/konsultasi-card-bg.webp) lightgray 0.501px -1592.816px / 100% 844.441% no-repeat`,
      }}
    >
      <h5 className="text-center font-bold md:text-[32px] text-[22px]">
        Ingin memahami lebih dalam?
      </h5>
      <p className="text-center md:text-[18px] text-[16px] mt-2.5 xl:mx-80 lg:mx-30 mx-5">
        Setiap hasil memiliki dinamika emosi, tantangan, dan potensi yang unik.
        Konsultasi personal membantu kamu memahami makna hasil tes ini serta
        menyusun langkah pengembangan diri yang lebih selaras dan aplikatif.
      </p>
      <Link href={"https://wa.me/6285784514899"}>
        <Button className="mt-5 !bg-[#303030] !rounded-[8px] !text-[#EFEFEF] hover:bg-neutral-900 hover:scale-105">
          <p className="text-[16px]">Konsultasi Sekarang</p>
        </Button>
      </Link>
    </div>
  );
}
