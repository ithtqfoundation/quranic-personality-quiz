"use client";

import Image from "next/image";
import {motion as m} from "framer-motion";
import { fadeUpSection, sectionTitle } from "@/lib/motionVariants";

const hasil = [
  {
    image: "/hasil-1.png",
    title: "Makna Juz",
    description: "Gambaran kecenderungan kepribadian yang paling dominan dalam dirimu saat ini.",
  },
  {
    image: "/hasil-2.png",
    title: "Pola Emosi & Respons",
    description: "Gambaran kecenderungan kepribadian yang paling mendekati dirimu saat ini.",
  },
  {
    image: "/hasil-3.png",
    title: "Arah Pengembangan Diri",
    description: "Gambaran kecenderungan kepribadian yang paling mendekati dirimu saat ini.",
  },
];

const Hasil = () => {
  return (
    <section className="py-5 px-3 md:py-24 bg-white text-black">
      <div className="container mx-auto px-4 md:px-6">
        <m.h2 variants={sectionTitle} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl lg:text-4xl text-center mb-10 font-cormorant font-extrabold">
        Hasil yang Kamu Dapatkan
        </m.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 max-w-[80rem] mx-auto items-center">
          <m.div variants={fadeUpSection} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3, margin: "-100px" }}
          whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} 
          className="flex justify-center lg:justify-end lg:order-2">
            <Image
              src="/hasil-4e.png"
              alt="Hasil Card Preview"
              width={600}
              height={600}
              className="mb-10 lg:mb-0"
            />
          </m.div>
          <div className="space-y-5 max-w-[45rem] lg:order-1">
            {hasil.map((item, index) => (
              <m.div
              key={index} 
              variants={fadeUpSection}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3, margin: "-100px" }}
              className="flex gap-5 md:gap-8 items-end">
                <Image 
                src={item.image} 
                alt={item.title} 
                className="mx-auto mb-4 object-contain"
                width={60}
                height={60}
                />
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-base">{item.description}</p>
                </div>
              </m.div>
            ))}
          </div>
                
        </div>
      </div>
    </section>
  );
};

export default Hasil;
