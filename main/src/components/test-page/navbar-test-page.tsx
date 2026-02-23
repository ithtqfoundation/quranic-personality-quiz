import React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Info,
  Clock,
  UserCheck,
  Target,
  Lock,
  SkipForward,
} from "lucide-react";

export default function NavbarTestPage() {
  return (
    <nav className="border-b-[2px] border-[rgba(0,0,0,0.08)] top-0 w-full bg-white py-4 md:px-14.5 px-8">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-1 items-center">
          <Image src={"/htq-logo.png"} alt="HTQ Logo" width={36} height={35} />
          <div className="flex flex-col font-cormorant text-[16px] ">
            <p>Yayasan Halaqah </p>
            <p>Tadarus Al-Quran</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger className="flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-100 px-4 rounded-[8px]">
            <Info className="w-5 h-5" />
            <p className="md:block hidden">Panduan</p>
          </DialogTrigger>
          <DialogContent className="bg-white !rounded-[15px] md:min-w-190 min-w-76 !ring-0 !shadow-none px-[25px] py-[23px]">
            <DialogHeader>
              <DialogTitle>
                <p className="font-bold md:text-[22px] text-[18px] pb-5 border-b-[2px] border-[rgba(0,0,0,0.08)]">
                  Panduan
                </p>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <ul className="space-y-3 md:text-[18px] text-[14px]">
                <li>
                  <Clock className="inline mb-1 mr-2.5 w-6 h-6" />
                  Tes ini membutuhkan waktu sekitar 10-15 menit untuk
                  diselesaikan.
                </li>
                <li>
                  <UserCheck className="inline mb-1 mr-2.5 w-6 h-6" />
                  Jawablah dengan tenang dan jujur, sesuai kondisi dirimu saat
                  ini.
                </li>
                <li>
                  <Target className="inline mb-1 mr-2.5 w-6 h-6" />
                  Tidak ada jawaban benar atau salah.
                </li>
                <li>
                  <Lock className="inline mb-1 mr-2.5 w-6 h-6" />
                  Jawabanmu bersifat pribadi dan hanya digunakan untuk keperluan
                  hasil tes
                </li>
                <li>
                  <SkipForward className="inline mb-1 mr-2.5 w-6 h-6" />
                  Kamu dapat melanjutkan tes selama sesi masih aktif.
                </li>
              </ul>
            </div>
            <div className="pt-5 border-t-[2px] border-[rgba(0,0,0,0.08)] flex justify-end">
              <DialogClose asChild>
                <button className="bg-[#303030] px-4 py-2.5 rounded-[8px] text-white hover:opacity-75">
                  Tutup
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}
