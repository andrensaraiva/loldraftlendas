import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import type { GameData } from '../data/repository';
import type { PlayerVersion } from '../game/types';
import { PlayerCard } from './PlayerCard';

export function PlayerChoiceCarousel({
  options,
  data,
  selectedId,
  disabled,
  rolling,
  showRatings,
  onPick,
  onDetails,
}: {
  options: PlayerVersion[];
  data: GameData;
  selectedId: string | null;
  disabled: boolean;
  rolling: boolean;
  showRatings: boolean;
  onPick: (player: PlayerVersion) => void;
  onDetails: (player: PlayerVersion) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(options.length - 1, index));
    const item = viewport.current?.children[next] as HTMLElement | undefined;
    item?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveIndex(next);
  }

  function updateFromScroll() {
    const container = viewport.current;
    if (!container) return;
    const items = [...container.children] as HTMLElement[];
    const next = items.reduce(
      (best, item, index) =>
        Math.abs(item.offsetLeft - container.scrollLeft) < best.distance
          ? { index, distance: Math.abs(item.offsetLeft - container.scrollLeft) }
          : best,
      { index: 0, distance: Number.POSITIVE_INFINITY },
    ).index;
    setActiveIndex(next);
  }

  return (
    <section className={`player-carousel ${rolling ? 'is-rolling' : ''}`} aria-label="Lendas disponíveis">
      <div className="carousel-toolbar">
        <span aria-live="polite">
          <b>{activeIndex + 1}</b> de {options.length}
        </span>
        <div>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Ver lenda anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === options.length - 1}
            aria-label="Ver próxima lenda"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        className="player-grid"
        ref={viewport}
        onScroll={updateFromScroll}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(activeIndex - 1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(activeIndex + 1);
          }
        }}
      >
        {options.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            data={data}
            onPick={() => onPick(player)}
            onDetails={() => onDetails(player)}
            index={index}
            selected={selectedId === player.id}
            disabled={disabled}
            showRatings={showRatings}
          />
        ))}
      </div>
      <div className="carousel-dots" aria-hidden="true">
        {options.map((player, index) => (
          <span key={player.id} className={index === activeIndex ? 'active' : ''} />
        ))}
      </div>
    </section>
  );
}
