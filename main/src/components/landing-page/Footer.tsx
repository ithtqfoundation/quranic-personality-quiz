import Image from "next/image";
import { FaFacebookSquare, FaPhoneAlt, FaInstagram } from "react-icons/fa";

const defaultPageLinks = [
  { label: "Tentang Kami", url: "https://www.htqfoundation.com/" },
  { label: "Konsultasi", url: "#" },
];
const defaultLegalLinks = [
  { label: "Kebijakan Privasi", url: "#" },
  { label: "Syarat & Ketentuan", url: "#" },
];
const defaultSupportLinks = [
  { label: "Contact", url: "#" },
];

interface FooterProps {
  content?: Record<string, string>;
}

export default function Footer({ content }: FooterProps) {
  const orgLine1 = content?.org_name_line1 || "Yayasan Halaqah";
  const orgLine2 = content?.org_name_line2 || "Tadarus Al-Qur\u0027an";
  const address = content?.address || "Foresta Business Loft II Unit 6, RW 7, Lengkong Kulon, Kec. Pagedangan, Kabupaten Tangerang, Banten 15331";
  const copyright = content?.copyright_text || "© 2026 HTQ Foundation — Built by OmahTI";

  let pageLinks = defaultPageLinks;
  let legalLinks = defaultLegalLinks;
  let supportLinks = defaultSupportLinks;
  let socialLinks: { platform?: string; url: string }[] = [];

  try { if (content?.page_links) { const p = JSON.parse(content.page_links); if (Array.isArray(p) && p.length > 0) pageLinks = p; } } catch {}
  try { if (content?.legal_links) { const p = JSON.parse(content.legal_links); if (Array.isArray(p) && p.length > 0) legalLinks = p; } } catch {}
  try { if (content?.support_links) { const p = JSON.parse(content.support_links); if (Array.isArray(p) && p.length > 0) supportLinks = p; } } catch {}
  try { if (content?.social_links) { const p = JSON.parse(content.social_links); if (Array.isArray(p) && p.length > 0) socialLinks = p; } } catch {}

  return (
    <footer className="border border-[var(--color-neutral-200)] py-12 bg-[var(--color-background)] text-[var(--foreground)]">
      <div className="container mx-auto px-7 md:px-20">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-8">
          {/* LEFT */}
          <div className="md:w-1/3">
            <div className="flex items-center gap-4">
              <Image
                src="/htq-logo.png"
                alt="Logo"
                width={60}
                height={60}
              />
              <div className="text-2xl leading-tight font-cormorant font-extrabold">
                <p>{orgLine1}</p>
                <p>{orgLine2}</p>
              </div>
            </div>
            <p className="text-md md:text-lg font-plus-jakarta mt-4 text-[var(--foreground)]">
              {address}
            </p>
          </div>

          {/* RIGHT */}
          <div className="md:w-2/3 flex justify-end gap-10 font-plus-jakarta text-md">
            <div>
              <h4 className="font-bold mb-4">Page</h4>
              <ul className="space-y-2">
                {pageLinks.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:underline text-[var(--foreground)]">{link.label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                {legalLinks.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:underline text-[var(--foreground)]">{link.label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                {supportLinks.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:underline text-[var(--foreground)]">{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 font-plus-jakarta text-[var(--foreground)]">
          <p className="text-base">
            <span className="text-base font-light align-middle relative -top-0.5 mr-1.5">©</span> {copyright.replace(/^©\s*/, '')}
          </p>
          <div className="flex items-center gap-5 mt-2 md:mt-0">
            {socialLinks.length > 0 ? (
              socialLinks.map((s, i) => (
                <a key={i} href={s.url || '#'} className="flex items-center justify-center">
                  {s.platform === 'instagram' ? <FaInstagram className="w-4 h-4 text-[var(--foreground)]" /> :
                   s.platform === 'facebook' ? <FaFacebookSquare className="w-4 h-4 text-[var(--foreground)]" /> :
                   <FaPhoneAlt className="w-4 h-4 text-[var(--foreground)]" />}
                </a>
              ))
            ) : (
              <>
                <a href="#" className="flex items-center justify-center"><FaPhoneAlt className="w-4 h-4 text-[var(--foreground)]" /></a>
                <a href="#" className="flex items-center justify-center"><FaInstagram className="w-4 h-4 text-[var(--foreground)]" /></a>
                <a href="#" className="flex items-center justify-center"><FaFacebookSquare className="w-4 h-4 text-[var(--foreground)]" /></a>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
