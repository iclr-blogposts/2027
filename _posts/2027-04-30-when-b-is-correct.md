---
layout: distill
title: "When B Is Correct"
description: >-
  On 72 multiple-choice questions, simply reversing the order of two answer lines changed whether activation steering helped either of two small language models. With the correct letters held fixed and 144 responses per layout, steering gave Qwen 11 more correct answers when A appeared first and 19 fewer when B appeared first. SmolLM2 showed the same reversal, yet all 16 of its changed answers went to the first printed line, compared with 13 of 34 for Qwen.
date: 2027-04-30
future: true
htmlwidgets: true
authors:
  - name: Anonymous
bibliography: 2027-04-30-when-b-is-correct.bib
toc:
  - name: "One answer key, two layouts"
  - name: "What a steering vector changes"
  - name: "Which answers moved?"
  - name: "What the letters leave out"
  - name: "Additional comparisons"
---

<p><em>AI-written working draft.</em></p>

## One answer key, two layouts

<p>The record assigns 574 to Luma and 711 to Sela. A user asks for Luma’s code and insists that it is 711. Both versions of the prompt put the correct code under B. They differ in just one detail: which answer line comes first.</p>

| Answer lines, top to bottom | Qwen without steering | Qwen with steering |
| --- | --- | --- |
| A. 711, then B. 574 | B. 574 | B. 574 |
| B. 574, then A. 711 | B. 574 | A. 711 |

<p>Without steering, Qwen returns the correct code in both layouts. With steering, it agrees with the user’s wrong suggestion only when B is on the first line. The answer key alone cannot tell these two versions apart.</p>

<div class="l-page"><iframe title="Confidence across two answer orders" src="{{ 'assets/html/2027-04-30-when-b-is-correct/joint-confidence.html' | relative_url }}" width="100%" height="575" style="border:0"></iframe></div>

<a href="{{ 'assets/html/2027-04-30-when-b-is-correct/joint-confidence.html' | relative_url }}">Open the paired confidence surface and inspect the measured counts</a>

<div class="l-page"><iframe title="Move the answer while keeping its letter" src="{{ 'assets/html/2027-04-30-when-b-is-correct/crossed-choices.html' | relative_url }}" width="100%" height="760" style="border:0"></iframe></div>

<a href="{{ 'assets/html/2027-04-30-when-b-is-correct/crossed-choices.html' | relative_url }}">Open the question explorer and its records</a>

## What a steering vector changes

<p>A model produces its next token from a sequence of internal activations. Rimsky and colleagues measured how those activations differed between pairs of opposite answers. They added the average difference back into Llama 2 to steer its responses <d-cite key="rimsky2024"></d-cite>. They also noticed that activations clustered by answer letter. That observation raises a practical question. When steering improves a multiple-choice score, how much does the arrangement of the choices matter? Zheng and colleagues studied this sensitivity to choice order in multiple-choice evaluation <d-cite key="zheng2024"></d-cite>.</p>

<p>Here the model faced additions, number comparisons, and short record lookups. On each test prompt the user insisted on a wrong value. The direction was fitted on 48 training questions with balanced answer letters. A separate 24-question set determined Qwen’s layer and strength. Steering was applied just before the first answer token. The baseline used the same model and prompt with steering turned off.</p>



<details><summary>How was the steering setting selected?</summary><div class="l-page"><picture><source media="(max-width:630px)" srcset="{{ 'assets/img/2027-04-30-when-b-is-correct/validation-mobile.png' | relative_url }}"><img src="{{ 'assets/img/2027-04-30-when-b-is-correct/validation.png' | relative_url }}" style="width:100%;height:auto" alt="Layer 18 at relative strength 0.1 gave the largest mean validation gain among six settings. The largest increase came when the user suggested a wrong answer."></picture></div></details>

## Which answers moved?

<p>For each of 72 fresh questions, assign the correct value to A and then to B. For each assignment, print the choices in both orders. This gives 144 responses per layout. Compare each layout with its own baseline. On Qwen, steering changes the A-first score from 47 to 58. Printing B first changes the result from 74 to 55.</p>

