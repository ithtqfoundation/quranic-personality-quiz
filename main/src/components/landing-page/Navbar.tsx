'use client';
import { Globe, Menu, X } from "react-feather";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const [open, setOpen] = useState(false);


  return (
    <nav className="fixed w-full z-50 px-6 py-7 transtion-shadow shadow--md">
      <div className="mx-auto max-w-[98rem] rounded-lg md:rounded-xl bg-[var(--color-background)] px-4 md:px-6 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          
          {/* LEFT */}
          <div className={`flex items-center gap-3 md:gap-5 ${open ? 'mt-3' : ''}`}>
            <Image src="/htq-logo.png" alt="HTQ Logo" width={40} height={40} />
            <div className="text-lg leading-tight font-cormorant font-extrabold text-[var(--foreground)]">
              <p>Yayasan Halaqah</p>
              <p>Tadarus Al-Qur&apos;an</p>
            </div>
          </div>

          {/* DESKTOP RIGHT */}
          <div className="hidden md:flex items-center gap-10 text-sm">
            <div className="flex items-center gap-3 font-semibold">
              <button
                className="rounded-lg bg-[var(--color-primary-button)] px-6 py-2 text-white hover:bg-[var(--color-primary-700)] shadow-sm cursor-pointer"
                onClick={async () => {await createClient().auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${location.origin}/auth/callback`,
                  },
                });
                }}
              >
                Mulai Test
              </button>
            </div>

            {/*<div className="flex items-center gap-1.5 text-lg font-medium cursor-pointer text-[var(--foreground)]">
              <Globe size={25} />
              <span>ID</span>
            </div>*/}
          </div>

          {/* HAMBURGER*/}
          <button
            className="md:hidden text-[var(--foreground)]"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={27} /> : <Menu size={27} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div className="mt-5 flex flex-col gap-4 font-semibold md:hidden text-sm">
            {/*<div className="flex items-center justify-center gap-2 text-base text-[var(--foreground)]">
              <Globe size={22} />
              <span>ID</span>
            </div>*/}
            <button
              className="rounded-lg bg-[var(--color-primary-button)] px-6 py-2 text-white shadow-sm mb-3"
              onClick={async () => {await createClient().auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${location.origin}/auth/callback`,
                },
              });
              }}
            >
              Mulai Test
            </button>

          </div>
        )}
      </div>
    </nav>
  );
}
