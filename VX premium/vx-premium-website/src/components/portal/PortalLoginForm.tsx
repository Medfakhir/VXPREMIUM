"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { CaptchaChallenge } from "@/lib/types";

export default function PortalLoginForm() {
  const router = useRouter();
  const [mac, setMac] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [answer, setAnswer] = useState("");
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(true);
  const [error, setError] = useState("");

  const loadCaptcha = useCallback(async () => {
    setLoadingCaptcha(true);
    setAnswer("");
    try {
      const response = await fetch("/api/portal/captcha", {
        cache: "no-store",
      });
      const data = (await response.json()) as CaptchaChallenge & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load the captcha");
      }
      setChallenge(data);
    } catch (caught) {
      setChallenge(null);
      setError(
        caught instanceof Error ? caught.message : "Could not load the captcha",
      );
    } finally {
      setLoadingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/portal/captcha", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as CaptchaChallenge & {
          error?: string;
        };
        if (!active) return;
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load the captcha");
        }
        setChallenge(data);
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        setChallenge(null);
        setError(
          caught instanceof Error ? caught.message : "Could not load the captcha",
        );
      })
      .finally(() => {
        if (active) setLoadingCaptcha(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) {
      setError("Refresh the captcha and try again.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mac,
          deviceKey,
          captchaToken: challenge.token,
          captchaAnswer: answer,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not sign in");
      }
      router.replace("/portal");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in");
      await loadCaptcha();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
          Device account
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Manage your playlists
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Sign in with the MAC address and DEVICE KEY shown on your player. Your
          provider must have created a device account for this MAC first.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="admin-label" htmlFor="portal-mac">
            MAC address
          </label>
          <input
            id="portal-mac"
            className="admin-input font-mono uppercase tracking-wider"
            value={mac}
            onChange={(event) => setMac(event.target.value)}
            placeholder="50:10:00:2F:AB:CF"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>

        <div>
          <label className="admin-label" htmlFor="portal-device-key">
            Device key
          </label>
          <input
            id="portal-device-key"
            className="admin-input font-mono tracking-[0.35em]"
            value={deviceKey}
            onChange={(event) =>
              setDeviceKey(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="257850"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="off"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="admin-label" htmlFor="portal-captcha">
              Human check
            </label>
            <button
              type="button"
              className="text-xs font-semibold text-cyan-300 transition hover:text-cyan-200 disabled:opacity-50"
              onClick={() => void loadCaptcha()}
              disabled={loadingCaptcha || busy}
            >
              {loadingCaptcha ? "Loading..." : "New image"}
            </button>
          </div>
          <div className="mt-1 grid min-h-[88px] place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-2">
            {challenge ? (
              <Image
                src={challenge.image}
                alt="Captcha challenge"
                width={260}
                height={72}
                unoptimized
                className="h-[72px] w-auto rounded-lg"
              />
            ) : (
              <p className="text-sm text-slate-500">Loading captcha...</p>
            )}
          </div>
          <input
            id="portal-captcha"
            className="admin-input mt-2 font-mono uppercase tracking-[0.2em]"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type the characters shown"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <p className="mt-2 text-xs text-slate-500">
            Type the characters in the image. Case does not matter.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          className="btn-primary w-full py-3"
          type="submit"
          disabled={busy || loadingCaptcha || !challenge}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <Link href="/activate" className="text-slate-400 hover:text-white">
            Activate a device
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white">
            Back to home
          </Link>
        </div>
      </div>
    </form>
  );
}