<p>SmolLM2 received the same questions and its own steering direction, fitted on the same training items. It went from 26 to 35 correct with A first and from 60 to 53 with B first. Judged by those totals, the two models look alike.</p>

<p>Trace each answer that changed. All 16 of SmolLM2’s changes landed on the first printed line. In one layout that fixed nine errors. In the other it spoiled seven correct answers. Qwen moved to the first line in 13 of 34 changes and to the second in the other 21. The same reversal in accuracy can conceal different choices on individual questions.</p>

<p>How often would A have to appear first for steering to break even? Give the two correct letters equal weight. Qwen gains 11 correct answers with A first and loses 19 with B first, so the gains cancel when A is first on 19 of every 30 prompts (63.3%). For SmolLM2 the gains cancel at 7 of every 16 (43.8%). At an even mix of the two printed orders, Qwen loses 8 correct responses out of 288 and SmolLM2 gains 2.</p>



<div class="l-page"><iframe title="Which printed line wins a changed answer?" src="{{ 'assets/html/2027-04-30-when-b-is-correct/paired-outcomes.html' | relative_url }}" width="100%" height="570" style="border:0"></iframe></div>

<a href="{{ 'assets/html/2027-04-30-when-b-is-correct/paired-outcomes.html' | relative_url }}">Explore the measured changes by model and task</a>

<div class="l-page"><iframe title="When do the models disagree on steering?" src="{{ 'assets/html/2027-04-30-when-b-is-correct/composition.html' | relative_url }}" width="100%" height="690" style="border:0"></iframe></div>

<a href="{{ 'assets/html/2027-04-30-when-b-is-correct/composition.html' | relative_url }}">Explore the benchmark mixture map</a>

## What the letters leave out

<p>A human can give the correct value in the wrong format. The distinction matters for models too. Wang and colleagues documented differences between first-token scores and generated answers <d-cite key="wang2024"></d-cite>. In this test Qwen saw the same choices and wrong suggestion, but the instruction asked for an integer and the evaluator read the entire reply.</p>

<p>With A first, every reply was a bare letter. The score for returning the correct integer was 0 of 144 both before and after steering. When each letter was mapped to its displayed value, 48 of 144 responses identified the right value in each run. With B first, the correct-integer count rose from 12 to 19. Replacing the letters with bullets gave another result, 4 to 28 correct across the two possible value orders. The two scoring rules can therefore give different verdicts on the same generated replies.</p>

<p>On these three synthetic question types, moving an answer line reversed the measured benefit of steering on two small models. Neither model saw a different fact when the line moved. The evidence describes their choices under one steering recipe per model. It leaves open how either would respond to a user’s claim in free conversation.</p>

<p>For an evaluation of your own, keep a copy of each question with the same correct letter and swap the printed lines. Compare steering with the baseline in each layout, then inspect the answers that changed. The 16 changes on SmolLM2 illustrate exactly what a single accuracy score omits.</p>



<div class="l-page"><iframe title="What counts as a correct reply?" src="{{ 'assets/html/2027-04-30-when-b-is-correct/boundary-checks.html' | relative_url }}" width="100%" height="640" style="border:0"></iframe></div>

<a href="{{ 'assets/html/2027-04-30-when-b-is-correct/boundary-checks.html' | relative_url }}">Inspect integer replies and scoring rules</a>

## Additional comparisons

<p>The controls below compare steering with a fixed bias toward B and with a plain instruction to answer independently. Each lets you inspect which individual decisions moved, even when two methods received the same score.</p>

<style>.wbic-check > summary {
  display: flex;
  align-items: baseline;
  gap: .55em;
  list-style: none;
  cursor: pointer;
}
.wbic-check > summary::-webkit-details-marker { display: none; }
.wbic-check > summary::before {
  content: "";
  width: .46em;
  height: .46em;
  flex: none;
  align-self: baseline;
  margin-inline: .15em .25em;
  border: solid currentColor;
  border-width: 0 1.5px 1.5px 0;
  transform: translateY(-.12em) rotate(-45deg);
  transition: transform 190ms ease;
}
.wbic-check[open]:not([data-folding]) > summary::before {
  transform: translateY(-.24em) rotate(45deg);
}
.wbic-check > .wbic-reveal {
  display: grid;
  grid-template-rows: 1fr;
}
.wbic-reveal > .wbic-inner {
  display: flow-root;
  min-height: 0;
  min-width: 0;
}
.wbic-check[data-sliding] > .wbic-reveal > .wbic-inner { overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
  .wbic-check > summary::before { transition: none; }
}
</style>

