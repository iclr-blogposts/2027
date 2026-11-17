---
layout: distill
title: "Wrong Clips, Right Categories: What Cross-Modal Alignment Actually Learns"
description: Rotating audio and video embeddings into alignment boosts cross-modal event recognition from 36.7% to 90.5%. Yet shuffling almost every audio-video pair within its category gives nearly the same score (90.1%), while holding out categories breaks transfer completely.
date: 2027-04-30
future: true
htmlwidgets: true
_styles: >
  :root { --story-muted: #526573; --story-surface: #fbfaf6; --story-line: #d8dfdf; --story-blue: #2266a8; --story-blue-tint: #f1f5f7; --story-orange: #ad481d; --story-orange-tint: #fcf1e9; --story-ink: #183249; }
  html[data-theme=dark] { --story-muted: #b5c4ce; --story-surface: #17212b; --story-line: #496174; --story-blue: #82b8ef; --story-blue-tint: #1e3346; --story-orange: #f3a77c; --story-orange-tint: #3b2a24; --story-ink: #edf2f7; }
  .alignment-frame { width: 100%; height: 780px; border: 0; display: block; margin: 18px 0; }
  .frame-mapping-categories { height: 820px; }
  .signal-sum { display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch; gap: 16px; margin: 28px 0; }
  .signal-term { color: var(--story-ink); border-top: 3px solid var(--story-blue); background: var(--story-blue-tint); padding: 18px; }
  .signal-term.residual { border-color: var(--story-orange); background: var(--story-orange-tint); }
  .signal-term strong { display: block; font-size: 1.05em; margin-bottom: 8px; }
  .signal-term p { font-size: 0.9em; line-height: 1.5; margin: 0; }
  .signal-plus { align-self: center; font-size: 2em; }
  .alignment-note { padding: 16px 20px; border-left: 3px solid var(--story-blue); background: var(--story-blue-tint); margin: 26px 0; }
  .alignment-note p { margin: 0; }
  .alignment-methods { overflow-x: auto; }
  d-article details { color: var(--story-ink); margin: 20px 0; background: var(--story-surface); border: 1px solid var(--story-line); padding: 12px 16px; border-radius: 4px; }
  d-article summary { color: var(--story-blue); cursor: pointer; font-weight: 600; line-height: 1.6; padding: 8px 0; }
  @media (max-width: 620px) {
    .frame-pairing { height: 1350px; }
    .frame-mapping-categories { height: 1350px; }
    .signal-sum { grid-template-columns: 1fr; gap: 8px; }
    .signal-plus { justify-self: center; }
  }
authors:
  - name: Anonymous
bibliography: 2027-04-30-what-did-the-alignment-learn.bib
toc:
  - name: Breaking Audio-Video Pairs Without Losing Accuracy
  - name: Why Category Averages Drive the Rotation
  - name: Holding Out Categories Breaks the Rotation
  - name: Takeaways for Evaluating Multimodal Alignment
---

Multimodal embedding models map audio and video into a shared vector space, which makes it tempting to train a classifier on sound and run it directly on silent video. Out of the box, that fails badly. On the Audio-Visual Event (AVE) benchmark <d-cite key="Tian_2018_ECCV"></d-cite>, a linear classifier trained on Omni Mini 2.3B audio embeddings reaches 95.0% accuracy on audio, but drops to **36.7%** balanced accuracy when evaluated on silent video from the same 28 events.

Fitting a single orthogonal rotation between paired training audio and video appears to solve the problem: the exact same audio classifier jumps from **36.7%** to **90.5%** on silent video. Because an orthogonal transformation only rotates or reflects coordinates without distorting distances inside either modality, it is natural to assume the rotation aligned the two modalities clip for clip.

Then we ran a control that was supposed to break it. Before fitting the rotation, we scrambled the training pairs within each event category, giving almost every guitar soundtrack the wrong guitar video and every helicopter sound the wrong helicopter clip: *wrong clips, right categories*. We refit the rotation on those mismatched pairs, and accuracy barely moved: **90.1%**.

## Breaking Audio-Video Pairs Without Losing Accuracy

Imagine two different acoustic-guitar performances. If we swap their soundtracks, the recordings no longer match: the strumming pattern in the audio belongs to a different musician than the hands on screen. Yet for a 28-way event classifier, both clips still carry the same label (`Acoustic guitar`).

That distinction turns out to be critical for understanding what post-hoc alignment actually learns. In our setup, both the pretrained encoders and the audio classifier stay frozen. We train a multinomial logistic classifier ($C=1$) once on training audio across all 28 AVE categories, and report balanced accuracy (mean per-category recall across the 402 official test clips) so frequent events do not dominate the score. To bridge the two modalities at test time, we fit an orthogonal Procrustes rotation on training audio and video vectors.

To see what signal the rotation actually relies on, we change how the 3,731 training audio and video vectors are paired before fitting it:

1. **Exact clip pairs:** Each audio track is paired with its true synchronized video.
2. **Shuffle within event:** Every `Acoustic guitar` audio clip is randomly paired with a different `Acoustic guitar` video (and likewise within each of the other 27 categories), breaking over 99% of true recording pairs while keeping the event categories matched.
3. **Shuffle all events:** Audio and video clips are paired at random across the entire dataset.
4. **Event means only:** Individual clips are discarded when fitting the rotation, leaving only the 28 category centroids.

<iframe class="alignment-frame frame-pairing" title="Change the training correspondence and inspect measured recognition accuracy" src="{{ 'assets/html/2027-04-30-what-did-the-alignment-learn/pairing.html' | relative_url }}" width="100%" height="780" loading="lazy" sandbox="allow-scripts allow-same-origin allow-downloads"></iframe>

On Omni Mini 2.3B, shuffling pairs within each category yields **90.1%** balanced accuracy across three random permutations, nearly identical to the **90.5%** obtained from true synchronized pairs. Only when we shuffle across all event categories does accuracy collapse to **4.6%**.

We see the same behavior when transferring in the opposite direction (a video-trained classifier evaluated on audio) and on a second model family, **Jina v5 Omni-small**. On Jina, fitting the rotation on pairs shuffled within each event (**88.8%**) slightly *beats* fitting it on the exact clip pairs (**88.0%**).

Random permutations within a category still leave a few original pairs intact by chance (27 to 35 of the 3,731 training rows in our three Omni seeds). To rule out any contribution from individual clip pairing, we can look directly at the matrix that Procrustes decomposes.


## Why Category Averages Drive the Rotation

Orthogonal Procrustes finds the rotation $R$ that best aligns training audio embeddings $A$ with video embeddings $V$ by computing the singular value decomposition of their cross-product matrix, $A^T V$.

If we group the training clips by event category, each embedding vector can be written as its category average (the mean `Helicopter` vector, the mean `Acoustic guitar` vector, and so on) plus an instance-specific residual for that particular recording. Because the residuals within each category sum to zero, $A^T V$ splits cleanly into two additive matrices:

<div class="signal-sum" role="group" aria-label="The cross-product matrix splits into category-centroid alignment and instance-level residual pairing.">
  <div class="signal-term"><strong>Category-centroid alignment</strong><p>Matches each event's average audio vector to its average video vector. Shuffling clips within a category leaves this matrix untouched.</p></div>
  <div class="signal-plus" aria-hidden="true">+</div>
  <div class="signal-term residual"><strong>Instance-level residual pairing</strong><p>Matches clip-specific deviations around each category mean. Shuffling clips within a category scrambles this term.</p></div>
</div>

Instead of scrambling the residual term with a random permutation, we can drop it completely and fit the rotation using **only the 28 category averages**.

When we do that, Omni Mini 2.3B reaches **90.6%** and Jina v5 Omni-small reaches **88.7%**. In both models, 28 category centroids alone slightly outperform the rotation fitted on all 3,731 synchronized clip pairs (**90.5%** on Omni and **88.0%** on Jina). When the downstream task is category recognition, instance-level pairing variations act mostly as noise; aligning the category centroids does all the work.

<details><summary>See the exact matrix decomposition</summary>

Let $A,V\in\mathbb{R}^{n\times d}$ denote the row-normalized training embeddings. For category $c$ with $n_c$ training rows, write its column-vector means as $\mu_{a,c}$ and $\mu_{v,c}$, and the centered residual rows as $\widetilde A_c$ and $\widetilde V_c$. Because the columns of $\widetilde A_c$ and $\widetilde V_c$ sum to zero, the cross terms between means and residuals vanish:

$$
A^T V = \underbrace{\sum_c n_c\mu_{a,c}\mu_{v,c}^T}_{\text{category centroids}} + \underbrace{\sum_c\widetilde A_c^T\widetilde V_c}_{\text{instance residuals}}.
$$

The orthogonal transformation minimizing $\lVert AR-V\rVert_F$ is $R=UW^T$, where $A^T V=U\Sigma W^T$ is the singular value decomposition. Fitting on event means replaces $A^T V$ with the first sum and applies the same SVD rule.

</details>


## Holding Out Categories Breaks the Rotation

When we first saw an orthogonal rotation lift accuracy from **36.7%** to **90.5%**, we expected it to act like a global coordinate calibration between the audio and video spaces. If the rotation were truly recovering a shared cross-modal reference frame, fitting it on most of the event categories should also help on categories that were held out when fitting the rotation.

To test that hypothesis, we kept the audio classifier trained on all 28 categories so it can still predict every event label. We only restricted the rotation: we fitted Procrustes on paired clips from **21 categories** and evaluated how well the rotated classifier recognized silent videos from the **7 categories excluded from the rotation** (repeating across four disjoint folds so every category is held out once).

<iframe class="alignment-frame frame-mapping-categories" title="Compare retained and excluded mapping categories while the source reader knows all 28 labels" src="{{ 'assets/html/2027-04-30-what-did-the-alignment-learn/mapping-categories.html' | relative_url }}" width="100%" height="820" loading="lazy" sandbox="allow-scripts allow-same-origin allow-downloads"></iframe>

Our global-calibration hypothesis failed in every fold. Across the four fits on Omni Mini 2.3B, the rotation reaches **90.7%** on held-out test clips from the 21 categories it saw during fitting, but drops to **24.1%** on the 7 categories it never saw. That is **12.5 percentage points worse** than using no rotation at all (**36.7%**). The same pattern holds across all four folds on both models and in both transfer directions.

This drop cannot be explained by having fewer training pairs. Fitting an Omni rotation on a random subset of just **256 true pairs** spanning all categories still reaches **79.7%**, whereas the category-held-out rotations fail despite using roughly 2,800 training pairs.

Why does holding out categories actively hurt them? Our centroid decomposition points directly to the geometric bottleneck. In a 1,024- or 2,048-dimensional embedding space, 21 category averages span a subspace of rank at most 21, leaving roughly 99% of the dimensions unconstrained by category means. Along the directions spanned by the 21 seen categories, Procrustes aligns audio and video cleanly; along the remaining directions needed to distinguish the 7 held-out categories, the rotation is governed only by residual noise and ends up rotating unseen events into the decision regions of the seen ones. Across the four model and direction settings, **89% to 97%** of all errors on excluded categories happen because the classifier mislabels them as one of the 21 categories the rotation saw during fitting (for instance, turning `Acoustic guitar` videos into `Ukulele` or `Mandolin`, and `Helicopter` videos into `Fixed-wing aircraft`).


## Takeaways for Evaluating Multimodal Alignment

What we found most intriguing in these experiments is not that linear alignment bridges the gap between audio and video embeddings, but *how little clip-level correspondence it needs* to produce a dramatic accuracy gain. Even though Orthogonal Procrustes never sees explicit class labels during fitting, paired clips from a 28-way benchmark naturally group clips by event. When we evaluate the aligned space with a 28-way classifier, category-level agreement is all the metric rewards, and 28 category averages are enough to match or beat 3,731 exact clip pairs.

That distinction is worth keeping in mind whenever we evaluate cross-modal alignment or representation stitching <d-cite key="pmlr-v139-radford21a,ICLR2024_e26f31de,ICLR2026_9b2ab849,sharut2026canonicalizing"></d-cite>:

- **When your target task is closed-set recognition over known classes**, aligning category centroids (or fitting a rotation on coarsely matched pairs from those classes) is remarkably effective and needs very little data.
- **When you want to claim that an alignment method recovers a generalizable coordinate map**, high accuracy on held-out clips from seen categories is not enough.

Two simple controls help separate those two claims: **shuffle training pairs within each category** to check whether instance-level matching is actually contributing to your score, and **hold out categories when fitting the alignment** (while keeping them in the classifier) to test whether the transformation generalizes beyond the classes it saw.

<details><summary>Scope and open questions</summary>

Our experiments evaluate 28-way event classification on the official source-disjoint AVE split across two pretrained checkpoints (`MBZUAI/Omni-Embed-Mini-2.3B` at 2,048D and `jinaai/jina-embeddings-v5-omni-small` at 1,024D), using L2-normalized embeddings, a fixed multinomial logistic classifier ($C=1$), and uncentered orthogonal Procrustes. Fine-grained instance retrieval, regularized or low-rank alignment objectives, and cross-model canonicalization setups <d-cite key="sharut2026canonicalizing"></d-cite> may rely on instance correspondence differently and can be audited with the same two controls.

</details>
