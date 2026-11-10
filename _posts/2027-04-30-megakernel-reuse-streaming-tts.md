---
layout: distill
title: One Kernel, Two Transformers - What a Text-LLM Megakernel Teaches Us About Streaming TTS
description: Persistent megakernels have made batch-one LLM decoding fast by removing launch overhead. I take one written for a 0.6B text model and reuse it, almost unchanged, for both transformer stages of a streaming codec-language-model TTS system. The speedups are real. So are two quality problems: the model inserts extra words, and it does not stop on its own.
date: 2027-04-30
future: true
htmlwidgets: true

authors:
  - name: Anonymous

bibliography: 2027-04-30-megakernel-reuse-streaming-tts.bib

toc:
  - name: Why batch-one TTS is a launch-overhead problem
  - name: Three facts that make reuse possible
  - name: Results on one RTX 5090
    subsections:
      - name: Where the time goes
      - name: Most of the latency win came from ordinary engineering
  - name: What the quality checks show
  - name: When does this transfer
  - name: Takeaways
---

## Why batch-one TTS is a launch-overhead problem

A voice agent sits there until the slowest model in the cascade spits out its first token. For text-to-speech (TTS), I keep staring at two numbers. *Time to first chunk* (TTFC) is how long before any audio can play. The *real-time factor* (RTF) is compute time per second of audio, and it has to stay well below 1 for gap-free streaming.

Codec-language-model TTS turns both into a decoding problem. Qwen3-TTS-12Hz <d-cite key="qwen3tts"></d-cite> emits one 16-codebook codec frame per 80 ms of audio. A 28-layer *talker* transformer predicts codebook 0, and a 5-layer *code predictor* fills codebooks 1–15, one autoregressive step at a time. At batch size one, every one of those steps is a small memory-bound matrix-vector product. You mostly pay for the gaps between launches. Persistent megakernels fuse a whole forward pass into one launch, which is why people built them for LLM decoding <d-cite key="hazymegakernel,mpk,alpindale"></d-cite>.

So, can a megakernel someone hand-tuned for a *text* model actually help a *speech* model, if I don't write a new kernel?

## Three facts that make reuse possible

I started from an open-source megakernel for Qwen3-0.6B decoding <d-cite key="alpindale"></d-cite>, itself derived from MegaQwen <d-cite key="megaqwen"></d-cite>. It runs 128 persistent blocks of 512 threads with in-kernel grid barriers and reaches about 1,000 tokens/s on an RTX 5090.

Three fairly boring facts made the reuse possible.

1. Same shape. The Qwen3-TTS talker has the same backbone as Qwen3-0.6B <d-cite key="qwen3"></d-cite>: hidden size 1,024, 28 layers, 16 query and 8 KV heads of dimension 128, and MLP width 3,072. Only the vocabulary (3,072 codec ids), an untied output head, and the RoPE base differ. The vocabulary is a build constant, and RoPE tables come from the host.
2. Depth is a runtime argument. The kernel loops `for layer in 0..num_layers`, with `num_layers` passed at launch. The 5-layer code predictor has the same per-layer shape, so the same compiled binary runs it with `num_layers=5`.
3. A tiny input hook. TTS decode steps take a *sum* of 16 codebook embeddings plus a text embedding, so there is no single token id. A three-line expression makes a negative id read a pre-written buffer instead of the embedding table, at the kernel's two entry points. Including an `#ifndef` guard for the vocabulary size, the entire kernel diff is 14 added and 6 removed lines in a ~1,600-line file, comments included.

```c
const __nv_bfloat16 *embed_row =
  (input_token_id >= 0) ? embed_weight + input_token_id * HIDDEN_SIZE
                        : hidden_buffer;
```

## Results on one RTX 5090

| Metric | Result | Target |
|---|---|---|
| TTFC, first complete codec frame | 50.5 ms | < 90 ms |
| TTFC, streaming, mean of 3 runs | 81.6 ms | < 90 ms |
| TTFC, streaming, all runs and text lengths | 78–98 ms | < 90 ms |
| RTF, non-streaming / streaming | 0.175 / 0.234 | < 0.3 |
| Code predictor, PyTorch | 179 ms/frame (RTF ≥ 2.24) | - |
| Code predictor, reused megakernel | 9.8 ms greedy (18×) / 10.9 ms sampled (16.4×) | - |

Batch size 1, bf16, CUDA 12.8, PyTorch 2.7+. Timings use `perf_counter` with `torch.cuda.synchronize()` and exclude warm-up. The baseline RTF comes from the predictor alone (179 ms per 80 ms frame), so it is a lower bound. Some streaming runs went over 90 ms.

The code predictor is what blew the RTF budget. Fifteen dependent steps per frame, and each of those steps was about 70 small PyTorch launches. Once that loop ran on the reused kernel, RTF went from at least 2.24 down to 0.175.

### Where the time goes

{% include figure.liquid path="assets/img/2027-04-30-megakernel-reuse-streaming-tts/frame-budget.png" class="img-fluid" %}
<div class="caption">Steady-state compute per 80 ms frame (≈15 ms). The code predictor's 15 sequential launches still dominate.</div>

