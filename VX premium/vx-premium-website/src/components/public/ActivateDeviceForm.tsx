"use client";

import { FormEvent, useState } from "react";
import { formatDate } from "@/lib/format";

type ActivationResponse = {
  line: {
    id: string;
    name: string;
    status: string;
    expiresAt: string;
  };
  playlist: {
    id: string;
    name: string;
    type: string;
    serverUrl: string;
    username: string;
    password: string;
    m3uUrl: string | null;
    epgUrl: string | null;
  };
  playlists: ActivationResponse["playlist"][];
};

export default function ActivateDeviceForm() {
  const [mac, setMac] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [result, setResult] = useState<ActivationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCopied("");

    try {
      const response = await fetch("/api/player/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mac,
          deviceKey,
          deviceName: deviceName.trim() || "Web activation",
        }),
      });
      const data = (await response.json()) as ActivationResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not activate this device");
      }
      setResult(data);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not activate this device",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Could not copy. Select the text manually.");
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setMac("");
    setDeviceKey("");
    setDeviceName("");
    setShowPassword(false);
    setCopied("");
  }

  if (result) {
    return (
      <div>
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] p-4">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-300 text-sm font-black text-[#04121a]">
            ✓
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">Device activated</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-100/80">
              {result.playlists.length > 1
                ? `${result.playlists.length} playlists are ready for this device.`
                : "The playlist assigned to this MAC address is ready."}{" "}
              Open the player and tap <strong>Check activation</strong>.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Device" value={result.line.name} />
          <Detail
            label="Playlists"
            value={result.playlists.map((playlist) => playlist.name).join(", ")}
          />
          <Detail label="Access expires" value={formatDate(result.line.expiresAt)} />
          <Detail label="MAC address" value={mac.trim().toUpperCase()} />
        </dl>

        {result.playlist.type === "xtream" ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
                  Manual IPTV setup
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Optional. Use these details only if you are adding the Xtream
                  account to another IPTV app.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <CopyRow
                label="Server URL"
                value={result.playlist.serverUrl}
                copied={copied === "server"}
                onCopy={() => copyValue("server", result.playlist.serverUrl)}
              />
              <CopyRow
                label="Username"
                value={result.playlist.username}
                copied={copied === "username"}
                onCopy={() => copyValue("username", result.playlist.username)}
              />
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Password
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-300 hover:text-white"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                      onClick={() => copyValue("password", result.playlist.password)}
                    >
                      {copied === "password" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <p className="mt-1 break-all rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm text-slate-200">
                  {showPassword ? result.playlist.password : "••••••••••••"}
                </p>
              </div>
              {result.playlist.epgUrl ? (
                <CopyRow
                  label="EPG URL"
                  value={result.playlist.epgUrl}
                  copied={copied === "epg"}
                  onCopy={() => copyValue("epg", result.playlist.epgUrl ?? "")}
                />
              ) : null}
            </div>

            <p className="mt-4 text-xs leading-5 text-amber-200/80">
              Keep these details private. Anyone with this MAC address and device
              key can view the assigned playlists.
            </p>
          </div>
        ) : result.playlist.m3uUrl ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
              M3U source
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              This device uses an M3U playlist. The player loads it automatically
              after activation.
            </p>
            <div className="mt-3">
              <CopyRow
                label="M3U URL"
                value={result.playlist.m3uUrl}
                copied={copied === "m3u"}
                onCopy={() => copyValue("m3u", result.playlist.m3uUrl ?? "")}
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          className="btn-secondary mt-5 w-full py-3"
          onClick={reset}
        >
          Activate another device
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
          Device activation
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Connect your player
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter the MAC address and DEVICE KEY shown on your TV. This activates
          the playlists already assigned by your provider.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="admin-label" htmlFor="mac">
            MAC address
          </label>
          <input
            id="mac"
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
          <label className="admin-label" htmlFor="deviceKey">
            Device key
          </label>
          <input
            id="deviceKey"
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
          <p className="mt-2 text-xs text-slate-500">
            6 digits, shown below the MAC address on the player.
          </p>
        </div>

        <div>
          <label className="admin-label" htmlFor="deviceName">
            Device name <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="deviceName"
            className="admin-input"
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
            placeholder="Living room TV"
            autoComplete="off"
            maxLength={80}
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <button className="btn-primary w-full py-3" type="submit" disabled={busy}>
          {busy ? "Activating..." : "Activate device"}
        </button>
      </div>
    </form>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-200">
        {value}
      </dd>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <button
          type="button"
          className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
          onClick={onCopy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1 break-all rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm text-slate-200">
        {value || "Not set"}
      </p>
    </div>
  );
}