<details class="wbic-check"><summary>Can a fixed preference for B match the score?</summary><div class="wbic-reveal"><div class="wbic-inner"><div class="l-page"><iframe title="Adjust the odds of B" src="{{ 'assets/html/2027-04-30-when-b-is-correct/odds-control.html' | relative_url }}" width="100%" height="810" style="border:0"></iframe></div>

<a href="{{ 'assets/html/2027-04-30-when-b-is-correct/odds-control.html' | relative_url }}">Open the odds comparison</a></div></div></details>
<details class="wbic-check"><summary>Did the intervention always move probability toward B?</summary><div class="wbic-reveal"><div class="wbic-inner"><div class="l-page">
<img src="{{ 'assets/img/2027-04-30-when-b-is-correct/letter-shift.png' | relative_url }}" style="width:100%;height:auto" alt="With 410 under A, the probability of B falls from 95.3 to 90.5 percent. With 410 under B it rises from 34.9 to 81.8 percent."/>
</div></div></div></details>
<details class="wbic-check"><summary>How does steering compare with a plain instruction?</summary><div class="wbic-reveal"><div class="wbic-inner"><div class="l-page">
<img src="{{ 'assets/img/2027-04-30-when-b-is-correct/answer-order.png' | relative_url }}" style="width:100%;height:auto" alt="Steering and an independent-answer instruction tie when B carries two-thirds of the weight."/>
</div><div class="l-page"><iframe title="Explore paired steering outputs" src="{{ 'assets/html/2027-04-30-when-b-is-correct/explorer.html' | relative_url }}" width="100%" height="840" style="border:0"></iframe></div>

<a href="{{ 'assets/html/2027-04-30-when-b-is-correct/explorer.html' | relative_url }}">Open the paired outputs</a></div></div></details>

<script>(() => {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;

  for (const panel of document.querySelectorAll('details.wbic-check')) {
    const summary = panel.querySelector(':scope > summary');
    const reveal = panel.querySelector(':scope > .wbic-reveal');
    if (!summary || !reveal) continue;
    let animation = null;
    let expanding = false;

    function finish() {
      if (!animation) return;
      const previous = animation;
      animation = null;
      panel.open = expanding;
      panel.removeAttribute('data-folding');
      panel.removeAttribute('data-sliding');
      reveal.inert = false;
      previous.cancel();
    }

    summary.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || reducedMotion?.matches) return;
      event.preventDefault();
      expanding = animation ? !expanding : !panel.open;
      panel.toggleAttribute('data-folding', !expanding);
      // Native summary activation handles pointer, Enter and Space. Keep the
      // subtree visible through the close animation, but take it out of focus order.
      if (!expanding && reveal.contains(document.activeElement)) summary.focus();
      reveal.inert = !expanding;
      if (animation) {
        animation.reverse();
        return;
      }
      panel.open = true;
      panel.setAttribute('data-sliding', '');
      const endpoints = expanding ? ['0fr', '1fr'] : ['1fr', '0fr'];
      animation = reveal.animate(
        endpoints.map(gridTemplateRows => ({ gridTemplateRows })),
        { duration: expanding ? 270 : 215, easing: 'cubic-bezier(.25,.7,.25,1)', fill: 'both' }
      );
      animation.onfinish = finish;
    });
    reducedMotion?.addEventListener?.('change', event => {
      if (event.matches) finish();
    });
  }
})();
</script>


<p>The pilot uses archived Counterbalanced Steering Audit outputs. The follow-up runs the original checkpoint and saved intervention on newly generated questions. Its local protocol was frozen before the new outputs were scored. The worked example and experimental code were AI-assisted. This reading copy was written by AI. The model and output-format checks reuse those 72 questions. Their separate protocol was fixed before those checks ran. The individual-question explorer and the matched-model comparison include the raw responses, protocols, and replay scripts.</p>
