import CTA from "@/components/landing-page/CTA";
import Footer from "@/components/landing-page/Footer";
import Hasil from "@/components/landing-page/Hasil";
import Hero from "@/components/landing-page/Hero";
import Manfaat from "@/components/landing-page/Manfaat";
import Navbar from "@/components/landing-page/Navbar";

export default function Landing() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Manfaat />
      <Hasil />
      <CTA />
      <Footer />
    </main>
  );
}
