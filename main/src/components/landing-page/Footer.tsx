import Image from "next/image";
import { FaFacebookSquare, FaPhoneAlt, FaInstagram } from "react-icons/fa";

export default function Footer() {
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
                <p>Yayasan Halaqah</p>
                <p>Tadarus Al-Qur&apos;an</p>
              </div>
            </div>
            <p className="text-md md:text-lg font-plus-jakarta mt-4 text-[var(--foreground)]">
              Foresta Business Loft II Unit 6, RW 7, Lengkong Kulon, Kec. Pagedangan, 
              Kabupaten Tangerang, Banten 15331
            </p>
          </div>

          {/* RIGHT */}
          <div className="md:w-2/3 flex justify-end gap-10 font-plus-jakarta text-md">
            <div>
              <h4 className="font-bold mb-4">Page</h4>
              <ul className="space-y-2">
                <li><a href="https://www.htqfoundation.com/" className="hover:underline text-[var(--foreground)]">Tentang Kami</a></li>
                <li><a href="#" className="hover:underline text-[var(--foreground)]">Konsultasi</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline text-[var(--foreground)]">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:underline text-[var(--foreground)]">Syarat & Ketentuan</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline text-[var(--foreground)]">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 font-plus-jakarta text-[var(--foreground)]">
          <p className="text-base">
            <span className="text-base font-light align-middle relative -top-0.5 mr-1.5">©</span> 2026 HTQ Foundation — Built by OmahTI
          </p>
          <div className="flex items-center gap-5 mt-2 md:mt-0">
            <a
              href="#"
              className="flex items-center justify-center"
            >
              <FaPhoneAlt className="w-4 h-4 text-[var(--foreground)]" />
            </a>
            <a
              href="#"
              className="flex items-center justify-center"
            >
              <FaInstagram className="w-4 h-4 text-[var(--foreground)]" />
            </a>
            <a
              href="#"
              className="flex items-center justify-center"
            >
              <FaFacebookSquare className="w-4 h-4 text-[var(--foreground)]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
