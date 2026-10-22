import { useEffect, useRef, useState } from "react";
import { PhoneCall, Headset, Play, Pause, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE_LINES = [
  "Good afternoon. This is ProcureCall calling on behalf of Meridian Logistics.",
  "Purchase order 4417 is scheduled for delivery on Friday. Shall I confirm the dock window with your receiving team?",
  "Understood. I have noted the change and updated the vendor record. Anything else I can help with today?",
];

const SAMPLE_DURATION = 28;

function formatTime(seconds: number) {
  return `0:${String(Math.floor(seconds)).padStart(2, "0")}`;
}

function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {[10, 16, 7, 14, 9, 12].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-accent"
          style={{
            height: `${h}px`,
            animation: active ? `editorial-eq 1.1s ease-in-out ${i * 0.12}s infinite alternate` : undefined,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </span>
  );
}

export function VoiceInfrastructureSection() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = null;
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        setElapsed(prev => {
          const next = prev + (now - lastRef.current!) / 1000;
          return next >= SAMPLE_DURATION ? SAMPLE_DURATION : next;
        });
      }
      lastRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  useEffect(() => {
    if (elapsed >= SAMPLE_DURATION) {
      setPlaying(false);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
  }, [elapsed]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      if ("speechSynthesis" in window) window.speechSynthesis.pause();
      return;
    }
    if (elapsed >= SAMPLE_DURATION) {
      setElapsed(0);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    setPlaying(true);
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        SAMPLE_LINES.forEach(line => {
          const utterance = new SpeechSynthesisUtterance(line);
          utterance.rate = 1.02;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        });
      } catch {
        // Simulated playback continues without audio
      }
    }
  };

  const progress = Math.min(elapsed / SAMPLE_DURATION, 1);

  return (
    <section id="voice-infrastructure" className="border-b border-border bg-secondary/40 px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-4 text-xs uppercase text-accent">03 / VeriEdit Voice Infrastructure</p>
          <h2 className="text-3xl font-medium leading-tight sm:text-4xl">Voice agents for the modern contact center.</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Enterprise-grade, low-latency AI phone agents built for modern contact centers and business workflows.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ProcureCall */}
          <article className="flex flex-col justify-between border border-border bg-background p-6 transition-colors hover:border-accent/50 sm:p-8">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <PhoneCall className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <span className="border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">Outbound Voice AI Agent</span>
              </div>
              <h3 className="text-2xl font-medium sm:text-3xl">ProcureCall</h3>
              <p className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">Automated Outbound Calling &amp; Operations</p>
              <ul className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Automated vendor follow-ups, payment reminders, and logistics updates.",
                  "Natural, sub-second latency conversational responses over standard phone lines.",
                  "Seamless integration with enterprise CRM and SIP telephony systems.",
                ].map(point => (
                  <li key={point} className="flex gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild size="lg" className="mt-8 h-12 w-full sm:w-auto">
              <a href="mailto:hello@verieditai.com?subject=ProcureCall%20Demo%20Request">
                Schedule ProcureCall Demo <ArrowUpRight />
              </a>
            </Button>
          </article>

          {/* Servexa */}
          <article className="flex flex-col justify-between border border-border bg-background p-6 transition-colors hover:border-accent/50 sm:p-8">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <Headset className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <span className="border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">Inbound Voice AI Agent</span>
              </div>
              <h3 className="text-2xl font-medium sm:text-3xl">Servexa</h3>
              <p className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">24/7 Intelligent Customer Support</p>
              <ul className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Instant inbound phone support that eliminates hold times and call queues.",
                  "Autonomous customer query resolution, intent recognition, and ticket creation.",
                  "Multi-dialect pipeline roadmap tailored for African enterprise customer service.",
                ].map(point => (
                  <li key={point} className="flex gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild size="lg" variant="outline" className="mt-8 h-12 w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground sm:w-auto">
              <a href="mailto:hello@verieditai.com?subject=Servexa%20Access%20Request">
                Request Servexa Access <ArrowUpRight />
              </a>
            </Button>
          </article>
        </div>

        {/* Audio demo player */}
        <div className="mt-6 border border-border bg-background">
          <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">Experience Sub-Second Voice AI</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">ProcureCall · Live sample · {formatTime(SAMPLE_DURATION)}</p>
          </div>
          <div className="flex items-center gap-5 px-6 py-5">
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? "Pause voice sample" : "Play voice sample"}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>
            <Equalizer active={playing} />
            <div className="min-w-0 flex-1">
              <div className="h-1 w-full bg-border">
                <div className="h-full bg-accent transition-[width] duration-150 ease-linear" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {playing || elapsed > 0 ? "Vendor follow-up call in progress" : "Press play to hear an outbound ProcureCall sample"}
              </p>
            </div>
            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatTime(Math.floor(elapsed))} / {formatTime(SAMPLE_DURATION)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
