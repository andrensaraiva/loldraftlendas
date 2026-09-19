import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Crown,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { OnboardingStatus } from '../game/onboarding';

const slides = [
  {
    eyebrow: '1 · MONTE SUA EQUIPE',
    title: 'Cinco escolhas. Uma nova história.',
    text: 'Sorteie uma edição e uma região para cada posição. Você recebe três candidatos válidos e pode gastar até três trocas durante todo o draft.',
    note: 'TOP → JG → MID → ADC → SUP',
    icon: <Sparkles aria-hidden="true" />,
  },
  {
    eyebrow: '2 · LEIA AS CARTAS',
    title: 'Cada lenda traz cinco jogos.',
    text: 'Os campeões seguem uma ordem fixa: G1 no primeiro jogo, G2 no segundo e assim por diante. Toda nova série recomeça no G1.',
    note: 'No Almanaque, os números aparecem só depois do resultado.',
    icon: <BookOpen aria-hidden="true" />,
  },
  {
    eyebrow: '3 · DEFINA UM PLANO',
    title: 'Sua identidade vale a campanha inteira.',
    text: 'Depois do draft, escolha Agressão, Teamfight, Controle/Pick ou Escala. O plano combina com as tags da equipe e ajusta a força de cada composição.',
    note: 'O relatório separa cálculo probabilístico e narrativa do KDA.',
    icon: <Gamepad2 aria-hidden="true" />,
  },
  {
    eyebrow: '4 · SOBREVIVA AO SUÍÇO',
    title: 'Três vitórias classificam.',
    text: 'Três derrotas eliminam. Confrontos comuns são MD1; classificação e eliminação são MD3. Favoritos têm vantagem, mas zebras acontecem.',
    note: 'Acompanhe cada lance ou use o resultado rápido.',
    icon: <ShieldCheck aria-hidden="true" />,
  },
  {
    eyebrow: '5 · CONQUISTE O WORLDS',
    title: 'Quartas, semifinal e final.',
    text: 'Os playoffs são MD5 e avançam automaticamente. No encerramento, veja os relatórios, percorra sua jornada e compartilhe o resultado.',
    note: 'Pausar, continuar depois e reabrir Como jogar estão sempre disponíveis.',
    icon: <Crown aria-hidden="true" />,
  },
] as const;

export default function OnboardingCarousel({
  years,
  regionGroups,
  onFinish,
}: {
  years: number;
  regionGroups: number;
  onFinish: (status: OnboardingStatus, slideIndex: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const pointerStart = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    dialog.current?.showModal();
    const frame = window.requestAnimationFrame(() => nextButton.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function finish(status: OnboardingStatus) {
    onFinish(status, index);
  }

  function previous() {
    setIndex((current) => Math.max(0, current - 1));
  }

  function next() {
    if (index === slides.length - 1) finish('completed');
    else setIndex((current) => Math.min(slides.length - 1, current + 1));
  }

  return (
    <dialog
      ref={dialog}
      className="onboarding-dialog"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
      onCancel={(event) => {
        event.preventDefault();
        finish('skipped');
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) finish('skipped');
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') previous();
        if (event.key === 'ArrowRight') next();
        if (event.key === 'Home') setIndex(0);
        if (event.key === 'End') setIndex(slides.length - 1);
      }}
    >
      <div
        className="onboarding-panel"
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const distance = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (distance > 45) previous();
          if (distance < -45) next();
        }}
      >
        <button
          type="button"
          className="icon-button onboarding-close"
          onClick={() => finish('skipped')}
          aria-label="Fechar e pular apresentação"
        >
          <X />
        </button>
        <div className="onboarding-progress" aria-label={`Etapa ${index + 1} de ${slides.length}`}>
          {slides.map((item, slideIndex) => (
            <button
              type="button"
              key={item.eyebrow}
              className={slideIndex === index ? 'active' : ''}
              onClick={() => setIndex(slideIndex)}
              aria-label={`Ir para etapa ${slideIndex + 1}`}
              aria-current={slideIndex === index ? 'step' : undefined}
            />
          ))}
        </div>
        <div className="onboarding-slide" aria-live="polite">
          <span className="onboarding-icon">{slide.icon}</span>
          <span className="eyebrow green">{slide.eyebrow}</span>
          <h2 id="onboarding-title">{slide.title}</h2>
          <p id="onboarding-description">{slide.text}</p>
          <strong>{slide.note}</strong>
        </div>
        <p className="onboarding-data-note">
          {years} {years === 1 ? 'edição' : 'edições'} · {regionGroups}{' '}
          {regionGroups === 1 ? 'grupo' : 'grupos'} de draft · ratings estimados
        </p>
        <div className="onboarding-actions">
          <button type="button" className="text-button" onClick={() => finish('skipped')}>
            Pular
          </button>
          <div>
            <button
              type="button"
              className="secondary onboarding-previous"
              onClick={previous}
              disabled={index === 0}
              aria-label="Etapa anterior"
            >
              <ArrowLeft size={18} /> Anterior
            </button>
            <button ref={nextButton} type="button" className="primary" onClick={next}>
              {index === slides.length - 1 ? 'Começar a jogar' : 'Próxima'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <small className="onboarding-keyboard-hint">Use ← → para navegar</small>
      </div>
    </dialog>
  );
}
