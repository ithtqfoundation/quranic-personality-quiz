"use client";

import Image from "next/image";
import {motion as m} from "framer-motion";
import { fadeUpSection } from "@/lib/motionVariants";
import { sectionTitle } from "@/lib/motionVariants";

const defaultManfaat = [
  {
    title: "Pemahaman Diri",
    desc: "Temukan kecenderungan kepribadian Anda dan bagaimana Anda merespons situasi dalam kehidupan sehari-hari.",
    image: "/manfaat-1e.png",
  },
  {
    title: "Memahami Kekuatan & Tantangan",
    desc: "Dapatkan insight dan nasihat yang dapat membantu Anda dalam perjalanan pengembangan diri.",
    image: "/manfaat-2e.png",
  },
  {
    title: "Perspektif Islami",
    desc: "Hasil tes dikaitkan dengan nilai-nilai Islam yang mendukung pertumbuhan spiritual dan karakter.",
    image: "/manfaat-3e.png",
  },
];

interface ManfaatProps {
  content?: Record<string, string>;
}

export default function Manfaat({ content }: ManfaatProps) {
  const title = content?.section_title || "Manfaat Tes";

  let items = defaultManfaat;
  if (content?.items) {
    try {
      const parsed = JSON.parse(content.items);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    } catch { /* use default */ }
  }

  return (
    <section className="px-6 md:px-16 py-16 bg-[var(--color-background)] text-[var(--foreground)]">
      <m.h2 variants={sectionTitle} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-4xl text-center mb-10 font-cormorant font-extrabold">
        {title}
      </m.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {items.map((item, idx) => (
          <m.div
            key={idx}
            variants={fadeUpSection}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3, margin: "-100px" }}
            whileHover={{ scale: 1.03 }}
            transition={{
            type: 'spring',
            stiffness: 300,
            damping: 15,
      }}
            className="border border-[var(--color-neutral-200)] rounded-xl p-6 text-center shadow-sm"
          >
            <Image 
              src={item.image} 
              alt={item.title} 
              className="mx-auto mb-3 object-contain"
              width={150}
              height={150}
              unoptimized={item.image.startsWith('http')}
            />
            <h3 className="font-plus-jakarta font-semibold md:font-bold text-lg mb-2">{item.title}</h3>
            <p className="font-plus-jakarta text-sm md:text-base text-[var(--foreground)] mb-4">{item.desc}</p>
          </m.div>
        ))}
      </div>
    </section>
  )
}
