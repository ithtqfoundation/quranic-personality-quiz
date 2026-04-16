import React from 'react';
import { Check } from 'lucide-react';
import { ResultCard } from './result-card';
import type { ResultPageCard } from '@/types/result-page';

// ── Personality sub-cards ─────────────────────────────────────────────────────

function PersonalityDescription({ description }: { description: string }) {
  return (
    <div className="pt-9.25">
      <div className="lg:text-[18px] text-[14px] flex flex-col gap-4 items-start">
        <p className="lg:text-[22px] text-[16px] text-[#006557] font-bold pb-2 border-b border-neutral-200 w-full">
          Gambaran Umum
        </p>
        <p className="text-justify text-center lg:text-[18px] text-[14px]">{description}</p>
      </div>
    </div>
  );
}

function PersonalityStrengths({ strengths }: { strengths: string[] }) {
  return (
    <div className="rounded-[10px] shadow-sm bg-neutral-50 px-5.5 pt-7 pb-13 flex-1">
      <p className="font-bold lg:text-[22px] text-[16px] pb-[9px] border-b border-neutral-200 w-full text-[#006557]">
        Kekuatan Utama
      </p>
      <div className="w-full flex flex-col gap-2 mt-2">
        {strengths.length > 0 ? (
          strengths.map((s, i) => (
            <span key={i}>
              <Check className="inline-block mr-2 text-tosca" size={24} />
              <span>{s}</span>
              {i !== strengths.length - 1 && <span>, </span>}
            </span>
          ))
        ) : (
          <p />
        )}
      </div>
    </div>
  );
}

function PersonalityChallenges({ challenges }: { challenges: string[] }) {
  return (
    <div className="rounded-[10px] shadow-sm bg-neutral-50 px-5.5 pt-7 pb-13 flex-1">
      <p className="font-bold lg:text-[22px] text-[16px] pb-[9px] border-b border-neutral-200 w-full text-[#006557]">
        Tantangan yang Perlu Disadari
      </p>
      <div className="w-full flex flex-col gap-2 mt-2">
        {challenges.length > 0 ? (
          challenges.map((c, i) => (
            <span key={i}>
              <div className="inline-block mr-2 bg-neutral-200-400 rounded-full w-[15px] h-[15px]" />
              <span>{c}</span>
              {i !== challenges.length - 1 && <span>, </span>}
            </span>
          ))
        ) : (
          <p />
        )}
      </div>
    </div>
  );
}

// ── Fallback order ketika cards kosong / gagal fetch ──────────────────────────
const FALLBACK_CARDS: ResultPageCard[] = [
  { id: -1, card_type: 'personality_description', order_number: 1, is_active: true, title: 'Gambaran Umum', blocks: [] },
  { id: -2, card_type: 'personality_strengths',   order_number: 2, is_active: true, title: 'Kekuatan Utama', blocks: [] },
  { id: -3, card_type: 'personality_challenges',  order_number: 3, is_active: true, title: 'Tantangan', blocks: [] },
];

// ── Main export ───────────────────────────────────────────────────────────────
interface HasilJuzProps {
  result?: any;
  cards: ResultPageCard[];
}

export default function HasilJuz({ result, cards }: HasilJuzProps) {
  if (!result) return null;

  const personality = result.personality ?? {};
  const name: string = personality.name ?? 'Hasil';
  const tagline: string = personality.tagline ?? '';
  const description: string = personality.description ?? 'Deskripsi tidak tersedia.';
  const strengths: string[] = personality.strengths ?? [];
  const challenges: string[] = personality.challenges ?? [];

  const activeCards: ResultPageCard[] = cards.length > 0 ? cards : FALLBACK_CARDS;

  const renderCard = (card: ResultPageCard, idx: number): React.ReactNode => {
    if (!card.is_active) return null;

    if (card.card_type === 'personality_description') {
      return <PersonalityDescription key={card.id} description={description} />;
    }

    if (card.card_type === 'personality_strengths') {
      const nextCard = activeCards[idx + 1];
      const nextIsChallenge = nextCard?.card_type === 'personality_challenges' && nextCard.is_active;
      if (nextIsChallenge) {
        return (
          <div key={card.id} className="flex lg:flex-row flex-col items-stretch justify-center gap-[25px]">
            <PersonalityStrengths strengths={strengths} />
            <PersonalityChallenges challenges={challenges} />
          </div>
        );
      }
      return (
        <div key={card.id} className="flex lg:flex-row flex-col items-stretch justify-center gap-[25px]">
          <PersonalityStrengths strengths={strengths} />
        </div>
      );
    }

    if (card.card_type === 'personality_challenges') {
      const prevCard = activeCards[idx - 1];
      if (prevCard?.card_type === 'personality_strengths' && prevCard.is_active) return null;
      return (
        <div key={card.id} className="flex lg:flex-row flex-col items-stretch justify-center gap-[25px]">
          <PersonalityChallenges challenges={challenges} />
        </div>
      );
    }

    if (card.card_type === 'custom') {
      return <ResultCard key={card.id} card={card} />;
    }

    return null;
  };

  return (
    <div id="hasil-juz-root" className="flex flex-col lg:gap-8 gap-4 mt-4.5">
      {/* Header card — hard-coded, tidak masuk sistem card */}
      <div>
        <div
          className="relative bg-neutral-50 text-neutral-25 rounded-[10px] bg-no-repeat lg:bg-[length:100.94%_376.958%] lg:bg-[-6px_-13px] bg-[length:100%_auto] bg-[0px_0px] md:bg-[length:100%_250%] md:bg-[0px_-10px] bg-center before:absolute before:inset-0 before:bg-[rgba(61,159,142,0.20)] before:rounded-[10px] before:z-0 px-4 pt-20 pb-6 xxs:pt-32 xxs:pb-8 xs:px-8 xs:pt-34 xs:pb-8 md:px-40 md:py-8 lg:px-50 lg:py-12 xl:pt-17 xl:pb-16 xl:pl-81.5 xl:pr-99"
          style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.20), rgba(0,0,0,0.10)), url(/image/juz-result-bg.webp)' }}
        >
          <h4 className="relative z-10 font-bold lg:text-[38px] text-[26px]">{name}</h4>
          <p className="relative z-10 lg:text-[22px] text-[16px]">{tagline}</p>
        </div>

        {/* Card-driven content */}
        {activeCards.map((card, idx) => renderCard(card, idx))}
      </div>
    </div>
  );
}
