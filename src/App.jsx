import { useEffect, useRef, useState } from 'react';
import { createRenderer, DURATION } from './ringScene.js';

export default function App() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const timeRef = useRef(null);
  const statsRef = useRef(null);
  const clock = useRef({ start: performance.now(), started: false });
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const renderer = createRenderer(canvasRef.current);
    const ro = new ResizeObserver(() => renderer.resize());
    ro.observe(canvasRef.current);

    let raf;
    const loop = () => {
      const audio = audioRef.current;
      let t;
      if (clock.current.started && audio && !audio.paused) {
        t = audio.currentTime; // vaqtni musiqadan olamiz — sinxron bo'ladi
      } else {
        t = ((performance.now() - clock.current.start) / 1000) % DURATION;
      }
      const s = renderer.render(t);
      if (timeRef.current) timeRef.current.textContent = `t ${t.toFixed(2)}s`;
      if (statsRef.current) {
        statsRef.current.textContent =
          `rotation ${s.rotation.toFixed(2).padStart(6, '0')}°   glints ${s.glints}\n` +
          `letters ${s.letters.toLocaleString('en-US')}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const start = () => {
    const audio = audioRef.current;
    audio.currentTime = 0;
    clock.current = { start: performance.now(), started: true };
    audio.play().catch(() => {});
    setStarted(true);
  };

  const toggleMute = () => {
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <div className="page">
      <div className="stage">
        <canvas ref={canvasRef} />
        <div className="hud-time">
          <span className="dot" /> <span ref={timeRef}>t 0.00s</span>
        </div>
        <pre className="hud-stats" ref={statsRef} />

        {started ? (
          <div className="controls">
            <button onClick={start}>↺ qaytadan</button>
            <button onClick={toggleMute}>{muted ? '🔇 ovoz yoq' : '🔊 ovoz o‘chir'}</button>
          </div>
        ) : (
          <button className="play" onClick={start}>
            ▶ Boshlash
          </button>
        )}
      </div>
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}music.m4a`} loop preload="auto" />
    </div>
  );
}
