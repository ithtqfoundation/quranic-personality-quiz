'use client';
import { FaArrowRight } from "react-icons/fa";
import Image from "next/image";
import { motion as m } from "framer-motion";
import { heroActions, heroBadge, heroContainer, heroSubtitle, heroTitle } from "@/lib/motionVariants";
import { createClient } from "@/lib/supabase/client";

interface HeroProps {
  content?: Record<string, string>;
}

export default function Hero({ content }: HeroProps) {
  const badge = content?.badge_text || "Durasi 5–10 menit";
  const title = content?.title || "Kenali Kepribadian Qur'ani-mu berdasarkan 30 Juz Al-Qur'an";
  const subtitle = content?.subtitle || "Pertanyaan reflektif yang disusun bersama psikolog untuk memahami kecenderungan kepribadian melalui kerangka 30 Juz Al-Qur'an";
  const bgImage = content?.background_image || "/hero-bg.jpg";
  const ctaPrimary = content?.cta_primary_text || "Mulai Test";
  const ctaSecondary = content?.cta_secondary_text || "Tentang HTQ";
  const ctaSecondaryUrl = content?.cta_secondary_url || "https://www.htqfoundation.com/";

  return (
    <m.section variants={heroContainer} initial="hidden" animate="visible" viewport={{ once: true }} className="relative w-full h-screen px-6 md:px-16 py-20 md:py-28 text-center overflow-hidden">
      
      {/* Hero Image */}
      <div className="absolute top-0 left-0 w-full h-[118%] overflow-hidden">
        <Image
          src={bgImage}
          alt="Hero"
          fill
          className="object-cover object-center scale-x-170 -translate-y-5 md:object-fill md:scale-100 md:-translate-y-0"
          style={{ objectPosition: 'top' }}
        />
      </div>
      <div className="absolute inset-0 bg-[var(--color-tosca)] opacity-60"></div>

      {/* Konten */}
      <div className="relative z-10 text-[var(--foreground)] mt-35 md:mt-20">
        <m.span variants={heroBadge} className="font-semibold inline-block 
                 bg-[var(--color-background-2)]/60 text-sm px-5 py-1 rounded-xl
                 shadow-[0_1px_10px_rgba(190,237,208,0.5),0_1px_35px_rgba(190,237,208,0.5)]
                 transition-shadow duration-300
                 border border-[var(--color-background-2)]/64">
          {badge}
        </m.span>

        <m.h1 variants={heroTitle} className="mt-6 text-[1.75rem] md:text-5xl max-w-xl mx-auto leading-tight font-cormorant font-bold">
          {title}
        </m.h1>

        <m.p variants={heroSubtitle} className="font-plus-jakarta mt-2 max-w-2xl mx-auto text-sm md:text-lg text-[var(--foreground)]">
          {subtitle}
        </m.p>

        <div className="font-plus-jakarta mt-8 flex flex-col flex-row justify-center gap-6 font-semibold">
          <m.button variants={heroActions} className="bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-lg shadow-lg hover:bg-[var(--color-primary-700)] cursor-pointer inline-flex items-center justify-center"
          onClick={async () => {await createClient().auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${location.origin}/auth/callback`,
            },
          });
          }}>
            {ctaPrimary} <FaArrowRight className="ml-2" />
          </m.button>
          <m.button variants={heroActions} className="border border-[var(--foreground)] px-4 py-2 rounded-lg shadow-lg hover:bg-[var(--color-primary-300)] cursor-pointer text-[var(--foreground)]"
          onClick={() => window.open(ctaSecondaryUrl, "_blank", "noopener,noreferrer")}>
            {ctaSecondary}
          </m.button>
        </div>
      </div>
    </m.section>
  )
}
