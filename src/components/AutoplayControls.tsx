import { FastForward, Pause, Play, Radio } from 'lucide-react';
export type PlaybackMode = 'detailed' | 'quick';
export interface PlaybackSettings {
  mode: PlaybackMode;
  speed: number;
  paused: boolean;
}
export function AutoplayControls({
  settings,
  onChange,
  active = false,
}: {
  settings: PlaybackSettings;
  onChange: (settings: PlaybackSettings) => void;
  active?: boolean;
}) {
  return (
    <div className={`autoplay-controls ${active ? 'is-active' : ''}`}>
      <div className="autoplay-heading">
        <span className="eyebrow">
          {active ? 'TRANSMISSÃO AUTOMÁTICA' : 'COMO VOCÊ QUER ACOMPANHAR?'}
        </span>
        {active && (
          <button
            className="pause-button"
            onClick={() => onChange({ ...settings, paused: !settings.paused })}
          >
            {settings.paused ? <Play size={16} /> : <Pause size={16} />}{' '}
            {settings.paused ? 'Continuar' : 'Pausar'}
          </button>
        )}
      </div>
      <div className="playback-options" role="group" aria-label="Modo de reprodução">
        <button
          aria-pressed={settings.mode === 'detailed'}
          onClick={() => onChange({ ...settings, mode: 'detailed' })}
        >
          <Radio size={20} />
          <span>
            <b>Acompanhar partida</b>
            <small>Acontecimentos e KDA ao longo do jogo</small>
          </span>
        </button>
        <button
          aria-pressed={settings.mode === 'quick'}
          onClick={() => onChange({ ...settings, mode: 'quick' })}
        >
          <FastForward size={20} />
          <span>
            <b>Resultado rápido</b>
            <small>Resultados e avanço automático do torneio</small>
          </span>
        </button>
      </div>
      <div className="playback-speed">
        <span>Velocidade</span>
        <div role="group" aria-label="Velocidade">
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              aria-pressed={settings.speed === speed}
              onClick={() => onChange({ ...settings, speed })}
            >
              {speed}×
            </button>
          ))}
        </div>
        <small>
          {settings.paused && active
            ? 'Reprodução pausada'
            : settings.mode === 'quick'
              ? 'Cada resultado aparece antes de avançar'
              : 'A partida avança lance a lance'}
        </small>
      </div>
    </div>
  );
}
