import Image from 'next/image';
import type { ResultPageCard } from '@/types/result-page';

interface ResultCardProps {
  card: ResultPageCard;
}

export function ResultCard({ card }: ResultCardProps) {
  if (!card.blocks || card.blocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 py-2">
      {card.blocks.map((block) => {
        if (block.block_type === 'heading') {
          return (
            <p
              key={block.id}
              className="lg:text-[22px] text-[16px] text-[#006557] font-bold pb-2 border-b border-neutral-200 w-full"
            >
              {block.content}
            </p>
          );
        }

        if (block.block_type === 'text') {
          return (
            <p
              key={block.id}
              className="text-justify lg:text-[18px] text-[14px]"
            >
              {block.content}
            </p>
          );
        }

        if (block.block_type === 'image' && block.content) {
          return (
            <div key={block.id} className="w-full flex justify-center">
              <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden">
                <Image
                  src={block.content}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized={block.content.startsWith('http')}
                />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
