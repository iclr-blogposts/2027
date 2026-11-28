---
layout: distill
title: What a Scaling Curve Leaves Out Inside a Harness
description: >-
  Language models today rarely run alone; they operate inside agent harnesses with verifiers, retries, feedback loops, and context compaction.
  Combining three recent studies with paired reanalyses of public evaluation records, we show that decisions guided by model-only scaling curves can become suboptimal once a harness is in the loop, and that repeated failure under one protocol does not establish incapability.
  Moving toward compute-optimal scaling laws for harnesses first requires explicit protocol discipline and a clearer separation between model capacity and elicitation.
date: 2027-04-30
future: true
htmlwidgets: true

# Anonymize when submitting
authors:
  - name: Anonymous

# must be the exact same name as your blogpost
bibliography: 2027-04-30-scaling-curve-leaves-out.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Why a harness changes the allocation question
  - name: The same runs, two stories
  - name: "Training: is the curve missing, or just hidden?"
  - name: What does the extra capacity hold?
  - name: "Inference: what can a protocol reveal?"
  - name: What repeated failure hides in frontier runs
  - name: Toward compute-optimal scaling laws for harnesses
  - name: Conclusion

# Post-specific styles: link accent, theorem and definition blocks, open questions,
# Takeaway cards, and the frames of the interactive figures in assets/html/.
_styles: |
  @import url("https://fonts.googleapis.com/css2?family=Geist:wght@600;700&family=Geist+Mono:wght@400;600&display=swap");
  /* Accent (red) */
  d-article {
  	--accent: #c41230;
  }

  html[data-theme="dark"] d-article {
  	--accent: #f27380;
  }

  d-article .theorem-block {
  	position: relative;
  	margin: 2.5rem 0 2rem;
  	padding: 1.6rem 1.5rem 1.25rem;
  	border: 1.5px solid var(--global-text-color);
  }

  d-article .theorem-block > :last-child {
  	margin-bottom: 0;
  }

  d-article .theorem-label {
  	position: absolute;
  	top: -0.75rem;
  	left: 1rem;
  	padding: 3px 10px;
  	background: var(--accent);
  	color: var(--global-bg-color);
  	font-family: "Geist Mono", ui-monospace, monospace;
  	font-size: 12px;
  	font-weight: 600;
  	line-height: 1.5;
  	letter-spacing: 0.06em;
  	text-transform: uppercase;
  }

  d-article {
  	counter-reset: open-question;
  }

  d-article .open-question {
  	--rule-width: 2px;
  	position: relative;
  	margin: 2.5rem 0;
  	padding-left: 24px;
  	counter-increment: open-question;
  }

  d-article .open-question::before {
  	content: "";
  	position: absolute;
  	top: 0;
  	bottom: 0;
  	left: 0;
  	width: var(--rule-width);
  	background: linear-gradient(to bottom, var(--accent) 48px, var(--global-divider-color) 48px);
  	transform-origin: left center;
  }

  d-article .open-question-label {
  	display: block;
  	width: fit-content;
  	margin-bottom: 6px;
  	color: var(--accent);
  	font-family: "Geist Mono", ui-monospace, monospace;
  	font-size: 12px;
  	font-weight: 600;
  	line-height: 1.5;
  	letter-spacing: 0.08em;
  	text-transform: uppercase;
  	transform-origin: left center;
  }

  d-article .open-question-label::after {
  	content: " · " counter(open-question, decimal-leading-zero);
  }

  d-article .open-question h3 {
  	margin-top: 0;
  	color: var(--global-text-color);
  	}

  d-article .open-question > p:last-child {
  	position: relative;
  	margin-bottom: 0;
  	font-weight: 600;
  }

  d-article .open-question > p:last-child::before {
  	content: "?";
  	position: absolute;
  	top: 0.2em;
  	left: -34px; width: 22px;
  	height: 22px;
  	border: 2px solid var(--accent);
  	border-radius: 50%;
  	background: var(--global-bg-color);
  	color: var(--accent);
  	font-family: "Geist Mono", ui-monospace, monospace;
  	font-size: 13px;
  	line-height: 18px;
  	text-align: center;
  }

  d-article .open-question::before,
  d-article .open-question-label,
  d-article .open-question > p:last-child::before {
  	transition: transform 0.25s ease;
  }

  d-article .open-question:hover::before {
  	transform: scaleX(1.5);
  }

  d-article .open-question:hover .open-question-label {
  	transform: scale(1.06);
  }

  d-article .open-question:hover > p:last-child::before {
  	transform: scale(1.18);
  }

  @media (prefers-reduced-motion: reduce) {
  	d-article .open-question::before,
  	d-article .open-question-label,
  	d-article .open-question > p:last-child::before {
  		transition: none;
  	}
  }

  d-article blockquote.idea {
  	position: relative;
  	margin: 2.5rem 0;
  	padding: 1.6rem 1.75rem 1.5rem 2rem;
  	border: 1px solid var(--global-divider-color);
  	/* The theme gives every d-article blockquote an !important colored left rule and italic grey text. */
  	border-left: 1px solid var(--global-divider-color) !important;
  	background: var(--global-card-bg-color);
  	box-shadow: 0 6px 22px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  	color: var(--global-text-color);
  	font-style: normal;
  	font-family: "Geist Mono", ui-monospace, monospace;
  	font-size: 0.94em;
  	line-height: 1.8;
  	outline: none;
  	transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.28s ease;
  }

  d-article blockquote.idea p {
  	color: inherit;
  	font-size: inherit;
  	line-height: inherit;
  }

  d-article blockquote.idea > :last-child {
  	margin-bottom: 0;
  }

  d-article blockquote.idea::before,
  d-article blockquote.idea::after {
  	content: "";
  	position: absolute;
  	width: 120px;
  	height: 64px;
  	pointer-events: none;
  }

  d-article blockquote.idea::before {
  	top: -1px;
  	left: -1px;
  	border-top: 3px solid var(--global-text-color);
  	border-left: 3px solid var(--global-text-color);
  	--bulb-gap: linear-gradient(to right, transparent 20px, #000 20px), linear-gradient(to bottom, transparent 28px, #000 28px);
  	-webkit-mask-image: var(--bulb-gap);
  	mask-image: var(--bulb-gap);
  }

  d-article blockquote.idea::after {
  	right: -1px;
  	bottom: -1px;
  	border-right: 3px solid var(--global-text-color);
  	border-bottom: 3px solid var(--global-text-color);
  }

  d-article blockquote.idea .idea-bulb {
  	position: absolute;
  	top: -24px;
  	left: -24px;
  	width: 48px;
  	height: 48px;
  }

  d-article blockquote.idea .idea-bulb-art {
  	transform-box: fill-box;
  	transform-origin: center;
  	transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  d-article blockquote.idea .idea-fill,
  d-article blockquote.idea .idea-rays {
  	opacity: 0;
  	transition: opacity 0.3s ease;
  }

  d-article blockquote.idea:hover,
  d-article blockquote.idea:focus {
  	transform: scale(1.018);
  	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  d-article blockquote.idea:hover .idea-bulb-art,
  d-article blockquote.idea:focus .idea-bulb-art {
  	transform: rotate(-8deg) scale(1.08);
  }

  d-article blockquote.idea:hover .idea-fill,
  d-article blockquote.idea:hover .idea-rays,
  d-article blockquote.idea:focus .idea-fill,
  d-article blockquote.idea:focus .idea-rays {
  	opacity: 1;
  }

  @media (max-width: 768px) {
  	d-article blockquote.idea {
  		margin-inline-start: 12px;
  		padding: 1.5rem 1.25rem 1.25rem 1.5rem;
  	}
  }

  html[data-theme="dark"] d-article blockquote.idea {
  	box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
  }

  html[data-theme="dark"] d-article blockquote.idea:hover,
  html[data-theme="dark"] d-article blockquote.idea:focus {
  	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  }

  @media (prefers-reduced-motion: reduce) {
  	d-article blockquote.idea,
  	d-article blockquote.idea .idea-bulb-art {
  		transition: none;
  	}

  	d-article blockquote.idea:hover,
  	d-article blockquote.idea:focus,
  	d-article blockquote.idea:hover .idea-bulb-art,
  	d-article blockquote.idea:focus .idea-bulb-art {
  		transform: none;
  	}
  }

  /* Collapsible companion checks: plain disclosure in body text, without the theme's tinted code-block box. */
  d-article details {
  	padding: 0;
  	border-radius: 0;
  	background-color: transparent;
  }

  d-article details summary {
  	color: var(--global-text-color);
  	cursor: pointer;
  }

  /* The theme keeps figure captions at 60% black in dark mode, where they are nearly invisible. */
  html[data-theme="dark"] d-article figcaption {
  	color: var(--global-text-color-light);
  }

  /* Interactive figures: each is its own page in an iframe, which sizes itself to fit (see vis/embed.js). */
  d-article .vis-figure iframe {
  	display: block;
  	width: 100%;
  	border: 0;
  	scroll-margin-top: 5rem;
  }

  /* An inline link that echoes a figure button and switches that figure's setting (see resource-competition/link.js). */
  d-article a.vis-inline-control {
  	--vis-ink: #1e1e1e;
  	--vis-paper: var(--global-bg-color);
  	display: inline-block;
  	padding: 2px 7px;
  	border: 1.5px solid var(--vis-ink);
  	color: var(--vis-ink) !important;
  	font-family: "Geist Mono", ui-monospace, monospace;
  	font-size: 11px;
  	line-height: 1.5;
  	letter-spacing: 0.05em;
  	vertical-align: baseline;
  	white-space: nowrap;
  	text-decoration: none;
  	cursor: pointer;
  }

  html[data-theme="dark"] d-article a.vis-inline-control {
  	--vis-ink: #e6e6e6;
  }

  d-article a.vis-inline-control:hover,
  d-article a.vis-inline-control:focus,
  d-article a.vis-inline-control:active {
  	background: var(--vis-ink);
  	color: var(--vis-paper) !important;
  }

  d-article a.vis-inline-control:focus-visible {
  	outline: 2px solid var(--vis-ink);
  	outline-offset: 3px;
  }
---

Language models today rarely run on their own. In practice, they live inside agent harnesses with scaffolds, tools, retries, verifiers, feedback loops, and context compaction. That raises a practical question: once a model sits inside a harness, do we need to rethink how we allocate compute?

Existing scaling laws were not built for that combined system. Recent work on repeated sampling <d-cite key="brown2024monkeys"></d-cite> and compute-optimal test-time scaling <d-cite key="snell2025scaling,wu2025inference"></d-cite> treats inference much like training: fix the protocol and the capability being measured, then ask how to spend compute efficiently. When the setup is simple and held constant, that works well. Inside a real harness, however, a choice that looks optimal under a model-only scaling curve can quickly become suboptimal once the verification budget, feedback loop, or metric changes.

Before we can move toward compute-optimal scaling laws for harnesses, we have to ask a prior question: what system is a scaling curve actually measuring? A curve describes how observed performance changes. It does not, by itself, explain why. A flat curve might mean that the model lacks something in its weights, that the harness cannot draw out what is there, or that the metric no longer registers useful progress <d-cite key="schaeffer2023mirage,wu2025ushaped"></d-cite>.

### Three useful distinctions

We use three terms throughout this post to keep the different possibilities apart:

| Term                     | What we mean                                                                      |
| ------------------------ | --------------------------------------------------------------------------------- |
| **Capacity**             | What the weights can retain or represent.                                         |
| **Elicitation**          | What an inference setup or harness draws out of a fixed model.                    |
| **Observed performance** | What a particular model, harness, budget, metric, and evaluator produce together. |

The distinction matters because we observe performance directly, but usually have to infer what limited it.

## Why a harness changes the allocation question

Before turning to the broader literature, we can check directly on public evaluation data whether a model-only scaling conclusion holds up once a simple harness is added.

The [MultiPL-E](https://huggingface.co/datasets/bigcode/MultiPL-E-completions/blob/999e282fd3cad526dfe850e093ca671ed3dc5b43/README.md) archive <d-cite key="cassano2023multipl"></d-cite> stores candidate Python programs and unit-test outcomes for StarCoderBase 15B across five training checkpoints (20% through 100% of training). Prompts, unit tests, and generation length caps stay fixed across all checkpoints. For each of the 161 HumanEval tasks, we compute the exact probability that at least one of $$k$$ candidates drawn without replacement passes the tests, then average across tasks.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/checkpoint-sampling.png" class="img-fluid" alt="BigCode checkpoint and sampling curves" caption="Figure 1: On the same StarCoderBase 15B checkpoints and 161 HumanEval tasks, allowing more verified candidates increases the measured gain from training (a) and flips which sampling temperature performs better (b). Shaded bands show 95% paired task-level bootstrap intervals." %}

Figure 1a follows the same training run at temperature 0.2 under three evaluation budgets. Moving from 20% to 100% of training raises the solve rate by 11.4 percentage points when the harness checks one candidate, but by 18.1 points when it checks ten. The exact same training progress looks 6.7 points more valuable simply because the harness can generate and verify more answers.

Figure 1b reads along the candidate budget $$k$$: points below zero favor temperature 0.2, and points above zero favor 0.8. At the final checkpoint, temperature 0.2 beats 0.8 by 5.9 points at $$k = 1$$. At the same candidate budget of $$k = 10$$, however, 0.8 leads by 9.3 points, so the temperature chosen from a single-attempt curve becomes suboptimal under the verifier harness.

<blockquote class="idea" tabindex="0">
	<svg class="idea-bulb" viewBox="-2 -6 52 52" aria-hidden="true">
		<defs>
			<path id="idea-1-glass" d="M24 6C15 6 10 13 10 19.5C10 25 13 28 16 31C17.5 32.5 18 34 18 36L30 36C30 34 30.5 32.5 32 31C35 28 38 25 38 19.5C38 13 33 6 24 6Z"/>
			<clipPath id="idea-1-clip"><use href="#idea-1-glass"/></clipPath>
			<filter id="idea-1-crayon" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="4" result="grainNoise"/>
				<feColorMatrix in="grainNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="grain"/>
				<feComposite in="SourceGraphic" in2="grain" operator="in" result="textured"/>
				<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="wobble"/>
				<feDisplacementMap in="textured" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
			</filter>
		</defs>
		<g class="idea-bulb-art">
			<g class="idea-rays" stroke="#F2A900" stroke-width="2.6" stroke-linecap="round" filter="url(#idea-1-crayon)">
				<path d="M24 -5L24 0.5M7 1.5L10.8 5.6M41 1.5L37.2 5.6M0 18.5L5 19M48 18.5L43 19"/>
			</g>
			<use href="#idea-1-glass" fill="#fff"/>
			<g class="idea-fill" clip-path="url(#idea-1-clip)">
				<g filter="url(#idea-1-crayon)">
					<use href="#idea-1-glass" fill="#FFE27A"/>
					<path d="M7 15L16 5M7 23L24 4M8 31L31 5M12 36L37 8M16 39L40 13M22 39L41 20M28 39L41 27" stroke="#F5B400" stroke-width="2.6" stroke-linecap="round" fill="none"/>
				</g>
			</g>
			<path d="M20 27L22 21L24 27L26 21L28 27" fill="none" stroke="#FFBE1A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" filter="url(#idea-1-crayon)"/>
			<g fill="none" stroke="#1e1e1e" stroke-linejoin="round" stroke-linecap="round">
				<use href="#idea-1-glass" stroke-width="2.2"/>
				<path d="M20 27L22 21L24 27L26 21L28 27" stroke-width="1.7"/>
				<rect x="18" y="37.5" width="12" height="3.5" rx="1" fill="#fff" stroke-width="1.7"/>
				<rect x="19.5" y="42" width="9" height="3" rx="1.5" fill="#fff" stroke-width="1.7"/>
			</g>
		</g>
	</svg>
	<p>Takeaway: a decision guided by a single-attempt, model-only curve, whether estimating how much extra training is worth or picking a sampling temperature, becomes suboptimal once a verifier harness is in the loop.</p>
</blockquote>

This check changes only one piece of a harness: how many candidates get verified. To see why scaling curves can mislead even more sharply in full frontier setups, we look next at a benchmark study where the runs stay fixed while the axis and metric change.

## The same runs, two stories

What happens if we give models far more inference compute than benchmarks usually allow? McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite> increased token budgets by one to three orders of magnitude, compacted long contexts, and allowed repeated answer submissions within each trajectory. The same runs then offered two different views of what extra compute buys.

### Story one: more tokens, little change on HealthBench

Measured against total tokens, the results look very different across tasks. On FrontierMath, increasing the budget from 1M to 10M tokens adds 11.7 points on average across models. On HealthBench, going from 16k to 10M adds just 0.3 points on its native scale, with curves already flat within the usual 16k budget.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/motivating_story1.png" class="img-fluid" alt="Score against total tokens on FrontierMath and HealthBench" caption='Figure 2: FrontierMath continues to improve at large token budgets, while HealthBench is nearly flat. (Source: McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite>)' %}

The tempting conclusion is that extra thinking helps on math, but on HealthBench, the model already knows what it knows.

### Story two: a few more submissions help

But each run contained repeated submissions. What if we looked at those instead of tokens? The authors did this using a different metric: they converted HealthBench scores into pass or fail at the median score of 0.38. From the first submission to the highest level reached, the fraction of trajectories passing rises by 14.2 percentage points. Ninety percent of that gain comes within the first three submissions.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/motivating_story2.png" class="img-fluid" alt="HealthBench pass rate across repeated submissions" caption='Figure 3: On HealthBench, most of the gain across repeated submissions arrives within the first three. (Source: McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite>)' %}

The 0.3-point and 14.2-percentage-point gains are not directly comparable. They use different metrics, and that is exactly the point. One view asks how the native score changes with tokens. The other asks whether a trajectory ever crosses a chosen threshold as it submits again.

The findings can coexist: retries help early, while a much longer trajectory adds little. Consistent with this pattern, 92% to 100% of unsolved trajectories across FrontierMath, HealthBench, and SWE-Bench Pro ended because models kept repeating essentially the same answer, rather than exhausting their budgets. We do not know whether the early gains fit within 16k tokens, because the paper does not report tokens per submission.

<blockquote class="idea" tabindex="0">
	<svg class="idea-bulb" viewBox="-2 -6 52 52" aria-hidden="true">
		<defs>
			<path id="idea-2-glass" d="M24 6C15 6 10 13 10 19.5C10 25 13 28 16 31C17.5 32.5 18 34 18 36L30 36C30 34 30.5 32.5 32 31C35 28 38 25 38 19.5C38 13 33 6 24 6Z"/>
			<clipPath id="idea-2-clip"><use href="#idea-2-glass"/></clipPath>
			<filter id="idea-2-crayon" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="4" result="grainNoise"/>
				<feColorMatrix in="grainNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="grain"/>
				<feComposite in="SourceGraphic" in2="grain" operator="in" result="textured"/>
				<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="wobble"/>
				<feDisplacementMap in="textured" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
			</filter>
		</defs>
		<g class="idea-bulb-art">
			<g class="idea-rays" stroke="#F2A900" stroke-width="2.6" stroke-linecap="round" filter="url(#idea-2-crayon)">
				<path d="M24 -5L24 0.5M7 1.5L10.8 5.6M41 1.5L37.2 5.6M0 18.5L5 19M48 18.5L43 19"/>
			</g>
			<use href="#idea-2-glass" fill="#fff"/>
			<g class="idea-fill" clip-path="url(#idea-2-clip)">
				<g filter="url(#idea-2-crayon)">
					<use href="#idea-2-glass" fill="#FFE27A"/>
					<path d="M7 15L16 5M7 23L24 4M8 31L31 5M12 36L37 8M16 39L40 13M22 39L41 20M28 39L41 27" stroke="#F5B400" stroke-width="2.6" stroke-linecap="round" fill="none"/>
				</g>
			</g>
			<path d="M20 27L22 21L24 27L26 21L28 27" fill="none" stroke="#FFBE1A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" filter="url(#idea-2-crayon)"/>
			<g fill="none" stroke="#1e1e1e" stroke-linejoin="round" stroke-linecap="round">
				<use href="#idea-2-glass" stroke-width="2.2"/>
				<path d="M20 27L22 21L24 27L26 21L28 27" stroke-width="1.7"/>
				<rect x="18" y="37.5" width="12" height="3.5" rx="1" fill="#fff" stroke-width="1.7"/>
				<rect x="19.5" y="42" width="9" height="3" rx="1.5" fill="#fff" stroke-width="1.7"/>
			</g>
		</g>
	</svg>
	<p>Takeaway: the runs did not change, but the axis and metric did. “More tokens barely help” and “a few more submissions help” can both describe the same data. Neither alone tells us what limits performance.</p>
</blockquote>

This leaves us with a useful suspicion: an observed curve is not a direct picture of the model. Before returning to inference and harnesses, we take a deliberate step back into pretraining for two reasons. First, pretraining offers the clearest precedent for why a scaling law can disappear when the experimental setup is under-tuned. Second, it makes the other half of a flat curve concrete: how a model can genuinely lack a capability in its weights, rather than merely failing to show it under one protocol.

## Training: is the curve missing, or just hidden?

The appeal of scaling laws is that small experiments might guide expensive decisions <d-cite key="gadre2025overtraining"></d-cite>. Yet laws fitted on models below 100M parameters had been reported to break down, casting doubt on how much small-scale research could tell us. Lourie et al. <d-cite key="lourie2026smallscale"></d-cite> argue that the relationship extends down to 4M parameters. What hides it is insufficient hyperparameter tuning.

### Spend compute to reveal the curve

Figure 4 shows the law becoming clearer as tuning increases: four configurations per scale leave it obscured, while 256 yield an accurate fit. Under-tuned runs sit above the best achievable loss by varying amounts, adding noise that can overwhelm the relationship we want to measure.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/lourie_fig3.png" class="img-fluid" alt="Scaling law fits under increasing tuning budgets" caption='Figure 4: Increasing the number of tuned configurations reveals a scaling relationship that sparse tuning can hide. (Source: Lourie et al. <d-cite key="lourie2026smallscale"></d-cite>)' %}

Small models are particularly vulnerable to this problem. Only 7.9% of sampled configurations at 4M parameters fall within 0.1 bits per character of the best loss, compared with 28.1% at 134M. As models grow, fewer hyperparameter directions strongly affect loss, and good configurations become easier to find. This is the surface over training choices such as learning rate and batch size, not the loss landscape over model weights.

<figure class="vis-figure">
  <iframe
    src="{{ 'assets/html/2027-04-30-scaling-curve-leaves-out/hyperparameter-landscape.html' | relative_url }}"
    title="Interactive figure: hyperparameter landscape"
    frameborder="0"
    scrolling="no"
    width="100%"
    height="420"
  ></iframe>
  <figcaption class="caption">Figure 5: Drag the slider from small to large. As five of the six directions become less sensitive, the hatched good region widens, and more of the same 40 sampled configurations land inside it. The bars show how far each direction can move before leaving the region.</figcaption>
</figure>

This gives tuning compute a specific role: it makes small experiments more informative. The proposed workflow is to tune competing designs thoroughly at several small scales, then compare their predicted losses at larger scales. Choosing the large model’s hyperparameters is a separate step, supported by transfer rules such as μP <d-cite key="yang2021tensor"></d-cite>.

Two recent papers pursue this goal differently: Baron et al. <d-cite key="baron2026improving"></d-cite> make small training runs more predictive through hyperparameter transfer and ensembling, while van Adrichem et al. <d-cite key="vanadrichem2026hinted"></d-cite> use graded hints to expose downstream trends hidden near zero accuracy.

<blockquote class="idea" tabindex="0">
	<svg class="idea-bulb" viewBox="-2 -6 52 52" aria-hidden="true">
		<defs>
			<path id="idea-3-glass" d="M24 6C15 6 10 13 10 19.5C10 25 13 28 16 31C17.5 32.5 18 34 18 36L30 36C30 34 30.5 32.5 32 31C35 28 38 25 38 19.5C38 13 33 6 24 6Z"/>
			<clipPath id="idea-3-clip"><use href="#idea-3-glass"/></clipPath>
			<filter id="idea-3-crayon" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="4" result="grainNoise"/>
				<feColorMatrix in="grainNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="grain"/>
				<feComposite in="SourceGraphic" in2="grain" operator="in" result="textured"/>
				<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="wobble"/>
				<feDisplacementMap in="textured" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
			</filter>
		</defs>
		<g class="idea-bulb-art">
			<g class="idea-rays" stroke="#F2A900" stroke-width="2.6" stroke-linecap="round" filter="url(#idea-3-crayon)">
				<path d="M24 -5L24 0.5M7 1.5L10.8 5.6M41 1.5L37.2 5.6M0 18.5L5 19M48 18.5L43 19"/>
			</g>
			<use href="#idea-3-glass" fill="#fff"/>
			<g class="idea-fill" clip-path="url(#idea-3-clip)">
				<g filter="url(#idea-3-crayon)">
					<use href="#idea-3-glass" fill="#FFE27A"/>
					<path d="M7 15L16 5M7 23L24 4M8 31L31 5M12 36L37 8M16 39L40 13M22 39L41 20M28 39L41 27" stroke="#F5B400" stroke-width="2.6" stroke-linecap="round" fill="none"/>
				</g>
			</g>
			<path d="M20 27L22 21L24 27L26 21L28 27" fill="none" stroke="#FFBE1A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" filter="url(#idea-3-crayon)"/>
			<g fill="none" stroke="#1e1e1e" stroke-linejoin="round" stroke-linecap="round">
				<use href="#idea-3-glass" stroke-width="2.2"/>
				<path d="M20 27L22 21L24 27L26 21L28 27" stroke-width="1.7"/>
				<rect x="18" y="37.5" width="12" height="3.5" rx="1" fill="#fff" stroke-width="1.7"/>
				<rect x="19.5" y="42" width="9" height="3" rx="1.5" fill="#fff" stroke-width="1.7"/>
			</g>
		</g>
	</svg>
	<p>Takeaway: a scaling curve is partly a measurement achievement. Before trusting a small-model comparison, we may need to spend compute finding out whether it was measured well. Otherwise, we might mistake a design that is easier to tune for one that is better.</p>
</blockquote>

### From a reliable curve to a useful measure

Even a well-measured curve has limits. Extrapolating farther amplifies uncertainty, so recovering a scaling law does not make distant predictions reliable <d-cite key="lourie2025unreliable"></d-cite>. As the authors put it, “the scaling law is there, but the statistical power is not”.

There is also a limit to what the curve measures. With pretraining data held fixed, loss can serve as a useful proxy for downstream capability <d-cite key="mayilvahanan2025line"></d-cite>. Change the data mixture, and the same loss cannot imply the same capability. This makes the approach useful for comparing model designs, but less straightforward for comparing the data choices we train them on.

Suppose we tune everything properly and recover a reliable curve. We now have a better estimate of average loss, but do we know what the larger model learned that the smaller one did not? A rare task contributes little to that average, so losing it may barely move the curve. We turn next to Huang et al. <d-cite key="huang2026larger"></d-cite> to look at what extra capacity holds that an average can hide.

## What does the extra capacity hold?

A small model can sometimes learn a task on its own, yet fail to learn it alongside other tasks. When many tasks share the same weights, which ones get room?

Huang et al. <d-cite key="huang2026larger"></d-cite> pretrain OLMo models from 4M to 4B parameters, injecting synthetic tasks at controlled frequencies. On common tasks, models of different sizes reach similar task loss at the same general language-modeling loss. On sufficiently rare tasks, the paths split: larger models improve while smaller ones plateau. At matched average loss, what sits underneath can still differ.

### When more data is not enough

Before asking what extra capacity buys, we need to distinguish two reasons a larger model might do better.

<div class="theorem-block" markdown="1">
<div class="theorem-label">Definition</div>

**Two kinds of scaling.**

**Learnable via data scaling.** the smaller model needs more data, but can eventually match the larger model’s loss.

**Learnable via model scaling.** under the same training distribution, a gap remains even with unlimited data.

</div>

The second case is the crux of capacity limits. To explain how it can arise, Huang et al. analyze a mixture of linear regression tasks, controlling task frequency, complexity, and model width.

### Limited slots, ranked by utility

Each task consists of feature directions. A simple task concentrates its importance in a few directions; a complex task needs many. All tasks share a representation of width $$N$$, and the objective weights their losses by how often they appear.

<div class="theorem-block" markdown="1">
<div class="theorem-label">Theorem 3</div>

**Features are learned in order of utility.** A direction $$j$$ of task $$k$$ has utility

$$
u_{k,j} = \pi_k \lambda_{k,j},
$$

where $$\pi_k$$ is the task’s frequency and $$\lambda_{k,j}$$ is the direction’s importance. A width-$$N$$ model minimizing the mixture loss keeps the $$N$$ directions with the highest utility.

</div>

The ranking is over directions, not whole tasks. A rare, complex task needs many directions, and its low frequency pushes their utilities down. Much of what it needs may fall outside the available capacity.

Imagine a mixture dominated by basic English, with a tiny amount of quantum mechanics. In the toy model, if enough English directions offer greater reductions in total loss, a ten-slot model spends all ten on English. More data from the same mixture does not change that ranking. A thousand-slot model can cover those directions and still have room for others. What width buys is the ability to give up less.

<figure class="vis-figure">
  <iframe
    id="resource-competition"
    name="resource-competition"
    src="{{ 'assets/html/2027-04-30-scaling-curve-leaves-out/resource-competition.html' | relative_url }}"
    title="Interactive figure: resource competition between a small and a large model"
    frameborder="0"
    scrolling="no"
    width="100%"
    height="600"
  ></iframe>
  <figcaption class="caption">Figure 6 (Interactive visualization): The same stream of signals goes into a small and a large model, and each keeps the highest-utility features that fit in its slots. The small model sees quantum physics but keeps none of it. Turn on interference to make learning gradual: updates then wear down other features sharing a slot.</figcaption>
</figure>

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/huang_fig2.png" class="img-fluid" alt="Task loss against width and frequency" caption='Figure 7: Increasing width unlocks lower-frequency tasks (a), closely following the theoretical loss predictions across task distributions (b). (Source: Huang et al. <d-cite key="huang2026larger"></d-cite>)' %}

Each task is individually learnable in this setting. The limitation arises when they compete for a shared representation: the best solution for the mixture may leave a task out.

### Learning a signal, then losing it

What does this competition look like during training? A rare example can teach the model something, but common examples arrive before the next rare one.

In the toy analysis, common tasks exert pressure through what remains unlearned, their residual. Larger models fit them more fully, leaving weaker gradients. Smaller models retain larger residuals, so common-task updates can overwhelm a rare signal. Figure 8 shows the resulting cycle: a small model gains signal at each rare injection and loses it between injections; a larger model retains it and builds on it. To explore this effect, return to [Figure 6](#resource-competition) and turn on <a class="vis-inline-control" href="{{ 'assets/html/2027-04-30-scaling-curve-leaves-out/resource-competition.html#interference' | relative_url }}" target="resource-competition" aria-label="Return to Figure 6 and turn on interference">+ INTERFERENCE</a>.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/huang_fig4.png" class="img-fluid" alt="Rare-signal retention over training in a small and a large model" caption="Figure 8: In the toy analysis, a small model repeatedly gains and loses a rare signal, while a larger model retains it between injections." %}

The OLMo experiments show a similar pattern. Larger models learn rarer injected tasks and represent more of their features. Ordinary-text gradients also conflict less with the rare-task direction in the 1B model than in the 20M model. These controlled tasks support the account, without establishing it for the full complexity of natural language.

<blockquote class="idea" tabindex="0">
	<svg class="idea-bulb" viewBox="-2 -6 52 52" aria-hidden="true">
		<defs>
			<path id="idea-4-glass" d="M24 6C15 6 10 13 10 19.5C10 25 13 28 16 31C17.5 32.5 18 34 18 36L30 36C30 34 30.5 32.5 32 31C35 28 38 25 38 19.5C38 13 33 6 24 6Z"/>
			<clipPath id="idea-4-clip"><use href="#idea-4-glass"/></clipPath>
			<filter id="idea-4-crayon" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="4" result="grainNoise"/>
				<feColorMatrix in="grainNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="grain"/>
				<feComposite in="SourceGraphic" in2="grain" operator="in" result="textured"/>
				<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="wobble"/>
				<feDisplacementMap in="textured" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
			</filter>
		</defs>
		<g class="idea-bulb-art">
			<g class="idea-rays" stroke="#F2A900" stroke-width="2.6" stroke-linecap="round" filter="url(#idea-4-crayon)">
				<path d="M24 -5L24 0.5M7 1.5L10.8 5.6M41 1.5L37.2 5.6M0 18.5L5 19M48 18.5L43 19"/>
			</g>
			<use href="#idea-4-glass" fill="#fff"/>
			<g class="idea-fill" clip-path="url(#idea-4-clip)">
				<g filter="url(#idea-4-crayon)">
					<use href="#idea-4-glass" fill="#FFE27A"/>
					<path d="M7 15L16 5M7 23L24 4M8 31L31 5M12 36L37 8M16 39L40 13M22 39L41 20M28 39L41 27" stroke="#F5B400" stroke-width="2.6" stroke-linecap="round" fill="none"/>
				</g>
			</g>
			<path d="M20 27L22 21L24 27L26 21L28 27" fill="none" stroke="#FFBE1A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" filter="url(#idea-4-crayon)"/>
			<g fill="none" stroke="#1e1e1e" stroke-linejoin="round" stroke-linecap="round">
				<use href="#idea-4-glass" stroke-width="2.2"/>
				<path d="M20 27L22 21L24 27L26 21L28 27" stroke-width="1.7"/>
				<rect x="18" y="37.5" width="12" height="3.5" rx="1" fill="#fff" stroke-width="1.7"/>
				<rect x="19.5" y="42" width="9" height="3" rx="1.5" fill="#fff" stroke-width="1.7"/>
			</g>
		</g>
	</svg>
	<p>Takeaway: the optimum and the dynamics give us two views of the same competition. One tells us which features earn room; the other shows how a signal can be learned and then lost. Together, they explain why more training on the same mixture may not be enough.</p>
</blockquote>

### Can we change what gets room?

A natural follow-up is whether we can simply show the small model more of the rare task.

In the toy model, yes, but at a price. Increasing its frequency or loss weight raises its utility. Once a direction enters the top $$N$$, it displaces another. A curriculum may help the signal survive between appearances, but it does not create more capacity. The implication is direct: **for a small model, choosing a data mixture is also choosing what to give up.**

There is a reason to remain cautious, especially after the previous section. The OLMo experiments share one hyperparameter setting across sizes, while Lourie et al. <d-cite key="lourie2026smallscale"></d-cite> show that small models are particularly sensitive to tuning. Some observed failures could therefore involve under-tuning as well as capacity competition. That is a cross-paper question, not a settled explanation.

<section class="open-question" markdown="1">
<div class="open-question-label">Open question</div>

### Could greater reach come with losses elsewhere?

In Huang et al.’s toy model, raising one task’s priority displaces other features when capacity is fixed. Harmon et al. <d-cite key="harmon2026forgetting"></d-cite> give this question an empirical handle: instead of comparing only average scores before and after post-training, they track sample-wise transitions, counting correct answers that turn incorrect and vice versa. Across model pairs and training settings, post-training produces both forgetting and backward transfer that an aggregate score conflates.

This leaves a question open: when a correct answer turns incorrect after post-training, is the capability actually gone, or has it only become harder to reach? One way to find out is to check whether alternative prompts or larger inference budgets bring the lost behavior back. If they do, part of what looks like forgetting may be an elicitation shift, something a harness that samples or searches more widely could recover. If they do not, the regression is more likely to persist no matter how the model is used. Whichever turns out to be true, the sample-wise view already points to a pattern we will meet again below: averages can hide task-level flips.

</section>

### Back to inference

Everything so far has been about what makes it into the weights. Yet earlier we saw a HealthBench curve that stayed flat as the token budget grew. At that point, we could only name two possibilities: either the model had reached its limit, or the protocol gave it no useful way to spend more compute.

Huang et al. <d-cite key="huang2026larger"></d-cite> give the first possibility a concrete shape. A model can fall short not because a task is impossible, but because the features it needs never earned room in the weights. If that is the case, more tokens alone are unlikely to help. Closing the gap requires changing the model, training objective, or data distribution, or supplying what is missing through retrieval or tools.

The second possibility is the mirror image: the weights hold something useful, but a single attempt under a fixed budget does not draw it out. From the outside, the two can produce the same flat curve. So the next section asks the inverse of the previous one: with the weights fixed, what changes when we change the inference protocol?

## Inference: what can a protocol reveal?

McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite> explore this by giving models more tokens, repeated submissions, independent attempts, and correctness feedback. These interventions cannot tell us exactly what the weights lack, but they help separate different ways a system can get stuck.

### More time, or another attempt?

FrontierMath, HLE, and the cyber tasks improve well beyond their typical token budgets. Other benchmarks gain little. Rather than treating either pattern as a final limit, we can change how the same total budget is allocated.

One option is to extend a single trajectory. Another is to split the budget across independent attempts. The tradeoff is between **depth**, allowing an attempt to search and build up state, and **width**, allowing different attempts to explore different paths <d-cite key="zeng2025revisiting"></d-cite>.

Ten attempts overtake one at about 23k total tokens on HealthBench, compared with 9M to 10M on FrontierMath (Figure 9). The wide variation suggests that attempts need enough depth to become useful before splitting the budget pays off.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/mcfadyen_fig4.png" class="img-fluid" alt="Token budget at which ten attempts overtake one, per benchmark" caption='Figure 9: The token budget at which ten attempts overtake one varies widely across benchmarks. (Source: McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite>)' %}

These are not deployment-ready thresholds. The authors reconstruct shorter attempts by truncating long trajectories, and pass@k counts success whenever any attempt succeeds <d-cite key="schaeffer2026generative"></d-cite>. A real system must also identify the successful answer; an LLM selector recovers only part of that potential gain.

HealthBench now looks more consistent with our earlier look at the same runs. Repeated submissions helped early, and independent attempts also become useful at a small budget. Both suggest that one much longer trajectory is a poor use of additional compute on this benchmark.

### What feedback adds

The authors also compare a simple acknowledgment, “Your answer has been saved”, with oracle feedback telling the model whether its answer was correct.

On HLE, iteration adds 25.2 points with feedback versus 9.3 without it. SWE-Bench Pro shows a smaller benefit; FrontierMath, TerminalBench, and HealthBench show no statistically significant effect.

<blockquote class="idea" tabindex="0">
	<svg class="idea-bulb" viewBox="-2 -6 52 52" aria-hidden="true">
		<defs>
			<path id="idea-5-glass" d="M24 6C15 6 10 13 10 19.5C10 25 13 28 16 31C17.5 32.5 18 34 18 36L30 36C30 34 30.5 32.5 32 31C35 28 38 25 38 19.5C38 13 33 6 24 6Z"/>
			<clipPath id="idea-5-clip"><use href="#idea-5-glass"/></clipPath>
			<filter id="idea-5-crayon" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="4" result="grainNoise"/>
				<feColorMatrix in="grainNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="grain"/>
				<feComposite in="SourceGraphic" in2="grain" operator="in" result="textured"/>
				<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="wobble"/>
				<feDisplacementMap in="textured" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
			</filter>
		</defs>
		<g class="idea-bulb-art">
			<g class="idea-rays" stroke="#F2A900" stroke-width="2.6" stroke-linecap="round" filter="url(#idea-5-crayon)">
				<path d="M24 -5L24 0.5M7 1.5L10.8 5.6M41 1.5L37.2 5.6M0 18.5L5 19M48 18.5L43 19"/>
			</g>
			<use href="#idea-5-glass" fill="#fff"/>
			<g class="idea-fill" clip-path="url(#idea-5-clip)">
				<g filter="url(#idea-5-crayon)">
					<use href="#idea-5-glass" fill="#FFE27A"/>
					<path d="M7 15L16 5M7 23L24 4M8 31L31 5M12 36L37 8M16 39L40 13M22 39L41 20M28 39L41 27" stroke="#F5B400" stroke-width="2.6" stroke-linecap="round" fill="none"/>
				</g>
			</g>
			<path d="M20 27L22 21L24 27L26 21L28 27" fill="none" stroke="#FFBE1A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" filter="url(#idea-5-crayon)"/>
			<g fill="none" stroke="#1e1e1e" stroke-linejoin="round" stroke-linecap="round">
				<use href="#idea-5-glass" stroke-width="2.2"/>
				<path d="M20 27L22 21L24 27L26 21L28 27" stroke-width="1.7"/>
				<rect x="18" y="37.5" width="12" height="3.5" rx="1" fill="#fff" stroke-width="1.7"/>
				<rect x="19.5" y="42" width="9" height="3" rx="1.5" fill="#fff" stroke-width="1.7"/>
			</g>
		</g>
	</svg>
	<p>Takeaway: feedback helps when it changes what the model tries next. Knowing an answer is wrong can guide further search, but it does not supply what is missing. Tokens, restarts, and feedback therefore offer different things: more time on a path, another path, and information about whether a path worked.</p>
</blockquote>

### What a different model changes

Some tasks remain unsolved under all the tested protocols. Across model generations, the authors distinguish **reach**, tasks solved in at least two independent trajectories; **reliability**, consistency on reachable tasks; and **efficiency**, tokens required.

Newer models improve mainly in reach and reliability. They solve tasks older models never solved within the tested budgets, and succeed more consistently on reachable ones. Efficiency gains are uneven, and many differences become clear only at large budgets. HealthBench is again an exception, with little generational improvement.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/mcfadyen_fig2a.png" class="img-fluid" alt="Reach, reliability, and efficiency across model generations" caption='Figure 10: Newer model generations mainly improve reach and reliability, while efficiency gains are less consistent. (Source: McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite>)' %}

This resembles Huang et al.’s <d-cite key="huang2026larger"></d-cite> distinction between needing more training and needing a different model, but only at the level of the pattern. A finite-budget failure is not an infinite-compute limit. Nor is a newer model necessarily larger: post-training and other changes may explain the gains.

One further result matters here: newer models benefit less from parallel sampling on every benchmark tested. On FrontierMath, under the same capped total budget, the newest models perform worse when that budget is split across ten attempts than when it is spent on one. The paper reports this without establishing why.

<section class="open-question" markdown="1">
<div class="open-question-label">Open question</div>

### Can progress survive from one step to the next?

During a long inference trajectory, context grows and eventually gets compacted <d-cite key="zhou2026mem1"></d-cite>. Does earlier progress, including failed approaches and unfinished plans, remain usable for the next step? Newer models’ smaller gains from parallel sampling could reflect better retention within one trajectory, or simply less diversity across restarts. Separating the two is an open measurement question, and a reminder that context management is part of the harness rather than neutral plumbing.

</section>

## What repeated failure hides in frontier runs

Earlier, BigCode showed how a verifier harness changes the measured return to training and flips which sampling setting looks optimal. Here we turn to a second question on public frontier data: when a model fails repeatedly under one protocol, does that mean it cannot solve the task?

To check this alongside two companion cases on ceilings and floors, we reanalyze public evaluation records where the exact same tasks are tested under two protocols. The table below summarizes all four public checks in this post (including BigCode from Figure 1). Confidence intervals in the plots use 5,000 paired task-level bootstrap draws.

| Study     | Data source                                                                                                                               | Models                            | Matched tasks               | What changes                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------- | --------------------------------------- |
| BigCode   | [MultiPL-E](https://huggingface.co/datasets/bigcode/MultiPL-E-completions/blob/999e282fd3cad526dfe850e093ca671ed3dc5b43/README.md)        | StarCoderBase 15B (5 checkpoints) | 161 HumanEval               | Candidates checked ($$k$$), temperature |
| UK AISI   | [EvalEval snapshot](https://huggingface.co/datasets/evaleval/card_backend/tree/9a6e4b2dc5d8cfab766f1672df32a9bad15b40d8/warehouse/latest) | Opus 4, 4.5, 4.6; GPT-5.4         | 69 HLE, 86 Terminal-Bench   | Feedback and compaction                 |
| Writer    | [EvalEval](https://huggingface.co/datasets/evaleval/EEE_datastore/tree/b76922a292d2dfbac32e90616a256c46e031f5cf/data/math-mc)             | GPT-OSS 20B, 120B                 | 4,914 MATH-MC, 1,319 GSM-MC | Reasoning effort                        |
| VITAL Lab | [EvalEval](https://huggingface.co/datasets/evaleval/EEE_datastore/tree/b76922a292d2dfbac32e90616a256c46e031f5cf/data/fibble2_arena)       | Haiku 4.5, Sonnet 4.6             | 30 Fibble words             | False clues per guess                   |

### UK AISI: turning consistent failures into successes

The September 29 EvalEval snapshot preserves 36,289 UK AISI trajectory summaries from the runs behind McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite>. Each record stores a run’s total tokens and final outcome, not the tokens used before the first correct answer, so we cannot compare matched token budgets from the snapshot alone.

Instead, we match the model, scaffold, and other recorded settings across two protocols: no answer feedback and no compaction, versus feedback and compaction enabled. Restricting to tasks shared across models and conditions leaves 69 tasks on HLE and 86 on Terminal-Bench. Within each task, we average repeated runs so every task carries equal weight.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/protocol-effects.png" class="img-fluid" alt="UK AISI paired protocol effects" caption="Figure 11: Paired protocol comparison on shared UK AISI tasks. Enabling feedback and compaction raises mean solve rates strongly on HLE and unevenly on Terminal-Bench (a, b). On the 69 shared HLE tasks, Opus 4.5 moves from zero successes to at least one on 18 tasks, with zero moving the other way (c)." %}

Panels (a) and (b) show how differently benchmarks respond. On HLE, turning on feedback and compaction lifts all three Opus checkpoints by 23 to 31 points, taking Opus 4.5 from 29.1% to 60.5%. On Terminal-Bench, Opus 4.6 barely moves while GPT-5.4 gains 7 points.

Panel (c) looks underneath the average for Opus 4.5 on HLE. On 18 of the 69 tasks, every recorded attempt failed under the first protocol, yet at least one succeeded once feedback and compaction were enabled. Zero tasks switched in the opposite direction, and matching attempt counts within each task gives the same result. Feedback and compaction change together in this export, so we cannot separate their individual effects. Even so, the conclusion at the task level is clear: failing every attempt under one protocol did not mean the model lacked the capability to solve those tasks.

### Two additional checks: ceilings and floors

Protocol choices can also erase differences between models by pushing them into a ceiling or a floor. Both companion checks are included below.

<details markdown="1">
<summary>Writer (GPT-OSS 20B vs. 120B): higher reasoning effort erases a size gap on MATH-MC</summary>

Writer evaluated GPT-OSS 20B and 120B at low and high reasoning effort on the same 4,914 MATH-MC questions and 1,319 GSM-MC questions. On MATH-MC, the larger model leads by 133 questions at low effort, but both models approach 99% accuracy at high effort and the lead shrinks to a single question. On GSM-MC, the gap stays small under both settings (four questions versus six). Actual compute is not matched across settings.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/writer-effort.png" class="img-fluid" alt="Writer reasoning effort" caption="Figure 12: On MATH-MC (a), raising reasoning effort collapses the 120B model’s lead from 133 questions to 1 as both models approach the ceiling. On GSM-MC (b), the gap changes little." %}

</details>

<details markdown="1">
<summary>VITAL Lab (Fibble): a harder feedback rule makes two models indistinguishable</summary>

In the archived Fibble runs, Haiku 4.5 and Sonnet 4.6 each played the same 30 word-guessing targets with up to eight guesses per word. When each guess received one false clue, Haiku solved nine words and Sonnet solved zero. With two false clues per guess, both models solved zero, hitting the floor of the test where scores can no longer tell them apart.

{% include figure.liquid path="assets/img/2027-04-30-scaling-curve-leaves-out/fibble-feedback.png" class="img-fluid" alt="VITAL Lab Fibble feedback" caption="Figure 13: Increasing the number of false clues per guess from one to two drops Haiku 4.5 from nine solved words to zero, erasing the gap with Sonnet 4.6." %}

</details>

<blockquote class="idea" tabindex="0">
	<svg class="idea-bulb" viewBox="-2 -6 52 52" aria-hidden="true">
		<defs>
			<path id="idea-6-glass" d="M24 6C15 6 10 13 10 19.5C10 25 13 28 16 31C17.5 32.5 18 34 18 36L30 36C30 34 30.5 32.5 32 31C35 28 38 25 38 19.5C38 13 33 6 24 6Z"/>
			<clipPath id="idea-6-clip"><use href="#idea-6-glass"/></clipPath>
			<filter id="idea-6-crayon" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="4" result="grainNoise"/>
				<feColorMatrix in="grainNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="grain"/>
				<feComposite in="SourceGraphic" in2="grain" operator="in" result="textured"/>
				<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="wobble"/>
				<feDisplacementMap in="textured" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
			</filter>
		</defs>
		<g class="idea-bulb-art">
			<g class="idea-rays" stroke="#F2A900" stroke-width="2.6" stroke-linecap="round" filter="url(#idea-6-crayon)">
				<path d="M24 -5L24 0.5M7 1.5L10.8 5.6M41 1.5L37.2 5.6M0 18.5L5 19M48 18.5L43 19"/>
			</g>
			<use href="#idea-6-glass" fill="#fff"/>
			<g class="idea-fill" clip-path="url(#idea-6-clip)">
				<g filter="url(#idea-6-crayon)">
					<use href="#idea-6-glass" fill="#FFE27A"/>
					<path d="M7 15L16 5M7 23L24 4M8 31L31 5M12 36L37 8M16 39L40 13M22 39L41 20M28 39L41 27" stroke="#F5B400" stroke-width="2.6" stroke-linecap="round" fill="none"/>
				</g>
			</g>
			<path d="M20 27L22 21L24 27L26 21L28 27" fill="none" stroke="#FFBE1A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" filter="url(#idea-6-crayon)"/>
			<g fill="none" stroke="#1e1e1e" stroke-linejoin="round" stroke-linecap="round">
				<use href="#idea-6-glass" stroke-width="2.2"/>
				<path d="M20 27L22 21L24 27L26 21L28 27" stroke-width="1.7"/>
				<rect x="18" y="37.5" width="12" height="3.5" rx="1" fill="#fff" stroke-width="1.7"/>
				<rect x="19.5" y="42" width="9" height="3" rx="1.5" fill="#fff" stroke-width="1.7"/>
			</g>
		</g>
	</svg>
	<p>Takeaway: holding the models and tasks fixed while changing a single harness rule changes what we measure, whether that is the return to training, the preferred sampler, the gap between models, or whether a task looks solvable at all.</p>
</blockquote>

## Toward compute-optimal scaling laws for harnesses

Taken together, these papers and checks point to two conclusions that sit upstream of fitting new inference scaling laws.

### 1. Align the protocol and measurement discipline first

Training scaling laws became useful because the field built experimental discipline around them. As Lourie et al. <d-cite key="lourie2026smallscale"></d-cite> show, even a standard pretraining law disappears when small models are under-tuned. At inference time, the system is wider: a harness bundles a scaffold, a candidate budget, a sampler, a verifier or selector, a feedback rule, and a context-compaction policy.

Before we can extend compute-optimal inference scaling <d-cite key="snell2025scaling,wu2025inference"></d-cite> to agent harnesses, we need agreement on what must be held fixed and reported. That means stating the full harness alongside the model, comparing depth, width, and feedback on matched total compute and shared tasks, and looking below average scores to track task-level transitions <d-cite key="huang2026larger,harmon2026forgetting"></d-cite>. Fitting response curves within an explicit protocol, and testing whether small-budget fits predict larger-budget runs in that same harness, is a firmer starting point than assuming one law covers arbitrary setups.

### 2. For safety evaluation, failing to elicit is not proof of incapability

This measurement problem matters most when an evaluation is supposed to rule out a capability. In safety testing, the question is rarely whether a model fails inside one default scaffold, but whether the capability is absent from the weights.

Huang et al. <d-cite key="huang2026larger"></d-cite> and McFadyen et al. <d-cite key="mcfadyen2026inference"></d-cite> show from opposite sides why a flat curve or a zero score is ambiguous: it can reflect missing capacity or weak elicitation. The UK AISI check makes that concrete on real frontier runs. Eighteen tasks that Opus 4.5 failed on every recorded attempt became solvable once feedback and compaction were turned on, with zero tasks moving the other way.

HLE is a general benchmark, so this does not estimate how often safety evaluations miss dangerous capabilities. What it does show is an asymmetry in what an evaluation can establish. A successful run proves that the capability is there; a failed run proves only that it did not appear under that protocol. Concluding that a model cannot do something requires much stronger elicitation evidence than a single fixed harness provides.

## Conclusion

Scaling curves are often read as direct properties of a model. The evidence across training, capacity, inference, and our paired checks points to something narrower and more useful: a scaling curve belongs to a model, a harness, and a measurement choice acting together.

On public evaluation records, changing only the verification budget altered the measured return to training and reversed which sampling temperature performed best. Small-scale pretraining laws looked broken until models were properly tuned. Models at matched average loss still diverged on rare tasks. HealthBench looked flat against tokens while showing early gains across repeated submissions. And enabling feedback and compaction turned 18 consistently failed HLE tasks into solvable ones.

Rethinking compute allocation in the presence of harnesses therefore starts with measurement discipline: naming the protocol, matching tasks and budgets, and looking past averages. Until we can tell whether a flat curve reflects the weights or the harness, we cannot trust a model-only curve to tell us either how to spend compute or what a model is unable to do.
