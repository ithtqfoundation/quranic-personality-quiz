import CTA from "@/components/landing-page/CTA";
import Footer from "@/components/landing-page/Footer";
import Hasil from "@/components/landing-page/Hasil";
import Hero from "@/components/landing-page/Hero";
import Manfaat from "@/components/landing-page/Manfaat";
import Navbar from "@/components/landing-page/Navbar";

async function getLandingContent() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/admin/landing`, {
      next: { revalidate: 60, tags: ['landing-content'] },
    });

    if (!res.ok) return {};
    const data = await res.json();
    return data.content || {};
  } catch {
    return {};
  }
}

export default async function Landing() {
  const content = await getLandingContent();

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero content={content.hero} />
      <Manfaat content={content.manfaat} />
      <Hasil content={content.hasil} />
      <CTA content={content.cta} />
      <Footer content={content.footer} />
    </main>
  );
}
