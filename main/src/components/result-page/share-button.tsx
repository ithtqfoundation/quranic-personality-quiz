"use client";

import React from "react";
import { Button } from "../ui/button";
import { Send, Download, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import { compressToEncodedURIComponent } from "lz-string";
import { toast } from "sonner";

export default function ShareButton() {
  const saveImage = async () => {
    const el =
      typeof window !== "undefined"
        ? document.getElementById("hasil-juz-root")
        : null;
    if (!el) {
      return;
    }
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(el as HTMLElement, {
      useCORS: true,
      backgroundColor: "white",
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hasil-juz.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const copyPayloadLink = () => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("lastResultPayload")
        : null;
    if (!raw) {
      return;
    }
    const compressed = compressToEncodedURIComponent(raw);
    const url = `${window.location.origin}/share?d=${compressed}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link disalin ke clipboard!"));
  };

  return (
    <Dialog>
      <DialogTrigger className="bg-gradient-to-t from-[#3D9F8E] to-[#0E5C51] text-[#EFEFEF] !px-3.5 py-2 hover:!from-tosca hover:!to-tosca flex flex-row items-center hover:scale-105 rounded-[8px]">
        <Send className="mr-2 w-4 h-4" />
        <p>Bagikan Hasil</p>
      </DialogTrigger>
      <DialogContent className="bg-white !rounded-[15px] !ring-0 p-6 min-h-50">
        <DialogHeader>
          <DialogTitle className="border-b-2 border-neutral-300 pb-2 !font-bold">
            Bagikan
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-row justify-center gap-6">
          <Button
            onClick={saveImage}
            className="flex flex-col items-center hover:scale-105"
          >
            <div className="rounded-full bg-[#D9D9D9] flex p-8">
              <Download className="w-4 h-4" />
            </div>
            <p>Simpan Gambar</p>
          </Button>
          <Button
            onClick={copyPayloadLink}
            className="flex flex-col items-center hover:scale-105"
          >
            <div className="rounded-full bg-[#D9D9D9] flex p-8">
              <Link className="w-4 h-4" />
            </div>
            <p>Salin Tautan</p>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
