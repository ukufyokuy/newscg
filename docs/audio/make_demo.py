"""示範：用程式從零合成一段 30 秒的土耳其風格新聞配樂（原創，不用任何取樣）。
D 希賈茲音階（D Eb F# G A Bb C）＋氛圍鋪底＋撥弦（類似烏德琴）＋框鼓節奏。"""
import numpy as np, wave, sys
SR = 44100; BPM = 88; BEAT = 60 / BPM; DUR = 32.0
N = int(SR * DUR); rng = np.random.default_rng(7)
mix = np.zeros((N, 2))
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def place(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i >= N: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:j, 0] += sig[: j - i] * l * gain; mix[i:j, 1] += sig[: j - i] * r * gain

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for k in range(len(x)): acc += a * (x[k] - acc); y[k] = acc
    return y

# 1. 氛圍鋪底：D － Gm － Cm － D，每個和弦 4 拍
chords = [[50, 54, 57, 62], [55, 58, 62, 67], [48, 55, 60, 63], [50, 54, 57, 62]]
bar = 4 * BEAT
for rep in range(int(DUR // (bar * 4)) + 1):
    for ci, ch in enumerate(chords):
        t0 = (rep * 4 + ci) * bar
        n = int((bar + 1.0) * SR); t = np.arange(n) / SR
        s = sum(np.sin(2 * np.pi * hz(m) * t * d) for m in ch for d in (0.997, 1.003))
        env = np.minimum(1, t / 1.2) * np.minimum(1, (n / SR - t) / 1.0)
        place(lowpass(s * env, 0.08), t0, pan=0.0, gain=0.035)

# 2. 撥弦旋律（Karplus-Strong，聽起來像烏德琴）
def pluck(freq, dur=1.2):
    n = int(dur * SR); p = int(SR / freq)
    buf = rng.uniform(-1, 1, p); out = np.empty(n)
    for k in range(n):
        out[k] = buf[k % p]; buf[k % p] = 0.5 * (buf[k % p] + buf[(k + 1) % p]) * 0.996
    return out
scale = [62, 63, 66, 67, 69, 70, 72, 74]          # D Eb F# G A Bb C D
melody = [0,1,2,1,0,None,2,3,4,3,2,1,2,None,0,None,
          4,5,4,3,2,3,2,1,0,1,2,3,2,1,0,None]
for rep in range(2):
    for i, deg in enumerate(melody):
        t0 = 8 * BEAT + rep * len(melody) * BEAT / 2 + i * BEAT / 2
        if deg is None or t0 > DUR - 3: continue
        place(pluck(hz(scale[deg])), t0, pan=0.25, gain=0.22)
        place(pluck(hz(scale[deg] - 12), 0.8), t0, pan=-0.2, gain=0.06)

# 3. 框鼓（düm 低音、tek 高音），土耳其常見的 düm-tek-tek-düm-tek 節奏
def dum():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 55 + 45 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
def tek():
    n = int(0.12 * SR); t = np.arange(n) / SR; x = rng.uniform(-1, 1, n)
    return (x - lowpass(x, 0.2)) * np.exp(-t * 40)
pattern = [(0, dum, .8), (1, tek, .35), (1.5, tek, .25), (2, dum, .7), (3, tek, .35)]
for b in range(int(4 * BEAT * 2 // BEAT), int(DUR / BEAT) - 2, 4):
    for off, fn, g in pattern:
        place(fn(), (b + off) * BEAT, pan=-0.05, gain=g * 0.5)

# 淡入淡出、輸出
t = np.arange(N) / SR
mix *= (np.minimum(1, t / 2.5) * np.minimum(1, (DUR - t) / 3.0))[:, None]
mix /= np.max(np.abs(mix)) * 1.12
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
