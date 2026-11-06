"""
Records the app's voice pack: every clip of domain/voiceClips.ts `voiceInventory()`,
in the "streamer" voice (Qwen3-TTS Base, cloned from ref-streamer.wav, the Block
Relics "gazole" take). Only what is missing or whose text changed is recorded.

Run on the Windows PC (GPU), from gym-tracker-mobile/:
  C:\\Users\\Djell\\venvs\\qwen3tts\\Scripts\\python.exe scripts\\voice\\build_pack.py
Options:
  --only id,id     record just these clips (into the cache, pack untouched): a sample to listen to
  --redo id,id     record these again with other seeds (after a bad Whisper check)
  --no-encode      record into the cache only

Writes assets/voice/fr/<id>.m4a, manifest.json (id -> text) and clips.ts (the requires).
No pitch or speed change: only trimming and a -1.5 dB peak.
"""
import argparse, json, os, subprocess, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, "..", ".."))
PACK = os.path.join(APP, "assets", "voice", "fr")
CACHE = os.path.abspath(os.path.join(APP, "..", "voice-lab", "clips"))
REF = os.path.join(HERE, "ref-streamer.wav")
REF_TEXT = (
    "L'État a sorti dix millions de barils de sa réserve pour faire baisser le gazole. "
    "Quinze centimes… peut-être. Moi aussi, j'ai une réserve : la TNT. "
    "Tu la poses, t'as trois coups… et boum, tout saute ! Eux, ils promettent. Moi, ça part tout de suite !"
)
SEEDS = [21, 7, 5, 42, 33, 11]
MAX_SEMITONES = 3.0


def inventory():
    out = os.path.join(CACHE, "inventory.json")
    os.makedirs(CACHE, exist_ok=True)
    env = dict(os.environ, VOICE_INVENTORY_OUT=out)
    subprocess.run("npx jest domain/__tests__/voicePack.test.ts", cwd=APP, env=env, shell=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with open(out, encoding="utf-8") as f:
        return json.load(f)


def trim(x, sr, thr=0.01):
    a = np.where(np.abs(x) > thr)[0]
    return x if len(a) == 0 else x[max(0, a[0] - int(0.03 * sr)): a[-1] + int(0.08 * sr)]


def f0_median(x, sr):
    import librosa
    y = librosa.resample(x, orig_sr=sr, target_sr=16000)
    f, voiced, _ = librosa.pyin(y, fmin=70, fmax=500, sr=16000)
    f = f[voiced & ~np.isnan(f)]
    return float(np.median(f)) if len(f) else None


def record(items, seeds_from=0):
    import torch
    from qwen_tts import Qwen3TTSModel
    m = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="cuda:0",
                                      dtype=torch.bfloat16, attn_implementation="sdpa")
    prompt = m.create_voice_clone_prompt(ref_audio=REF, ref_text=REF_TEXT)
    ref, ref_sr = sf.read(REF, dtype="float32")
    ref_f0 = f0_median(ref, ref_sr)
    meta_path = os.path.join(CACHE, "meta.json")
    meta = json.load(open(meta_path, encoding="utf-8")) if os.path.exists(meta_path) else {}
    for n, item in enumerate(items, 1):
        best = None
        for seed in SEEDS[seeds_from:] + SEEDS[:seeds_from]:
            torch.manual_seed(seed)
            w, sr = m.generate_voice_clone(text=item["text"], language="French", voice_clone_prompt=prompt)
            x = trim(np.asarray(w[0], np.float32).reshape(-1), sr)
            x = x / (np.abs(x).max() + 1e-9) * 0.84
            f0 = f0_median(x, sr)
            st = 12 * np.log2(f0 / ref_f0) if f0 else 0.0
            if best is None or abs(st) < abs(best[2]):
                best = (x, sr, st, seed)
            if abs(st) <= MAX_SEMITONES:
                break
        x, sr, st, seed = best
        sf.write(os.path.join(CACHE, item["id"] + ".wav"), x, sr)
        meta[item["id"]] = {"text": item["text"], "seed": seed, "st": round(float(st), 1)}
        print(f"[{n}/{len(items)}] {item['id']} seed {seed} {st:+.1f} st", flush=True)
        if n % 20 == 0:
            json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    return meta


def encode(inv, meta):
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(PACK, exist_ok=True)
    manifest, lines = {}, []
    for item in inv:
        cached = meta.get(item["id"])
        if not cached or cached["text"] != item["text"]:
            continue
        src = os.path.join(CACHE, item["id"] + ".wav")
        dst = os.path.join(PACK, item["id"] + ".m4a")
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", "24000",
                            "-c:a", "aac", "-b:a", "40k", "-movflags", "+faststart", dst], check=True)
        manifest[item["id"]] = item["text"]
        lines.append(f"  '{item['id']}': require('./{item['id']}.m4a'),")
    for name in os.listdir(PACK):
        if name.endswith(".m4a") and name[:-4] not in manifest:
            os.remove(os.path.join(PACK, name))
    json.dump(manifest, open(os.path.join(PACK, "manifest.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2, sort_keys=True)
    with open(os.path.join(PACK, "clips.ts"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// Generated by scripts/voice/build_pack.py — do not edit by hand.\n")
        f.write("/* eslint-disable @typescript-eslint/no-require-imports */\n")
        f.write("export const VOICE_CLIPS: Record<string, number> = {\n" + "\n".join(lines) + "\n};\n")
    print("pack:", len(manifest), "clips", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--redo")
    ap.add_argument("--no-encode", action="store_true")
    a = ap.parse_args()
    inv = inventory()
    by_id = {c["id"]: c for c in inv}
    meta_path = os.path.join(CACHE, "meta.json")
    meta = json.load(open(meta_path, encoding="utf-8")) if os.path.exists(meta_path) else {}
    if a.only:
        record([by_id[i] for i in a.only.split(",")])
        return
    if a.redo:
        meta = record([by_id[i] for i in a.redo.split(",")], seeds_from=1)
    todo = [c for c in inv if meta.get(c["id"], {}).get("text") != c["text"]
            or not os.path.exists(os.path.join(CACHE, c["id"] + ".wav"))]
    print("to record:", len(todo), "of", len(inv), flush=True)
    if todo:
        meta = record(todo)
    if not a.no_encode:
        encode(inv, meta)


if __name__ == "__main__":
    sys.exit(main())