Time to the first frame: tokenize 2.3 ms, embedding build 7.2 ms, prefill (8 single-token steps) 24.9 ms, first talker step 3.1 ms, and first code-predictor pass 13.0 ms, for 50.5 ms total.

### Most of the latency win came from ordinary engineering

{% include figure.liquid path="assets/img/2027-04-30-megakernel-reuse-streaming-tts/ttfc-trajectory.png" class="img-fluid" %}
<div class="caption">Streaming TTFC after each change (log scale). Intermediate values are approximate single measurements.</div>

The first streaming number I wrote down was 35,932 ms. Getting it down from there was mostly unglamorous engineering:
- A list became a generator (about 1,096 ms).
- Warming up the vocoder removed an 834 ms first call (about 192 ms).
- Warming up the *sampling* path, not just argmax, removed a 107 ms first predictor call (about 92 ms).
- Batching and caching constant embeddings brought it to 81.6 ms.

That's about 440× if you stay inside the streaming measurement. Stack that same 35,932 ms baseline against the 50.5 ms first-frame number and you can quote 711×, but the two clocks don't share a boundary. I would not lead with 711×.

## What the quality checks show

I scored the five released audio samples on a CPU with Whisper large-v3 <d-cite key="whisper"></d-cite>, UTMOS <d-cite key="utmos"></d-cite>, and TorchAudio-Squim <d-cite key="squim"></d-cite>. I had no reference-implementation audio, so these are absolute numbers.

| Sample | WER | UTMOS (trimmed) | Non-speech tail before trimming |
|---|---|---|---|
| short (5 words) | 0.20 | 3.19 | 2.7 s |
| e2e test (10 words) | 0.40 | 3.54 | 0.5 s |
| medium / long / streaming demo | n/a (input text not saved) | 3.62 / 4.00 / 3.67 | 12.8 / 21.8 / 27.0 s |


<div>
<p><em>short (5 words)</em></p>
<audio controls preload="none" src="{{ 'assets/img/2027-04-30-megakernel-reuse-streaming-tts/demo_short_trimmed.wav' | relative_url }}"></audio>
<p><em>e2e test (10 words)</em></p>
<audio controls preload="none" src="{{ 'assets/img/2027-04-30-megakernel-reuse-streaming-tts/tts_e2e_test_trimmed.wav' | relative_url }}"></audio>
<p><em>medium</em></p>
<audio controls preload="none" src="{{ 'assets/img/2027-04-30-megakernel-reuse-streaming-tts/demo_medium_trimmed.wav' | relative_url }}"></audio>
<p><em>long</em></p>
<audio controls preload="none" src="{{ 'assets/img/2027-04-30-megakernel-reuse-streaming-tts/demo_long_trimmed.wav' | relative_url }}"></audio>
<p><em>streaming demo</em></p>
<audio controls preload="none" src="{{ 'assets/img/2027-04-30-megakernel-reuse-streaming-tts/tts_streaming_demo_trimmed.wav' | relative_url }}"></audio>
</div>


UTMOS is measured on copies trimmed after generation to the end of speech (VAD, 250 ms margin, fade-out). Whole-file UTMOS on the raw files is 1.42–3.58.

Whatever speech is actually in the file sounds okay. Two problems are still sitting there.
- Spurious syllables get inserted ("Hello *Cher*, how are you today?"). Pooled WER is 5/15 on the two known texts, or 3/15 if you don't count Whisper writing "megakernel" as "mega kernel".
- The model doesn't stop. Generation runs to a word-count frame cap, leaving up to 27 s of low-level non-speech, where UTMOS drops to about 1.2–1.5.

I can point at two shortcuts that would explain this. I still haven't run the ablation that would tell me which one, so I'm guessing. One is that the kernel implements 1-D RoPE <d-cite key="roformer"></d-cite>, while the talker is configured for multimodal RoPE (sections [24, 20, 20]) <d-cite key="qwen2vl"></d-cite>. Second, the official generation code suppresses certain special tokens and this implementation doesn't. Either way, end-of-speech isn't reliably emitted.

## When does this transfer

I got away with the reuse because a few conditions happened to line up:
- The auxiliary transformer has the same per-layer shape as the main one.
- Depth is a runtime argument, not a template parameter.
- Everything that differs (input embedding, vocabulary-specific heads, RoPE tables) lives outside the fused layer loop.

If the shapes differ, you need a second build. If the positional scheme differs inside attention, as here, reuse is fast but not exact. Reuse also leaves the sequential structure untouched: 15 dependent predictor launches per frame and 8 single-token prefill steps remain the next targets.

## Takeaways

Before you sit down to write a new kernel, check whether the shapes already match. A text-LLM megakernel might already cover the stages in a speech model.

In this pipeline, warming up the first call and fixing the generator plumbing moved the needle more than the kernel did. Warming up argmax does not warm up sampling. I found that out the annoying way.

Latency is the easy number to brag about. This pipeline hits its latency targets and still doesn't know when to stop talking.
