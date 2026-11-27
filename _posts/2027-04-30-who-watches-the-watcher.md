---
layout: distill
title: 'Who Watches the Watcher? Lessons Learned from Evaluating Agent Monitors and Auditors'
description: 'Agentic runs require monitoring systems as a precursor to intervention. We evaluate online monitors, offline auditors and cascades of both across multiple agent benchmarks, and show that the baseline, the label view and the operating point change what a single number means. Before trusting a monitor to watch agents, practitioners should check it against a simple but strong baseline, on trustworthy labels with a validated alert threshold; our lessons show how critical these considerations are.'
date: 2027-04-30
future: true
htmlwidgets: true

authors:
  - name: Anonymous

bibliography: 2027-04-30-who-watches-the-watcher.bib

toc:
  - name: 'Introduction'
  - name: 'Terminology illustrated through examples'
  - name: 'Why these lessons matter, and who they are for'
  - name: 'Contribution'
  - name: 'Dataset description'
  - name: 'Setup at a glance'
  - name: 'The statistics behind the lessons'
  - name: 'Lesson 1. Show the strong baseline'
  - name: 'Lesson 2. AUROC is necessary, not sufficient'
  - name: 'Lesson 3. Side-by-side comparison with fresh data'
  - name: 'Lesson 4. Select the threshold, and check calibration on the target domain'
  - name: 'Lesson 5. Verify the labels, and report results under more than one reading'
  - name: 'Lesson 6. Monitor online, audit offline, and cascade only where it pays'
  - name: 'Lesson 7. The question you ask matters most'
  - name: 'Limitations of current work and future directions'
    subsections:
      - name: 'Monitoring is not intervention'
      - name: 'State matters'
      - name: 'Small sample sizes'
      - name: 'Judges and criteria'
  - name: 'Disclosures'
  - name: 'Conclusion'
  - name: 'Appendix'
  - name: 'Appendix A. Models and checkers'
    subsections:
      - name: 'Table 3. Models and access'
      - name: 'Table 4. The checkers in this post'
  - name: 'Appendix B. Lesson 1 details: the baseline comparisons'
    subsections:
      - name: 'Table 5. The eleven monitor-versus-baseline comparisons'
  - name: 'Appendix C. Lesson 2 details: recall at fixed false-alarm budgets'
    subsections:
      - name: 'Table 8. Recall at a fixed false-alarm budget, monitor vs run length'
  - name: 'Appendix D. Lesson 4 details: calibration and thresholds'
    subsections:
      - name: 'Table 9. Calibration after recalibrating on 10 runs'
      - name: 'Table 10. Threshold rules at n = 20'
  - name: 'Appendix E. Lesson 6 details: monitor, audit and cascade'
    subsections:
      - name: 'Table 11. Monitor, audit and cascade at matched false alarms'
      - name: 'Table 13. Other designs cited in the text'
      - name: 'Table 14. bfcl under two label views'
  - name: 'Appendix F. Lesson 7 details: the knobs'
    subsections:
      - name: 'Table 15. The knobs we turned and what moved'
      - name: 'Table 16. Criteria and long runs on other benchmarks'
_styles: |
  d-article .takeaway-box{margin:1.6rem 0 1.4rem;padding:.9rem 1.2rem .5rem 1.4rem;border-radius:0 12px 12px 0;border-left:5px solid #6366f1;background:linear-gradient(135deg,rgba(99,102,241,.12),rgba(99,102,241,.04))}
  d-article .takeaway-box .takeaway-title{font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:.95rem;color:#4f46e5;margin-bottom:.3rem;font-family:system-ui,sans-serif}
  d-article .takeaway-box p{margin:.2rem 0 .6rem;line-height:1.5}
  html[data-theme='dark'] d-article .takeaway-box .takeaway-title{color:#a5b4fc}
---
## Introduction {#introduction}
Large language model (LLM) based agents have become widely used in enterprise as well as consumer-facing settings. As agents have become increasingly capable in calling tools, changing records and moving through complex high-stakes multi-step tasks, it becomes critical to be able to monitor agent runs. Any intervention, whether stopping, rolling back or escalating to a human, depends on first noticing that a run has gone wrong. Therefore, monitoring is a critical precondition for intervention and building reliable agentic systems. To scale this, increasingly the monitoring is done through LLMs, which raises an important question around the quality of the monitoring: who watches the watcher?
In this post, we examine this question by proposing and critically evaluating an online monitor during each step of the run as well as an offline auditor that reads stored runs plus the cascade that joins them. We demonstrate our approach on multiple public agent benchmark datasets, and highlight the key lessons learned during the process.

## Terminology illustrated through examples {#terminology-illustrated-through-examples}
We first define the terms used throughout the post, grouped by what they describe, and then illustrate them with real runs from the benchmark datasets.

**What we judge**

- **Step and run:** a step is one assistant message, either a reply or a tool call; a run is the whole conversation from the first message to the end.

**What counts as wrong (labels)**

- **Step label:** +1 for correct and −1 for wrong; a neutral 0 is left out of the scoring.
- **Run label:** with step-derived labels, an error run has at least one wrong step and a clean run has none. A failing run is a run that should be caught: an error run under step-derived labels, or a failed, unsafe or not-perfect run under a dataset's own label. We use failed, successful, perfect, unsafe and safe only when quoting a dataset's own label.
- **Label views:** V0 is the benchmark's own labels, used unless a lesson says otherwise. V1 changes only the runs an audit disputed: there, an independent Opus 5.5 verdict replaces the benchmark label, and runs it finds ambiguous are left out. No human is involved. V2 starts again from V0 and applies a strict human reading to the clean-labelled runs that the cascade audits flagged. Both views exist for τ²; bfcl has its own V1 (Table 14). Lesson 5 gives the details.

**Who checks**

- **Monitor:** a decision model that scores each assistant step online, during the run, seeing only the conversation up to that step (the prefix). We mainly use Decision-1 from Microsoft (post-trained Qwen3.5-9B), and compare it with other decision models such as Jev in some experiments.
- **Auditor:** a strong model, such as Gemini 4 Argon or Claude Opus 5.5, that reads a stored run, usually the whole run after it ends.
- **Cascade:** the monitor alerts, and the auditor checks only the alerted runs (Lesson 6 compares the variants).

We use **checker** for any of the three.

**How we score a checker**

- **Alert:** the monitor fires an alert when a step's score falls below the threshold; a run is alerted if any of its steps is.
- **Recall:** the share of failing runs that get an alert.
- **False alarm:** an alert on a clean run.
- **Delay:** the number of steps between the first wrong step and the first alert.
- **AUROC:** the probability that a wrong step (or failing run) gets a higher alarm score than a correct one, with ties counting half; 0.5 is chance and 1.0 a perfect ranking. It ignores the threshold.
- **Interruptions per run:** how many times a checker stops or escalates a run, on average.

Figure 1 shows these terms on three real runs from the AgentProcessBench τ² dataset. Run 1 is where the monitor alerts at the first wrong step with a delay of 0. Run 2 also counts as caught at run level, because one alert is enough, yet the monitor scored the three later wrong steps as clearly on track, highlighting that a caught run is not the same as caught errors. Run 3 is a false alarm: the run is clean by the benchmark's labels (V0), but the monitor alerts at step 12.

Figure 2 replays Run 1 turn by turn. At step 2 the agent looks up the customer with a date of birth the user never gave; the monitor's score drops to 0.05 at exactly that step, and recovers once the user gives a phone number and the agent finds the customer properly.
<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-1.svg" class="img-fluid" alt="one monitor, three runs: what the terms mean" %}
<div class="caption" markdown="1">
**Figure 1.** Step level and run level, AgentProcessBench τ² dev runs. Each circle or cross is one assistant step with its human label (circle = correct, cross = wrong); the grey line is the monitor's score at that step (the probability that the step is on track, from the conversation up to and including that step); the dashed line is the frozen threshold (0.245); the triangle marks the first alert. Run 1 (telecom): at step 2 the agent looks up a customer with a date of birth the user never gave, and the monitor alerts there, at the first wrong step (delay 0; lowest score 0.05). Run 2 (airline): at step 3 the agent guesses a reservation ID of "none" and the monitor alerts; at steps 6 to 8 the agent wrongly cancels a reservation, but the monitor scores those steps 0.87, 0.88 and 0.73, so it misses them (lowest score 0.04). Run 3 (retail): clean by the benchmark's labels (V0), yet the score first falls below the threshold at step 12, a false alarm by those labels (lowest score 0.09).
</div>
</div>

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-2.svg" class="img-fluid" alt="Run 1 turn by turn, the conversation beside the monitor's scores" %}
<div class="caption" markdown="1">
**Figure 2.** The same Run 1 as in Figure 1 (AgentProcessBench τ² split, telecom, task 45, sample 4, dev), shown turn by turn. Left: the conversation in order, quoted from the data and shortened, with long tool results collapsed. Right: the monitor's score for each assistant step. At step 2 (message 3), the agent calls get_customer_by_name with a date of birth the user never gave; the humans label the step wrong, the score falls to 0.05 and the alert fires there. The score recovers, to 0.76 at step 3 and above 0.9 from step 4, once the user gives a phone number and the agent looks the customer up correctly.
</div>
</div>

## Why these lessons matter, and who they are for {#why-these-lessons-matter-and-who-they-are-for}
The blog post captures several important lessons for practitioners.

* Monitor builders: It is important to understand the trade-off between recall and false-alarm rate (Lesson 2). This will influence setting the threshold from clean runs on the tasks that are monitored. Furthermore, it is important to check the monitor's calibration on your own task, recalibrate only if it is off, and set the threshold on your own task (Lesson 4). It is also important to treat empty input as an error, as found in our experiments (Lesson 7).
  
* Benchmark builders and users: We provide insights around reporting the baseline results beside the model (Lesson 1). We also share the paired difference and the resampling unit. We also report the benchmark's labels and a stricter reading side by side (Lesson 5). We have also found value in spot-checking the runs labelled clean.
 
* LLM-as-a-judge researchers: The criteria used for evaluation should be aware of the pertinent domain errors. It can help to decompose the criteria into multiple atomic sub-criteria (in an exploratory comparison it helped where the single question was weak, but did not separate from 0 on held-out runs), so test it for your scenario (Lesson 7). Also we have observed noise in the evaluation, so it is helpful to check the variance over multiple repeats.

## Contribution {#contribution}
Our contribution is three-fold: 

1. Reinforcing earlier work in the literature through empirical verification on multiple benchmark datasets covering many domains and tasks: 
    - Reporting recall at a stated false-alarm rate, not AUROC alone, is recommended in <d-cite key="kale2026weaktostrong"></d-cite>.
    - Small samples give noisy estimates, and estimates move on fresh data <d-cite key="miller2024errorbars,bowyer2025clt,recht2019imagenet"></d-cite>.
    - Benchmark labels merit validation <d-cite key="northcutt2021labelerrors,schroeder2025humanintheloop,zhu2025rigorousbenchmarks"></d-cite>.
    - Splitting one question into sub-criteria is reported to help in some settings and not in others <d-cite key="cook2024tick,nandwani2026askthengrade,zhang2026atomicholistic"></d-cite>.
    - Identical judge calls can disagree <d-cite key="haldar2025ratingroulette"></d-cite>.

2. Identifying and reporting results that extend current practice in the literature; we did not find these reported for agent monitors: 
    - Reporting a content-blind baseline, the step index (or run length), beside the monitor's AUROC, with a paired task-clustered interval. The closest work we found, <d-cite key="zhang2025whowhen"></d-cite>, compares against a random baseline. We show that there are stronger choices for the baseline.
    - Reporting the monitor's recall and false alarms under the benchmark's labels and under a stricter labeling of the same runs. We highlight the need to validate the quality of the labels.
    - Comparing a monitor and an auditor at matched false alarms on agent runs, and reporting paired per-run counts: both are set to alert on the same share of clean runs. The closest works we found are <d-cite key="greenblatt2024control"></d-cite>, who set the monitor threshold at a fixed 2% false-positive rate on code-backdoor solutions and treat the audit as near-perfect; and <d-cite key="hua2025costconstrained"></d-cite>, who match policies on a cost budget in code-backdoor detection with paired differences across random splits. Instead of assuming the audit is near-perfect or matching on cost, we set the monitor and the auditor to the same false-alarm rate on clean agent runs and count, run by run, which failures each one catches.

3. We also provide a statistical reporting protocol for monitor evaluations: task-clustered paired intervals, Holm correction for claims we call established, Benjamini-Hochberg as a screen for candidate claims, and an explicit label for each result, so practitioners can know what is established, likely or not detected at this sample size.

## Dataset description {#dataset-description}
We used a variety of datasets across multiple use cases and levels of complexity for our experiments as described in Table 1.
Table 1: The datasets used in this post. Label = the label we use for that dataset (the benchmark's own labels, V0, unless the lesson says otherwise); "our sample" is what we ran under budget, not the size of the full benchmark.

<div class="l-page" markdown="1">

| Dataset | What it measures | Our sample | Label used | Licence we follow | Cite |
|---|---|---|---|---|---|
| [AgentProcessBench](https://huggingface.co/datasets/LulaCola/AgentProcessBench): τ² split | step-level quality of tool-using agent runs on τ²-bench tasks (airline, retail, telecom) | 121 of the benchmark's 237 τ² runs scored (60 dev, 61 test, split by task); all 237 are used for the TF-IDF classifier in Table 4 | human step labels +1 / 0 / -1 with an error-propagation rule; run label derived from steps (failing = any -1 step) | MIT | <d-cite key="fan2026agentprocessbench,barres2025tau2,yao2024taubench"></d-cite> |
| [AgentProcessBench](https://huggingface.co/datasets/LulaCola/AgentProcessBench): bfcl split | the same, on function-calling tasks | 30-run first sample plus 66 fresh runs (sharing tasks) | same step labels and derived run label | MIT | <d-cite key="fan2026agentprocessbench,patil2025bfcl"></d-cite> |
| [AgentRx](https://huggingface.co/datasets/microsoft/AgentRx) (tau_retail) | where an agent run first fails, annotated on failing runs | 29 runs (failing runs only) | assistant failure step -1; earlier assistant steps inferred +1; later steps unlabeled | CC-BY-4.0 | <d-cite key="barke2026agentrx"></d-cite> |
| [Who&When Pro](https://huggingface.co/datasets/Leoxx/whowhen_pro) | failure attribution on traces where one error is injected into a replayed successful run (injected, not natural, errors) | 30 first-sample traces plus 100 fresh traces (failing runs only) | injected step -1; earlier steps inferred +1 | dataset card CC-BY-4.0 (the paper is CC BY-NC-SA 4.0) | <d-cite key="liu2026whenpro,zhang2025whowhen"></d-cite> |
| [R-Judge](https://github.com/Lordog/R-Judge) | whether a judge detects safety risks in agent interaction records | 30-run first sample (15 unsafe, 15 safe) plus 100 records (50 safe, 50 unsafe), 37 task clusters | run level: unsafe or safe; evaluation only, no fitting | no licence file: evaluation and citation only | <d-cite key="yuan2024rjudge"></d-cite> |
| [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany) | LLM agents doing workplace tasks in a simulated software company | 30-run samples (15 failed, 15 perfect); Sonnet-agent and Gemini-agent samples (runs where those models were the agent) for the criteria checks (27 to 28 runs each in the view checks, 55 runs) | failed = final score below the total; checkpoints pass or fail | benchmark repository MIT; the experiments repository has no licence file, so research use only; logs not redistributed | <d-cite key="xu2024theagentcompany"></d-cite> |
| [ITBench](https://huggingface.co/datasets/ibm-research/ITBench-Trajectories) (SRE) | agents finding the root cause of IT incidents from alerts, metrics, logs and traces | 90 judged sessions from 35 scenarios | success = root-cause entity F1 above 0 | CC-BY-NC-4.0 (non-commercial); we derived scores and rules from the traces and redistribute no traces | <d-cite key="jha2025itbench"></d-cite> |
| [AMA-Bench](https://github.com/AMA-Bench/AMA-Hub) | long-horizon memory over agent trajectories (up to 525 turns) | 208 runs | the benchmark's success flag (run level) | MIT | <d-cite key="zhao2026amabench"></d-cite> |
| [PrivacyLens](https://github.com/SALT-NLP/PrivacyLens) | whether an agent's action leaks sensitive information | 107 usable agent outputs of 120 | leak, judged by an LLM (Gemini 4 Argon; not human) | CC-BY-4.0 (data) | <d-cite key="shao2024privacylens"></d-cite> |
| [TRAIL](https://huggingface.co/datasets/PatronusAI/TRAIL) (gated) | error localization in agent traces (GAIA split) | 30 runs, evaluation only; aggregates only, private routing | annotated errors; steps before the first error inferred correct | MIT plus a gating agreement | <d-cite key="deshpande2025trail"></d-cite> |

</div>

## Setup at a glance {#setup-at-a-glance}
We provide a high-level description of our setup below with further details in each lesson.

- **Monitor.** At each assistant step, the monitor (Decision-1) is asked whether the step is on track (the `on_track` question), and the probability of "yes" is the step score; a run's score is its lowest step score. It is configured with this question and a threshold, not trained, and sees only the conversation so far. Other monitors (Jev, Clef) appear in some experiments (Table 4).
- **Threshold.** One alert threshold, 0.245 (rounded from 0.24509), set on τ² dev for at most 10% false alarms on clean runs, then frozen and applied unchanged everywhere, as a deployment that sets it once would; Table 10 and Lesson 6 show other ways to set it. Recall, false alarms, delay and cascade cost are reported at it, from a single scoring pass; the AUROC and calibration results do not depend on it.
- **Dev and test.** The 121 τ² runs are split by task into dev (60 runs from 36 tasks) and test (61 runs from 14 other tasks, none of which appear in dev). The question and the threshold were chosen on dev, so dev numbers are optimistic. τ² test and the fresh samples in Lesson 3 are the out-of-sample checks; the test split was scored several times during the project, but never to change the question or the threshold.
- **Auditors.** A strong model reads a stored run after it ends: Gemini 4 Argon (effort medium) reads the whole run once; Claude Opus 5.5 is the audit stage on τ² and adjudicates the V1 labels (Table 3).
- **Cascades.** Offline, the monitor alerts at the frozen threshold, the auditor reads the full run, and a run is flagged only if both agree; online, the auditor reads only the prefix up to the alert (Table 13).
- **Labels.** The benchmark's own labels (V0) unless a lesson says otherwise; Lesson 5 adds the V1 and V2 views on τ².

## The statistics behind the lessons {#the-statistics-behind-the-lessons}
Every number in this post comes from a few dozen runs scored by a model whose answers vary from call to call, so each one carries uncertainty. This section explains how we account for it by answering three questions: how much a single number would change on other tasks, whether one checker is really better than another, and which results still hold once we allow for having made many comparisons. The box at the end explains the labels we give each result, from established to exploratory.

### How much would this number change on other tasks? {#how-much-would-this-number-change-on-other-tasks}
- **Clustered resampling** <d-cite key="efron1979bootstrap,efron1993bootstrap,miller2024errorbars"></d-cite>. Runs of the same task, scenario or trace are not independent, so bootstrap intervals resample whole tasks (clusters) wherever tasks are identified, and runs otherwise; each figure caption states its unit. We use 1000 resamples with seed 0 (600 for the τ² variant comparisons in Table 15).
    - By task: τ² throughout; bfcl in Figures 3, 4, 5, 6 and 10; R-Judge's 37 task texts in Figure 4 and the Lesson 1 family.
    - By run: R-Judge in the other figures, TheAgentCompany and the other datasets.

    *Used in:* every interval (Lessons 1 to 7).

- **Repeat measures (call-to-call noise).** Scoring the same input again gives slightly different monitor scores, so we measure that call-to-call noise on its own.

    *Used in:* the repeat-noise column of Table 4.

- **Wilson interval** <d-cite key="wilson1927probable"></d-cite>. The 95% interval we use for the proportions that carry an interval (recall, false alarms, share of failing runs lost), because it stays credible at small sample sizes and for proportion values close to 0 or 1.

    *Used in:* Lessons 4, 5 and 6.

### Is one checker better than another? {#is-one-checker-better-than-another}
- **Paired difference confidence interval** <d-cite key="efron1993bootstrap,miller2024errorbars"></d-cite>. When two scores come from the same runs, we resample the runs once, recompute both scores on each resample, and take the interval of the difference, instead of comparing two separate intervals by overlap. Pairing removes variation both scores share, and the baseline's own uncertainty is included (treating a baseline as fixed gives intervals that are too narrow). The first and fresh samples in Lesson 3 share tasks but not runs; as planned before scoring, we resample each separately rather than pairing them.

    *Used in:* Lesson 1 (monitor minus position baseline), Lesson 2 (monitor minus run length), Lesson 7 (the knobs with a paired interval in Table 15 and Figure 11).

- **Paired discordant counts.** On the same failing runs, we count how many only one checker catches and how many only the other catches; an exact sign test uses just those runs.

    *Used in:* Lesson 6 (audit versus monitor).

- **Power and sensitivity.** With this many runs, how large a difference could we have detected? A result that does not separate from zero means “not detected at this size” (see “How we label results” below).

    *Used in:* Lesson 3 (how far a number from about 30 runs can move), Lesson 6 (the cascade's recall loss cannot be shown to be small), Lesson 7 (underpowered rows).

### What survives many comparisons? {#what-survives-many-comparisons}
- **Holm correction** <d-cite key="holm1979simple,hoffmann2026adjust"></d-cite>. It controls the chance of any false claim among the comparisons the result was picked from (the family; its size m is stated each time), and is valid under any dependence between the tests. In Lesson 1 the p-values come from a leave-one-cluster-out jackknife (a t test with one degree of freedom fewer than the number of clusters): with 14 to 41 clusters, bootstrap p-values are too optimistic. Elsewhere they are approximate, recovered from the reported bootstrap intervals, and share that optimism. Caveats:
    - Where we tried more variants than we show, the Holm values are a lower bound.
    - τ² test has only 14 task clusters, where percentile bootstrap intervals tend to be too narrow.
    - τ² dev is where the question and the threshold were chosen, so dev comparisons are optimistic.

    *Used in:* Lesson 1 (monitor above baseline), Lesson 6 (sign tests), Lesson 7 (Table 15 and Figure 11).

- **Benjamini-Hochberg procedure** <d-cite key="benjamini1995controlling,hoffmann2026adjust"></d-cite>. It controls the expected share of false keeps and assumes independent or positively dependent tests, which holds across datasets and is only approximate where rows share runs. A candidate that does not pass is “not detected at this size”, not “useless”; we screen nothing out and show the intervals so a reader can apply their own margin.

    *Used in:* Lesson 1 and Lesson 7.

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">How to read our results</div>

- **How we label results.** We use the following convention for our labels:
    - *Established* result is one that survives Holm correction within the family it was picked from. We use this for a firm claim.
    - *Likely, not established* result is where the 95% interval excludes the baseline (or 0) and it passes the Benjamini-Hochberg screen at q = 0.05, but it does not survive Holm correction.
    - *Not separable* (also written as “not detected at this size”) result is where the interval includes 0. This means we could not detect a difference with this many runs, not that there is no difference.
    - *Exploratory* result is where the interval excludes 0 but it did not pass the Benjamini-Hochberg screen; we do not call it a finding. We also call a result exploratory when it was not planned before scoring or rests on model-judged labels.
    - *Descriptive* result is a number reported without an interval or test.

- **What our sample sizes can detect.** With 15 to 60 runs our paired intervals extend roughly 0.1 to 0.2 AUROC points either side of the estimate at run level, so only larger differences can be seen (power). Calling two checkers similar, or ruling out a useful gain, needs a smallest margin of interest set in advance with domain input.

- **Reporting rule.**
    - We report each dataset on its own, with equal emphasis, and never pool across datasets.
    - Intervals are unadjusted by default. When the text singles out a claim, we give the adjusted value next to the raw one.
    - A claim that one checker “beats” another at all three false-alarm budgets (5 / 10 / 20%) needs all three intervals to exclude 0. Requiring all three is already stricter than any one test, so it needs no adjustment, and we never claim a win at only some of the budgets.
    - A null result carries no adjusted value; it rests on its interval and on how large a difference we could have detected.

- **Planned before scoring.** The comparison and its decision rule were written in our experiment log, with a timestamp, before the scores were computed.

</div>


With the terms and the statistics in place, we turn to the seven lessons we learned while configuring and evaluating the monitor and the auditors. Each lesson opens with the result that surprised us, shows the evidence from our experiments, and ends with a key takeaway and what to do.

## Lesson 1. Show the strong baseline {#lesson-1-show-the-strong-baseline}
A rule that never reads the conversation, and only counts how far into the run a step is, already ranks wrong steps above correct ones with an AUROC of 0.77 on τ² dev and 0.76 on TRAIL. So the monitor's AUROC of 0.88 on τ² dev should be contextualized properly. In other words, what matters is how much the monitor adds beyond position alone.

**What AUROC misses.** Because it ignores the threshold, AUROC says nothing about the false-alarm rate you would get in use; Lesson 2 returns to this. As an example, on τ² dev the monitor ranks the wrong step above the correct one in 88% of all wrong/correct pairs.<d-footnote>On τ² dev, 751 labeled steps, 200 wrong and 551 correct, give 110,200 wrong/correct pairs; the monitor ranks the wrong step higher in 0.875 of them.</d-footnote>

**The baseline.** The baseline asks: "if I ignored what the agent did and only looked at how far into the run a step is, how well could I rank wrong steps above correct ones?"

- **Step level:** each step's alarm is the negative of its `on_track` score. The baseline is the step's absolute index, which a live monitor knows, so it is something a real system could use.
- **Run level:** a run's alarm is its lowest `on_track` score. The baseline is the number of scored steps in the run, taken in its better direction (fixed from the full sample). That favours the baseline, so the comparison is conservative for the monitor.

Our intuition around why position can predict errors is that errors propagate. Once a step goes wrong, later steps often stay wrong until the agent corrects course. In a small exploratory check, a model judged most wrong steps (59%) to be carried over from an earlier error.<d-footnote>In a 20-run sample, Opus 5.5 classified 59% of 66 human −1 steps as propagated errors (steps that stay wrong until the agent corrects course); model-judged and exploratory.</d-footnote>

**Comparing the monitor with the baseline.** We compute the same AUROC for the baseline, which knows nothing about the content, and report the paired difference, monitor minus baseline, with a 95% interval. We resample tasks or runs rather than steps, because steps within a run are not independent, and we resample the monitor and the baseline together, so the baseline's own noise is included. An interval that excludes 0 means the monitor adds something beyond position or length; one that includes 0 means it does not separate from the baseline at this sample size.

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-3.svg" class="img-fluid" alt="monitor vs position baseline, step-level AUROC" %}
<div class="caption" markdown="1">
**Figure 3.** Step level; human step labels (V0 for τ² and bfcl, whose neutral steps are left out; for AgentRx, Who&When Pro and TRAIL, which have failing runs only, steps before the first failure are inferred correct). All scored runs: τ² dev and test, AgentRx 29 runs, Who&When Pro 130 traces, bfcl 96 runs, TRAIL 30 runs. The baseline is the absolute step index; the dashed line is chance; 95% bootstrap intervals over tasks (τ², bfcl) or runs and traces (other datasets). In Who&When Pro the wrong step is always the last labeled step, which a live monitor cannot know, so the absolute index is the fair online baseline (Lesson 3). Paired differences are in Table 5.
</div>
</div>

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-4.svg" class="img-fluid" alt="monitor vs run-length baseline, run-level AUROC" %}
<div class="caption" markdown="1">
**Figure 4.** Run level; a run's score is its lowest `on_track` score; the baseline is the number of scored steps, in its better direction, fixed once from the full sample (on bfcl longer runs were less likely to fail, so the baseline sits near 0.5). Failing = any wrong step (τ² and bfcl, V0; a neutral step does not make a run fail), unsafe (R-Judge, fresh 100 runs planned before scoring) or not a perfect run (TheAgentCompany); bfcl is all 96 runs. The number under each dataset is the paired difference, monitor minus baseline; 95% bootstrap intervals over tasks (τ², bfcl, R-Judge's 37 task texts) or runs (TheAgentCompany). The Holm and Benjamini-Hochberg values for all eleven Lesson 1 comparisons are in Table 5.
</div>
</div>

**What we found.** On τ², the monitor scores 0.88 against 0.77 for position on dev, and 0.92 against 0.73 on test. Across the eleven comparisons in the two figures, the monitor's interval excludes 0 in nine, but with so few tasks only two survive a strict correction:

- **Established:** τ² dev at run level and Who&When Pro at step level.
- **Likely, not established:** τ² dev and test, AgentRx and bfcl at step level, and τ² test at run level.
- **Exploratory:** R-Judge and TheAgentCompany at run level (the interval excludes 0, but neither passes the Benjamini-Hochberg screen).
- **Not separable:** TRAIL at step level and bfcl at run level. On TRAIL, position alone is almost as good as the monitor (0.76 vs 0.78).

τ² dev is where the question and the threshold were chosen, so its rows are optimistic. A bootstrap test would have called six comparisons established (Table 5).

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">Key takeaway</div>

A monitor's AUROC needs to be contextualized. On τ², a step's position in the run alone scores 0.73–0.77, against the monitor's 0.88 (dev) and 0.92 (test). The monitor's interval excludes this baseline in 9 of 11 comparisons, but with so few tasks only two survive a strict correction; on TRAIL, and on bfcl at run level, it does not separate from it.

**What to do:**

- Score each step by its index (or each run by its length) and report that AUROC beside the model.
- Give the paired difference, and say what the resampling unit was.
</div>

### Does the result hold up? {#does-the-result-hold-up}
We checked whether the monitor's edge over position could come from the baseline we chose, from where errors sit in a run, from the labels, or from how we split the data.

- **The step index is the strongest simple baseline we found.** On τ² (dev / test), prefix length (0.73 / 0.69), tool errors so far (0.68 / 0.64) and relative position (0.745 / 0.733) all score below the absolute index (0.766 / 0.729). Relative position also needs the final run length, so only an offline checker could use it. At run level, length alone reaches 0.70 on R-Judge, because unsafe runs tend to differ in length from safe ones.
- **The monitor is not just reading position.** Within position bands it still ranks wrong steps well (τ² dev: 1.00, 0.91 and 0.79 for steps 1–3, 4–6 and 7+). Its edge weakens late on dev and much less on test.
- **Counting neutral steps as errors barely moves the AUROC.** τ² is unchanged, and bfcl's run AUROC goes from 0.63 to 0.65. On bfcl it does change false alarms at the frozen threshold (0.71 to 0.61, all 96 runs) and flips the sign of the monitor's recall advantage over run length at 10% false alarms (+0.04 to −0.06, both intervals include 0), so by the robustness rule we planned before scoring, that result is exploratory. The AgentProcessBench annotators also saw LLM reference labels (Lesson 5 returns to label quality).
- **We split by task, not by run.** 113 of 177 (64%) non-dev τ² runs are other samples of a dev task, so a run-level split would leak tasks into test; none of the 14 test tasks appears in dev.

More detail (relative position, position bands and a trained text baseline) is in the appendix, after Table 5.

**Further reading:** Zhang et al. 2025 <d-cite key="zhang2025whowhen"></d-cite>, Kapoor et al. 2025 <d-cite key="kapoor2025agentsmatter"></d-cite>, Dubois et al. 2024 <d-cite key="dubois2024lcalpacaeval"></d-cite>, Miller 2024 <d-cite key="miller2024errorbars"></d-cite>, Wang et al. 2026 <d-cite key="wang2026failfast"></d-cite>, Huang et al. 2026 <d-cite key="huang2026prefixguard"></d-cite>

## Lesson 2. AUROC is necessary, not sufficient {#lesson-2-auroc-is-necessary-not-sufficient}
On τ² test the monitor ranks error runs above clean runs well (run-level AUROC 0.83, Figure 4). Yet at the threshold set on dev, it catches two thirds of error runs and raises false alarms on 16% of clean runs, above the 10% the threshold was set for. A good ranking does not by itself give a usable alert: AUROC never picks a threshold, and a deployed monitor has to.

**What to report at the threshold.** Recall at a stated false-alarm rate, the delay, and the interruptions per run (terms defined in Terminology).

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-5.svg" class="img-fluid" alt="recall at a fixed false-alarm budget, monitor vs run length (A); τ² recall vs alerts on successful runs by threshold (B)" %}
<div class="caption" markdown="1">
**Figure 5.** Run level. Panel A (top): error run = any wrong step (τ² and bfcl, V0); the monitor's score is its lowest `on_track` over the run, and the baseline is the number of scored steps (longer = more suspicious, with no direction chosen, unlike Figure 4); each checker's threshold is set so it alerts on at most 5, 10 or 20% of clean runs; the number above each bar is the recall; 95% task-clustered bootstrap intervals; * = the paired difference excludes 0; bfcl is all 96 runs. Differences, realised false-alarm rates and TheAgentCompany (not shown) are in Table 8. Panel B (bottom): final-outcome labels (dev 30 failed + 30 successful runs, test 31 + 30); an alert is any step below the threshold; markers are thresholds 0.20, 0.30, 0.50, 0.70 and 0.90.
</div>
</div>

**At the frozen threshold.** On τ² dev, where it was set, the threshold did what it was meant to: 74% recall (28/38) with 5% false alarms (1/22). On test, false alarms rose to 16% (4/25), missing the 10% target, with 67% recall (24/36); Lesson 4 returns to why thresholds do not transfer. Under the stricter label views, test false alarms are 1/17 (Lesson 5).

**At a fixed false-alarm budget (Figure 5, panel A).** We set each checker's threshold so that it alerts on at most 5%, 10% or 20% of clean runs, and compare recall against run length. The monitor beats run length at all three budgets on τ² dev. On τ² test its intervals exclude 0 at the 5% and 20% budgets but reach 0 at 10%, so by our reporting rule we do not claim a win there. On bfcl and TheAgentCompany no interval excludes 0.

**The cost of high recall (Figure 5, panel B).** Catching 90% of failed τ² runs means alerting on 53% of successful runs on dev and 67% on test.

**How early.** The alert fired at or before the first wrong step (an alert before it also counts) in 58% of τ² dev error runs but only 31% on test.<d-footnote>The denominator is all error runs, including those never alerted. Among alerted error runs, the median delay was 0 steps on dev and 1 on test.</d-footnote> When it fired, it was typically at the wrong step itself (dev) or one step later (test).

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">Key takeaway</div>

AUROC ranks, but a deployed alert needs a threshold. On τ² test a run-level AUROC of 0.83 became 67% recall with 16% false alarms at the threshold set on dev (error run = any wrong step), and catching 90% of failed runs (final outcome) meant alerting on half to two thirds of successful ones.

**What to do:**

- Report recall at a stated false-alarm rate, the delay in steps and the interruptions per run, not AUROC alone.
- Set the threshold on the target domain, using a task-level split (Lesson 4).
</div>

### What else AUROC does not show {#what-else-auroc-does-not-show}
- **Interruptions add up, even for a simple gate.** On ITBench (90 runs, 2,888 actions), a rule-based gate built from the agent's own instructions, replayed over the stored runs, would have blocked 3.7% of actions and sent 0.6% to review: 1.36 interruptions per run, with a block in 47.8% of runs. These are descriptive counts from a different checker, rule checks without ground-truth labels, and we did not test whether blocking changes the agent's behaviour.
- **The monitor does not single out false success.** A false success is a failed run whose final message claims the task is done.<d-footnote>The label is a keyword match on the agent's final message (for example "successfully", "has been refunded", "all set", "done"), not a judgment of whether the task was actually completed. In τ², 30 of the 60 dev runs and 31 of the 61 test runs failed (final outcome), and the monitor alerted at least once on 21 of 30 (70%) and 20 of 31 (65%). False success: 6 of 12 (dev) and 7 of 9 (test) alerted; no completion claim: 15 of 18 and 13 of 22.</d-footnote> These are the failures an alert matters most for, because the agent's own report hides them. The monitor alerted on 50% of them on τ² dev and 78% on test, against 83% and 59% for the other failed runs. At these sizes that is about the same, and the order flips between dev and test.

**Further reading:** Kale et al. 2026 <d-cite key="kale2026weaktostrong"></d-cite>, Elkan 2001 <d-cite key="elkan2001costsensitive"></d-cite>, Huang et al. 2026 <d-cite key="huang2026prefixguard"></d-cite>, Wang et al. 2026 <d-cite key="wang2026failfast"></d-cite>, Dubey 2026 <d-cite key="dubey2026realtime"></d-cite>

## Lesson 3. Side-by-side comparison with fresh data {#lesson-3-side-by-side-comparison-with-fresh-data}
We first measured the monitor on about 30 runs per dataset. When we measured it again on new runs, with nothing changed, the numbers moved by 0.1 to 0.2: R-Judge from 0.96 to 0.86, bfcl from 0.48 to 0.68 (run level). Changes this large are within the noise of a 30-run sample, and that is the point: don't trust a number from a small first sample until you have checked it on new data.

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-6.svg" class="img-fluid" alt="AUROC on the first sample and on fresh data with 95% intervals, and the fresh-minus-first difference" %}
<div class="caption" markdown="1">
**Figure 6.** The frozen monitor, nothing refitted. Levels are run (R-Judge unsafe / safe; bfcl step-derived error run, V0) and step (bfcl; Who&When Pro). For Who&When Pro the injected wrong step is always the last labeled step, so position alone would separate it perfectly; we therefore compare only pairs of steps at the same step index (same-position pairs). First samples have 30 runs; fresh samples are 100 R-Judge records, 66 bfcl runs and 100 Who&When Pro traces, in the order of the figure's rows. Bootstrap with 1000 resamples, by record (R-Judge), task (bfcl) and trace (Who&When Pro); the R-Judge fresh AUROC has a slightly wider interval, [0.774, 0.935], when clustered by its 37 task texts as in Figure 4. The right column shows how far each number moved (fresh minus first), with each sample resampled separately. Intervals are percentile-bootstrap intervals and are probably too narrow at n = 30 near the AUROC ceiling. The R-Judge success criterion written down before scoring (run-level AUROC of at least 0.85 and a paired interval against the step-count baseline that excludes 0) held on the fresh sample: 0.861, difference from the baseline [0.036, 0.285], against 0.956 on the first sample.
</div>
</div>

**Not every number moves.** Who&When Pro barely changed (0.85 to 0.89, same-position pairs). Small samples can be right; you just cannot tell in advance which ones are.

**Why first samples mislead.** They are small, so a handful of unusual runs can move the AUROC by 0.1 or more. And they are often the samples that caught our attention because their numbers stood out, so on new data those numbers tend to move back toward the middle. Expect a first sample to be optimistic, or pessimistic, in whichever direction made it interesting.

**What we did about it.** Before scoring the new runs we wrote down, in our experiment log, what would count as success for R-Judge: an AUROC of at least 0.85 (our judgment of good enough for a first-pass monitor) that also beats the step-count baseline. It held, just (0.861). Lesson 6 uses the first, optimistic R-Judge sample, so read its R-Judge numbers with this in mind.

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">Key takeaway</div>

A number from about 30 runs can move a lot on new runs, with nothing changed: R-Judge went from 0.96 to 0.86 and bfcl from 0.48 to 0.68. Check a small first-sample number on new data before trusting it.

**What to do:**

- Treat a first-sample number as exploratory; confirm it on new runs, with what counts as success written down before scoring.
- Report the first and new numbers side by side, with intervals.
- Say how the new sample was drawn.
</div>

### Other reasons the numbers moved {#other-reasons-the-numbers-moved}
- **The mix of runs changed.** The new samples cover more tasks and scenarios (bfcl 38 tasks, 18 of them new; R-Judge 20 scenarios against 13) and were limited to runs of 1 to 30 steps. Part of the change may come from this different mix, not from chance alone.
- **Some first-sample bfcl labels were probably wrong.** Two models, judging independently, found a mistake in 6 of its 15 clean-labelled runs (moderate confidence). Wrongly labelled clean runs pull AUROC down, so the first bfcl number (0.48) may understate the monitor (Lesson 5 returns to label quality).

With these data we cannot separate chance, selection, the change of mix and label mistakes.

**Further reading:** Recht et al. 2019 <d-cite key="recht2019imagenet"></d-cite>, Bowyer et al. 2025 <d-cite key="bowyer2025clt"></d-cite>, Haldar and Hockenmaier 2025 <d-cite key="haldar2025ratingroulette"></d-cite>, Miller 2024 <d-cite key="miller2024errorbars"></d-cite>

## Lesson 4. Select the threshold, and check calibration on the target domain {#lesson-4-select-the-threshold-and-check-calibration-on-the-target-domain}
The monitor's numbers do not carry over to a new domain, neither its probabilities nor its threshold. When it gave a bfcl step about a 5% chance of being correct, 86% of those steps were in fact correct. And the threshold we set on τ² dev to give 10% false alarms gave 16% on τ² test and 70% on bfcl. Both need checking on the domain where the monitor will run.

### Are the probabilities right? {#are-the-probabilities-right}
A monitor is calibrated when its probabilities match how often things happen: of the steps it scores 0.8, about 80% should be correct. We measure the miss with the expected calibration error (ECE): the average gap between the predicted probability and the observed share of correct steps. A lower ECE value is better.

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-7.svg" class="img-fluid" alt="calibration of the raw step probabilities (A) and the effect of recalibrating on k labelled runs from the new domain (B to D)" %}
<div class="caption" markdown="1">
**Figure 7.** Level is step; human step labels (correct / wrong). Panel A: predicted probability that a step is correct (bin mean) against the observed share of correct steps, raw monitor output on the first samples (29 to 30 runs each); bins with fewer than 5 steps are omitted and marker size grows with bin size; the dashed line is perfect calibration. Panels B to D: ECE on test steps (fresh bfcl runs, the held-out half of AgentRx, fresh Who&When Pro runs) against the number k of labelled calibration runs from the new domain, mean of 200 random draws (k = 30 uses all runs, one draw); values above 0.30 are clipped. "Raw" is the unchanged monitor output; "τ²-fitted isotonic" uses a map fitted on τ² dev instead of the new domain. ECE values are descriptive: they carry no intervals and are biased upward at small n. In panel A, the bfcl bin around 0.05 holds 28 steps, 24 of them (86%) correct. Exact values at k = 10 are in Table 9 (appendix).
</div>
</div>

- **Out of the box, the monitor is badly calibrated on some domains.** On bfcl and AgentRx it is under-confident: it gives low probabilities to steps that are mostly correct (Figure 7, panel A). On Who&When Pro it is already close.
- **A few labelled runs from the new domain fix it.** With 10 runs, isotonic recalibration cuts the calibration error by about two thirds on bfcl and AgentRx, and most of the gain is there by 5 runs.
- **A map fitted elsewhere helps much less.** A map fitted on τ² instead removes far less of the error.
- **Where the raw probabilities are already good, recalibrating makes them worse,** as on Who&When Pro.
- **Recalibration does not change the ranking.** The maps are monotone, so AUROC is unchanged, and we did not see recall improve. Calibration matters when you act on the probability itself, for example to weigh the cost of an alert or to tell a reviewer how likely a step is to be wrong. A threshold set directly from clean runs does not need calibrated scores.

Exact values are in Table 9 (appendix).

### Where to put the threshold? {#where-to-put-the-threshold}
We compared three rules, each aiming at no more than 10% false alarms on clean runs:

- **Frozen:** the threshold set once on τ² dev (0.245) and applied everywhere.
- **Re-drawn:** the largest threshold with at most 10% false alarms on n clean runs from the domain (the frozen rule, re-applied in each domain).
- **Conformal** <d-cite key="angelopoulos2024crc"></d-cite>: take the lowest step score of each of n clean runs and set the threshold at a slightly corrected low quantile of those scores, which controls the false-alarm rate on average over draws, provided the monitored clean runs are drawn the same way as the calibration runs (exchangeable).

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-8.svg" class="img-fluid" alt="false alarms and recall under each threshold rule, τ² (A) and bfcl (B)" %}
<div class="caption" markdown="1">
**Figure 8.** Level is run; error run = any wrong step, clean run = none (V0, the benchmark's labels); the dashed line is the target of at most 10% false alarms on clean runs. The re-drawn rules use 200 random draws of n = 10, 20 and 30 calibration runs (a line joins n in order) and are evaluated on task-disjoint held-out runs of the same dataset; bars are the mean plus or minus one standard deviation of held-out false alarms across draws. The τ² draws come from the pool of all 121 scored runs (dev and test, 47 clean). The frozen-threshold points use their own samples (τ² dev, where it was chosen, hollow; τ² test; 66 fresh bfcl runs). Descriptive and post hoc; 10 to 30 clean runs make every rate coarse. Exact values at n = 20 are in Table 10 (appendix).
</div>
</div>

- **The frozen threshold does not transfer:** 16% false alarms on τ² test and 70% on bfcl.
- **Setting it from the domain's own clean runs helps, but a single draw often misses.** With 20 clean runs, conformal lands near the target on average, while the re-drawn rule still overshoots on bfcl. Either way, individual draws exceed 10% often: conformal controls the average, not each draw, and 20 runs is few.
- **Holding false alarms down costs recall, sharply where the ranking is weak.** On τ², recall stays around two thirds; on bfcl it falls to between 14% and 25%. On bfcl the monitor did not separate from its run-length baseline at run level (Lesson 1), and no threshold can make up for a weak ranking.

Exact values are in Table 10 (appendix).

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">Key takeaway</div>

Neither the monitor's probabilities nor its threshold carry over to a new domain. On bfcl, steps it gave about a 5% chance of being correct were 86% correct, and the τ² threshold gave 70% false alarms. Ten labelled runs from the new domain fixed the probabilities on bfcl and AgentRx; setting the threshold from 20 clean runs brought false alarms near the target on average, at a large cost in recall where the ranking was weak.

**What to do:**

- Check calibration on a few labelled runs from the new domain, and recalibrate only if it is off.
- Set the threshold from clean runs of the target domain, with a task-level split, and expect the false-alarm rate to vary from draw to draw at small n.
</div>

### What can distort the false-alarm rate {#what-can-distort-the-false-alarm-rate}
- **A run-level split makes the threshold look better than it is.** On the pooled 121 τ² runs (50 tasks, 200 splits), a threshold tuned for 10% false alarms gives 9.9% held-out false alarms with a run split but 13.7% with a task split. A run split lets the same tasks into tuning and evaluation and hides part of the miss.
- **Label mistakes can make it look worse.** Under the stricter label views (V1, V2), τ² test false alarms at the frozen threshold fall from 4/25 to 1/17, within the 10% target. So part of the test overshoot may come from the labels, not the threshold (Lesson 5).

**Further reading:** Angelopoulos et al. 2024 <d-cite key="angelopoulos2024crc"></d-cite>, Angelopoulos et al. 2025 <d-cite key="angelopoulos2025ltt"></d-cite>, Jung et al. 2025 <d-cite key="jung2025trustorescalate"></d-cite>, Schirmer et al. 2026 <d-cite key="schirmer2026onlinesafety"></d-cite>, Huang et al. 2026 <d-cite key="huang2026prefixguard"></d-cite>, Elkan 2001 <d-cite key="elkan2001costsensitive"></d-cite>, Guo et al. 2017 <d-cite key="guo2017calibration"></d-cite>, Platt 1999 <d-cite key="platt1999probabilistic"></d-cite>, Zadrozny and Elkan 2002 <d-cite key="zadrozny2002transforming"></d-cite>

## Lesson 5. Verify the labels, and report results under more than one reading {#lesson-5-verify-the-labels-and-report-results-under-more-than-one-reading}
On τ² test, the monitor raised 4 false alarms by the benchmark's labels. When a human re-read those runs, 3 of them contained a real mistake that the labels had missed. Under a strict reading of the policy, the monitor was right and the labels were not. How good a monitor looks depends on which labels you score it against.

**How we found the mistakes.** Cascade audits flagged 18 of the 47 τ² runs the benchmark labels clean, and a human reviewer confirmed a mistake in 14 of them. So about 30% (14 of 47) of the runs labelled clean contain a mistake, and this is a lower bound: the other 29 were audited but not flagged, and no human re-read them. Typical mistakes: the agent went ahead without the user supplying an ID that the policy requires, or stated a detail, such as a seat, that nothing in the conversation supported. The reviewer read the policy strictly and literally, so whether these count as errors depends on how strictly the policy is read, which is the point of this lesson.

**What changes for the monitor.** We score the same runs under the benchmark's labels (V0) and the two stricter views (V1 and V2, defined in Terminology).

Table 2: The frozen monitor (threshold 0.245) under three label views; run level, τ² only. V0 is the benchmark's labels; V1 is Opus-adjudicated (2 ambiguous dev runs excluded); V2 is a strict human reading of the 18 clean runs the audits flagged: 14 confirmed mistakes become error runs (7 dev, 7 test), 3 stay clean, and 1 test run with scrambled roles is excluded. The monitor caught 0 of the 7 new dev error runs and 3 of the 7 test ones. 95% Wilson intervals overlap across views (for example, test V0 false alarms [0.064, 0.347]).

<div class="l-page" markdown="1">

| Sample | V0 recall | V0 false alarms | V1 recall | V1 false alarms | V2 recall | V2 false alarms |
|---|---|---|---|---|---|---|
| Dev | 74% (28/38) | 5% (1/22) | 67% (28/42) | 6% (1/16) | 62% (28/45) | 7% (1/15) |
| Test | 67% (24/36) | 16% (4/25) | 61% (27/44) | 6% (1/17) | 63% (27/43) | 6% (1/17) |

</div>

**Why the labels missed them.** The benchmark's own judge prompt, run verbatim with Opus 5.5 on the whole run, caught only 3 of the 13 mistakes we checked it on, though it caught all 10 runs with a human-labelled error.<d-footnote>A mistake counts as caught when the judge flagged it near the message the audit pointed at. We checked the judge on the 13 mistakes confirmed in the main review; the 14th was confirmed in a separate review. All were selected because an audit flagged them, and the judge read the whole run while our audit read the prefix.</d-footnote> A lenient rubric lets these mistakes through as clean. This does not show that the benchmark labels are wrong; it shows they are one reading among several.

**How much to trust this.** Only audit-flagged runs were re-read, and the audits read each run at the monitor's lowest-scoring step, so the monitor's own scores partly chose what was checked: the drop in false alarms is a best case for the monitor, and the change in recall is likely overstated. There was a single human reviewer. Opus 5.5 was the auditor, the V1 adjudicator and the judge, so these results are not independent. The views share runs and answer different questions, so we report them side by side without a test.

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">Key takeaway</div>

Benchmark labels are one reading of the runs, not the truth. At least 14 of 47 τ² runs labelled clean contain a mistake under a strict reading, and 3 of the monitor's 4 test "false alarms" were among them: under the stricter view, test false alarms fall from 16% to 6% (a best case, since only audit-flagged runs were re-read).

**What to do:**

- Report the monitor under the benchmark's labels and under a stricter reading, side by side.
- Spot-check a random sample of the runs labelled clean, not only the ones an audit flags.
- For a firmer check, use at least three blind raters, calibrated with planted false claims and known-answer cases, and report their agreement.
- If the monitor's alerts will trigger an intervention, decide which reading of the labels that intervention enforces, and evaluate the monitor under that reading.
</div>

**Further reading:** Northcutt et al. 2021 <d-cite key="northcutt2021labelerrors"></d-cite>, Schroeder et al. 2025 <d-cite key="schroeder2025humanintheloop"></d-cite>, Zhu et al. 2025 <d-cite key="zhu2025rigorousbenchmarks"></d-cite>, Bhat et al. 2026 <d-cite key="bhat2026benchmarking"></d-cite>, Fan et al. 2026 <d-cite key="fan2026agentprocessbench"></d-cite>, Huang et al. 2026 <d-cite key="huang2026prefixguard"></d-cite>

## Lesson 6. Monitor online, audit offline, and cascade only where it pays {#lesson-6-monitor-online-audit-offline-and-cascade-only-where-it-pays}
On TheAgentCompany, with both set to the same false-alarm rate, the audit caught 11 of 15 failing runs and the monitor caught 4. The monitor is far cheaper per run, but the two are not interchangeable. So which belongs where?

We compare three ways of checking agent runs:

- **Monitor alone:** Decision-1 scores each step as the run happens, at the frozen threshold. It is the only option cheap enough to score every step while the agent acts.
- **Audit every run:** Gemini 4 Argon (effort medium) reads each finished run once, offline.
- **Cascade:** offline triage. The monitor picks which runs to audit, the audit reads them in full, and a run is flagged only if both agree.

To compare the monitor with the audit fairly, we use **matched false alarms**: we move the monitor's threshold until it flags the same number of clean runs as the audit. The threshold is chosen on the very runs being evaluated, so this is a best case for the monitor.

**Which catches more?** We compare the two on the same runs in three datasets: bfcl, R-Judge and TheAgentCompany.

- **The audit catches more, and the monitor rarely catches what the audit misses.** On every set, the monitor caught at most one failing run the audit did not.
- **The pattern is consistent but not established:** with 15 failing runs per set, no sign test survives a Holm correction.

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-9.svg" class="img-fluid" alt="which failing runs the audit and the monitor flag, at matched false alarms" %}
<div class="caption" markdown="1">
**Figure 9.** Run level, V0 labels (bfcl: any wrong step; R-Judge: unsafe; TheAgentCompany: failed run); each set has 15 failing and 15 clean runs. Bars count the failing runs flagged by both checkers, by the audit only, by the monitor only, or by neither. The audit is Gemini 4 Argon on every full run; the monitor's threshold is set in-sample so its false alarms equal the audit's (bfcl 6/15, R-Judge 1/15, TheAgentCompany 1/15). Counts, sign tests and Holm values are in Table 11; the 30 bfcl runs come from 23 tasks, so its sign test, which treats runs as independent, is somewhat optimistic.
</div>
</div>

**What does the cascade save?**

- **The saving depends on how many runs the monitor clears, and on what the monitor itself costs.** Counting the monitor's own cost, the cascade cut total checking cost by 39% on R-Judge, where the monitor clears most runs, and by 22% on bfcl, but by 0.4% on TheAgentCompany: there it skipped 23% of the audits, but the monitor costs about a quarter as much as the audit per run, which used up the saving.
- **The saving costs some failing runs,** 1 to 4 per dataset, and at these sample sizes we cannot rule out losing far more.
- **Matching the audit's recall leaves little to save:** the cascade must then still audit most runs.

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-10.svg" class="img-fluid" alt="cost per run vs recall and false alarms, by dataset, three checking policies" %}
<div class="caption" markdown="1">
**Figure 10.** One panel per dataset; top row: recall on failing runs (all five datasets); bottom row: false alarms on clean runs (bfcl, R-Judge and TheAgentCompany have 15 failing and 15 clean runs each; Who&When Pro, 30 runs, and AgentRx, 29 runs, have failing runs only). V0 labels. Policies: the monitor alone at the frozen threshold, the audit (Gemini 4 Argon) on every run, and the cascade (monitor, then audit); Table 11 gives the monitor with its threshold matched to the audit. Cost is per run, on a log scale (synchronous Argon pricing; the monitor's costs are approximate); error bars are 95% cluster-bootstrap intervals (bfcl by task, others by run). Savings and losses by dataset are in Table 12.
</div>
</div>

**Which to use, and when.**

- **While the agent acts:** only the monitor is cheap enough to run at every step. Set its threshold on the target domain (Lesson 4) and expect to trade recall for false alarms.
- **Offline, with budget for it:** audit every run. At the same false-alarm rate, it caught more failing runs than the monitor on every set here.
- **Offline, on a tighter budget:** a cascade pays off where the monitor clears many runs and costs little next to the audit (R-Judge, bfcl), and saves almost nothing where the monitor's own cost is a large share of the audit's (TheAgentCompany), at the price of some failing runs.

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">Key takeaway</div>

The cheap monitor and the strong audit are not interchangeable: at the same false-alarm rate, the audit caught more failing runs on every set (11 vs 4 on TheAgentCompany). What a cascade saves depends on how many runs the monitor clears and on the monitor's own cost (39% of total checking cost on R-Judge, 0.4% on TheAgentCompany), and it misses some failing runs.

**What to do:**

- Use the monitor online, while the agent acts, where it is the only checker cheap enough to run at every step.
- Offline, audit every run if you can afford it; use a cascade where the monitor clears many runs and costs little next to the audit, count the monitor's own cost, and check what the cascade misses.
- Compare checkers at matched false alarms, and count the runs each catches that the other misses.
</div>

### What could change the picture {#what-could-change-the-picture}
- **The cascade's best case rests on an optimistic sample.** The R-Judge runs, where the cascade saved the most, are the first sample from Lesson 3 (monitor run AUROC 0.956, against 0.861 on fresh data). A weaker monitor would alert on more clean runs and leave the cascade less to save. The bfcl runs come from 23 tasks with up to three runs each, so they are not independent.
- **Auditing only the prefix, online, did worse than auditing the full run.** On TheAgentCompany, an online cascade whose auditor reads the run only up to the monitor's alert kept many false alarms (recall 0.67, false alarms 0.53; planned before scoring). With a prompt rewritten after seeing that, it lost recall (0.40, no false alarms). The full-run audit scored 0.73 and 0.07. These results are exploratory, on 30 runs.

The τ² audit stage (Opus 5.5, with Argon checked as a replacement) and the online cascades are in Table 13; Table 14 repeats the bfcl comparison under an Opus-adjudicated label view.

**Further reading:** Greenblatt et al. 2024 <d-cite key="greenblatt2024control"></d-cite>, Hua et al. 2025 <d-cite key="hua2025costconstrained"></d-cite>, Kale et al. 2026 <d-cite key="kale2026weaktostrong"></d-cite>, Jung et al. 2025 <d-cite key="jung2025trustorescalate"></d-cite>, Kapoor et al. 2026 <d-cite key="kapoor2026hal"></d-cite>

## Lesson 7. The question you ask matters most {#lesson-7-the-question-you-ask-matters-most}
Asking the monitor whether a step is on track, rather than whether the agent is making progress, lifted τ² dev step AUROC from 0.52 to 0.88. On a privacy task, the generic question was no better than chance, while a privacy-specific one clearly separated leaking from safe outputs. Once the question was right, none of the nine other variants we tried on τ² separated from it.

Configuring a monitor means making several choices, which we call knobs: the question it is asked, the answer format, what it sees, whether the question is split into sub-criteria, the judge model and how scores are combined. Table 4 and Table 15 (appendix) list the checkers and the knobs; Table 16 gives the criteria and long-run results on R-Judge, TheAgentCompany, AMA-Bench and ITBench.

**An error-aware question beat a generic one.** On τ² dev, the error-aware `on_track` question scored 0.88 against 0.52 for a generic "progress" question. This comparison is descriptive: the question was chosen on dev and has no interval. The out-of-task check is PrivacyLens, where the generic `on_track` question scored 0.42 and a privacy-specific `privacy_ok` question 0.71, clearly above chance.<d-footnote>PrivacyLens, run level: 107 usable agent outputs of 120, leak rate 0.31; the leak labels were judged by an LLM (Gemini 4 Argon), not by humans. AUROC minus 0.5: `on_track` −0.078 [−0.201, +0.043]; `privacy_ok` +0.205 [+0.084, +0.311], which survives Holm within its family (0.004).</d-footnote>

<div class="l-page" markdown="1">
{% include figure.liquid path="assets/img/2027-04-30-who-watches-the-watcher/figure-11.svg" class="img-fluid" alt="paired effect of each knob with 95% intervals" %}
<div class="caption" markdown="1">
**Figure 11.** Panel A: τ² at step level (V0), the AUROC of each variant minus Decision-1's `on_track` question, on 60 dev runs (61 for the two frozen-test rows). Panel B: TheAgentCompany at run level (dataset label: perfect run), paired AUROC differences averaged over the Sonnet-agent and Gemini-agent samples (30 runs each for the criteria rows, 55 for the view rows), against the single holistic question (criteria rows) or the default view (view rows). Bars are 95% paired bootstrap intervals; a filled marker means the unadjusted interval excludes 0. None survives a Holm correction or passes the Benjamini-Hochberg screen within its group (Table 15). Judge: Decision-1 unless the row says Jev 1.14 or DeepSeek (the Opus-written-criteria rows use DeepSeek).
</div>
</div>

**On τ², more elaborate variants did not beat a good question** (Figure 11, panel A). None of the nine variants we compared with `on_track` separated from it: a 10-level scale, the benchmark's rubric, the full output distribution, tool schemas and checklists, one question per policy rule, a different judge, a learned combiner and an ensemble all landed within a few hundredths of it, and three were slightly worse. We set no margin in advance, so gains of up to about 0.05 cannot be ruled out. Elsewhere the picture is mixed: on ITBench, changing the judge model moved AUROC more than changing the question (+0.124 vs +0.062; neither separates from 0).

**Splitting the question into sub-criteria** (panel B, top). On TheAgentCompany, the comparison we planned before scoring, Decision-1 sub-criteria averaged against one holistic question, did not separate from 0. Taking the lowest sub-criterion score instead looked better, but it is not established and did not separate from 0 on held-out runs, and on R-Judge sub-criteria did not separate from the holistic question.<d-footnote>The planned comparison, Decision-1 `mean` minus holistic, was +0.076 [−0.024, +0.196]. The secondary `min` result, +0.113 [0.029, 0.226] (Holm 0.17), is not established and did not separate from 0 on held-out Gemini-agent runs. The weak and strong cases are different agents' runs, so the pattern is post hoc. On TheAgentCompany the `min` aggregation gave the larger gain; on R-Judge `mean` did (Table 16).</d-footnote>

**What the monitor sees moves scores more than the ranking** (panel B, bottom). Changing how much of the run the monitor sees moved its individual scores by 0.14 on average on TheAgentCompany, about seven times the 0.02 noise floor, but changed the ranking in only 2 of 9 comparisons, in opposite directions. So re-check the threshold whenever the view changes. One view needs special care: with an empty input there is nothing to criticise, and the monitor gave its highest score, 1.00, so a pipeline that sends nothing would look like the safest run.

<div class="takeaway-box" markdown="1">
<div class="takeaway-title">Key takeaway</div>

The question you ask matters most on τ²: an error-aware question lifted dev step AUROC from 0.52 to 0.88, and none of nine more elaborate formats, judges or combiners separated from it. On other datasets the view, sub-criteria and judge model sometimes mattered as much. What the monitor sees moved individual scores far more than the ranking.

**What to do:**

- Write the question for the errors you care about, and test it on the target task.
- Get the question right before tuning the answer format, rubric or combiner; on τ² none of these beat a good question.
- Re-check the threshold whenever you change what the monitor sees.
- Treat empty or missing input as an error, not as a clean run.
</div>

**Further reading:** Cook et al. 2024 <d-cite key="cook2024tick"></d-cite>, Nandwani and Gakhar 2026 <d-cite key="nandwani2026askthengrade"></d-cite>, Zhang 2026 <d-cite key="zhang2026atomicholistic"></d-cite>, Liu et al. 2023 <d-cite key="liu2023geval"></d-cite>, Advani 2026 <d-cite key="advani2026falsesuccess"></d-cite>

## Limitations of current work and future directions {#limitations-of-current-work-and-future-directions}
While we have tried to cover several aspects of the monitor evaluation, some points that matter in practice are noted below as items to work on as future directions.

### Monitoring is not intervention {#monitoring-is-not-intervention}
In our current work, we have focused on monitoring and building alerts, and measured delay in steps, recall and false alarms at matched volume. We did not build a cost model for false alarms, misses and review time. Also all of the current work is based on fixed trajectories.
The future directions would involve investigating what to do with the monitor score, for instance to change the agent's trajectory after an alert. This would involve designing tests to block an agent action, pausing for review, asking the user, restarting/repairing. Also the future directions would involve measuring what those would have done to the outcome. Offline logs cannot tell us whether a blocked bad action would have led to success, or whether blocking a good action would have hurt, because the later steps would have been different.

### State matters {#state-matters}
The monitor currently reads only the transcript. When task success depends on state outside the transcript (file state, database write, API result), a check on that state is a separate signal the monitor cannot provide. In our current work, we did not test whether adding such a check improves detection. We have not tested adversarial or sabotage agent settings, and for very long horizons we only have run-level labels (AMA-Bench, up to 525 turns), not step labels.

### Small sample sizes {#small-sample-sizes}
Our runs across multiple benchmarks have small sample sizes, so we often did not have the power to detect small differences in the performance of the monitor (at about 30 runs, our paired differences have intervals extending roughly 0.1 to 0.2 either side of the estimate, so only larger differences can be detected). Recall and false alarms come from a single scoring pass: repeated calls vary (per-step standard deviation about 0.04 on τ², 0.10 on bfcl) and step alerts near the threshold often flip, though run-level alerts were stable on the six τ² runs we repeated; two clean dev runs score between 0.245 and its unrounded value, so dev false alarms are 1/22 or 2/22 depending on the rounding. Our confidence intervals do not cover drift over time, which matters in practice. Also, in the main results, the threshold was set once on τ² dev and frozen, so no per-dataset threshold was fitted. A per-dataset threshold would have needed a validation split per dataset, which several datasets lack given their size. Most results rest on one monitor (Decision-1) and one question; the V2 labels come from a single reviewer who knew what the audit had claimed; and the PrivacyLens leak labels were judged by an LLM.

### Judges and criteria {#judges-and-criteria}
The criteria for monitoring are critical per domain. We experimented with decomposing the criteria into multiple sub-criteria. In an exploratory comparison it helped where the holistic score was weak, but did not separate from 0 on held-out runs; this may need to be refined per domain. Moreover, for long contexts, it is important to assemble the context the monitor needs to act on. We tested truncation (clipping tool outputs, a hard cap on context length) and a rule-based ledger of dropped turns; scores fell only where old turns were actually dropped. Effective compaction/memory management were not tested and remain an open area for long runs.

## Disclosures {#disclosures}
The models we evaluate come from vendors: Decision-1 (Microsoft), Gemini 4 Argon (Google) and Claude Opus 5.5 (Anthropic). We have no affiliation with these vendors. The work done is independent of any affiliation with any institution or employer. Code, prompts and experiment logs will be released with the camera-ready version. AgentRx is a Microsoft dataset and Decision-1 a Microsoft model; we did not check whether the model saw AgentRx during training. The other benchmarks are public too, so the models may have seen them in training; we did not test for this.

## Conclusion {#conclusion}
We evaluated an online step monitor (Decision-1, configured with a question and a frozen threshold, not trained), offline auditors and their cascade on public agent benchmarks, and set out seven lessons on how to measure and report them. The monitor's interval excludes its position or length baseline in 9 of 11 comparisons, but only τ² dev (run level) and Who&When Pro (step level) survive a strict correction; it does not separate on TRAIL, or on bfcl at run level. On AMA-Bench run length alone scored slightly higher (0.82 vs 0.79). We walk through different practical aspects of building and analyzing the performance of such monitor and auditor. This includes comparison with a baseline (position or length) and a recall/false-alarm tradeoff. We examine labeling quality, monitor context management, criteria for scoring and score calibration with statistical validation. 

We provide practical guidance for practitioners based on our experiments on multiple benchmark datasets. We have also highlighted some of the limitations of our settings as well as future work to address those limitations. We hope these lessons help others report monitors and auditors more carefully. 

## Appendix {#appendix}
Reference material first, then the details behind each lesson, in lesson order.

## Appendix A. Models and checkers {#appendix-a-models-and-checkers}
### Table 3. Models and access {#table-3-models-and-access}
Calls on TRAIL, ITBench and PrivacyLens used OpenRouter's private routing (no provider data collection, zero data retention); batch and public-data calls did not.

| Model | Provider and identifier | Used as | Price per million tokens |
|---|---|---|---|
| Decision-1 (Microsoft; Qwen3.5-9B post-trained) | OpenRouter, [`microsoft/microsoft-decision-1`](https://openrouter.ai/microsoft/microsoft-decision-1), decisions API | online step monitor (`on_track`) | &#36;0.042 input, no output charge; 32,768-token context |
| Jev 1.13 and 1.14 (TypeSafe) | OpenRouter, [`typesafe/jev-1.13`](https://openrouter.ai/typesafe/jev-1.13) and [`typesafe/jev-1.14`](https://openrouter.ai/typesafe/jev-1.14) | alternative monitor and criteria judge | &#36;0.042 input; 64K and 262K context |
| Clef (Cloudflare, 27B) | OpenRouter, [`cloudflare/clef`](https://openrouter.ai/cloudflare/clef) | alternative monitor on AMA-Bench | &#36;0.042 input; 65K context |
| DeepSeek V4.1 Flash | OpenRouter, [`deepseek/deepseek-v4.1-flash-1017`](https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017), provider pinned to Cloudflare with private routing, thinking off | expected-score judge from first-token logprobs | &#36;0.10 input (Cloudflare) |
| Gemini 4 Argon (Google) | OpenRouter, [`google/gemini-4-argon`](https://openrouter.ai/google/gemini-4-argon), effort medium; batch variant used where noted | auditor; judge of the PrivacyLens leak labels | &#36;2 input and &#36;10 output (including internal reasoning); batch half price; 1M context |
| Claude Opus 5.5 (Anthropic) | run through a Claude subscription | auditor, V1 adjudicator, criteria writer, judge of the benchmark's own prompt | API available on [OpenRouter](https://openrouter.ai/anthropic/claude-opus-5.5) lists &#36;4 input and &#36;20 output (read 2026-11-20) |

### Table 4. The checkers in this post {#table-4-the-checkers-in-this-post}
Per-token prices are in Table 3.

| Checker | Role | Sees | Cost per run | Repeat noise (per-step SD, K = 5) |
|---|---|---|---|---|
| Decision-1 (`on_track`, P(yes)) | Online step monitor | Prefix only | about &#36;0.002 | 0.04 (τ², 6 runs); 0.10 (bfcl) |
| Jev 1.13 / 1.14 | Alternative monitor; criteria judge | Prefix (1.13); full run (1.14) | about &#36;0.0004 (AMA-Bench) | 0.02 |
| Clef | Alternative monitor, AMA-Bench only | Full run | about &#36;0.001 | not measured |
| DeepSeek V4.1 Flash | Expected-score judge (logprobs of a 1–9 digit) | Prefix or full run | about &#36;0.002–0.003 | not measured |
| Gemini 4 Argon | Offline audit; prefix audit in the online arms | Full run or prefix | about &#36;0.02 (batch &#36;0.012) | one call per run |
| Opus 5.5 | τ² audit stage; V1 adjudicator; judge | Full run, prefix or one step | subscription | one call per run |

## Appendix B. Lesson 1 details: the baseline comparisons {#appendix-b-lesson-1-details-the-baseline-comparisons}
### Table 5. The eleven monitor-versus-baseline comparisons {#table-5-the-eleven-monitor-versus-baseline-comparisons}
Monitor minus its baseline (step index at step level; run length at run level, its direction fixed once from the full sample), with 95% bootstrap intervals. Jackknife p-values set the labels; bootstrap p-values are shown for comparison; Holm and Benjamini-Hochberg are over the eleven comparisons.

<div class="l-page" markdown="1">

| Comparison | Level | Baseline | Monitor minus baseline [95% interval] | Clusters | p (jackknife) | Holm (m = 11) | BH (m = 11) | p (bootstrap) | Holm, bootstrap | Label |
|---|---|---|---|---|---|---|---|---|---|---|
| τ² dev | step | step index | +0.109 [+0.026, +0.183] | 36 tasks | 0.013 | 0.109 | 0.023 | 0.014 | 0.070 | Likely, not established |
| τ² test | step | step index | +0.185 [+0.077, +0.315] | 14 tasks | 0.012 | 0.109 | 0.023 | 0.002 | 0.022 | Likely, not established |
| AgentRx | step | step index | +0.192 [+0.054, +0.338] | 29 runs | 0.022 | 0.111 | 0.035 | 0.006 | 0.036 | Likely, not established |
| Who&When Pro (130 traces) | step | step index | +0.152 [+0.105, +0.199] | 130 traces | < 0.001 | < 0.001 | < 0.001 | 0.002 | 0.022 | Established |
| bfcl (96 runs) | step | step index | +0.183 [+0.077, +0.323] | 41 tasks | 0.012 | 0.109 | 0.023 | 0.002 | 0.022 | Likely, not established |
| TRAIL GAIA | step | step index | +0.021 [−0.089, +0.085] | 30 runs | 0.656 | 0.656 | 0.656 | 0.733 | 0.733 | Not separable |
| τ² dev (60 runs) | run | run length | +0.261 [+0.114, +0.413] | 36 tasks | 0.002 | 0.016 | 0.009 | 0.004 | 0.032 | Established |
| τ² test (61 runs) | run | run length | +0.236 [+0.086, +0.402] | 14 tasks | 0.012 | 0.109 | 0.023 | 0.004 | 0.032 | Likely, not established |
| R-Judge (fresh, 100 runs) | run | run length | +0.157 [+0.021, +0.323] | 37 task texts | 0.057 | 0.229 | 0.071 | 0.030 | 0.120 | Exploratory |
| bfcl (96 runs) | run | run length | +0.120 [−0.075, +0.285] | 41 tasks | 0.222 | 0.444 | 0.244 | 0.242 | 0.483 | Not separable |
| TheAgentCompany (30 runs) | run | run length | +0.211 [+0.015, +0.432] | 30 runs | 0.058 | 0.229 | 0.071 | 0.040 | 0.120 | Exploratory |

</div>

The comparison family and the jackknife p-values were chosen after the first results were seen; clustering R-Judge by its 20 scenarios, the unit planned before scoring, instead of its 37 task texts gives +0.157 [−0.015, +0.371], not separable.

Table 6: Monitor vs position baselines, step AUROC (V0). The absolute index is known online; the relative position needs the final run length. τ² has 751 (dev) and 764 (test) labeled steps; the monitor's 95% interval is in brackets.

| Sample | Wrong steps | Monitor | Absolute index | Relative position |
|---|---|---|---|---|
| τ² dev | 200 | 0.875 [0.82, 0.925] | 0.766 | 0.745 |
| τ² test | 196 | 0.915 [0.887, 0.946] | 0.729 | 0.733 |
| AgentRx | 28 | 0.899 | 0.707 | 0.748 |
| bfcl (96 runs, as in Figure 3) | 170 | 0.702 | 0.519 | 0.512 |

Table 7: Monitor step AUROC within position bands on τ², wrong steps in brackets. Early bands have few wrong steps, so their values are unstable.

| Band | Dev | Test |
|---|---|---|
| Steps 1–3 | 1.000 (3) | 0.935 (8) |
| Steps 4–6 | 0.911 (32) | 0.872 (35) |
| Steps 7+ | 0.787 (165) | 0.879 (153) |
| First third of the run | 0.958 (8) | 0.905 (12) |
| Middle third | 0.902 (71) | 0.907 (68) |
| Last third | 0.752 (121) | 0.869 (116) |

**A trained text baseline.** A TF-IDF classifier trained on the runs' own text (five-fold, split by task), run level: on τ² (121 runs) it scored far below the monitor (−0.212 [−0.341, −0.079]); on bfcl (96 runs) it scored 0.77 against the monitor's 0.63, a difference that does not separate from 0 (+0.141 [−0.083, 0.324]).

## Appendix C. Lesson 2 details: recall at fixed false-alarm budgets {#appendix-c-lesson-2-details-recall-at-fixed-false-alarm-budgets}
### Table 8. Recall at a fixed false-alarm budget, monitor vs run length {#table-8-recall-at-a-fixed-false-alarm-budget-monitor-vs-run-length}
Run level, V0. Thresholds are set for at most 5, 10 or 20% false alarms on clean runs; the realised rate is in brackets. The baseline is the number of scored steps (no direction chosen). Paired 95% bootstrap intervals by task (TheAgentCompany: by run).

| Sample | Budget | Monitor recall (realised false alarms) | Run-length recall (realised false alarms) | Monitor minus run length [95% interval] |
|---|---|---|---|---|
| τ² dev (60 runs) | 5% | 0.74 (4%) | 0.21 (4%) | +0.53 [+0.23, +0.77] |
| τ² dev (60 runs) | 10% | 0.74 (9%) | 0.21 (4%) | +0.53 [+0.24, +0.77] |
| τ² dev (60 runs) | 20% | 0.79 (18%) | 0.24 (14%) | +0.55 [+0.15, +0.73] |
| τ² test (61 runs) | 5% | 0.64 (4%) | 0.14 (4%) | +0.50 [+0.02, +0.70] |
| τ² test (61 runs) | 10% | 0.67 (8%) | 0.25 (8%) | +0.42 [+0.00, +0.71] |
| τ² test (61 runs) | 20% | 0.72 (20%) | 0.31 (20%) | +0.42 [+0.07, +0.65] |
| bfcl (96 runs) | 5% | 0.08 (4%) | 0.04 (4%) | +0.04 [−0.12, +0.36] |
| bfcl (96 runs) | 10% | 0.15 (8%) | 0.10 (6%) | +0.04 [−0.16, +0.43] |
| bfcl (96 runs) | 20% | 0.40 (19%) | 0.17 (17%) | +0.23 [−0.10, +0.46] |
| TheAgentCompany (30 runs; not in the figure) | 5% | 0.13 (0%) | 0.07 (0%) | +0.07 [+0.00, +0.59] |
| TheAgentCompany (30 runs; not in the figure) | 10% | 0.27 (7%) | 0.07 (0%) | +0.20 [+0.00, +0.71] |
| TheAgentCompany (30 runs; not in the figure) | 20% | 0.67 (20%) | 0.13 (20%) | +0.53 [+0.00, +0.75] |

## Appendix D. Lesson 4 details: calibration and thresholds {#appendix-d-lesson-4-details-calibration-and-thresholds}
### Table 9. Calibration after recalibrating on 10 runs {#table-9-calibration-after-recalibrating-on-10-runs}
Step level, V0. ECE (lower is better; descriptive) on test steps, the mean of 200 draws of 10 labelled calibration runs from the new domain; test steps are fresh runs (bfcl, Who&When Pro) or the held-out half (AgentRx). The last column uses a map fitted on τ² dev.

<div class="l-page" markdown="1">

| Dataset (test steps) | Raw | Intercept shift | Isotonic | Platt (slope) | Isotonic fitted on τ² |
|---|---|---|---|---|---|
| bfcl (fresh runs, 664 steps) | 0.222 | 0.116 | 0.071 | 0.214 | 0.140 |
| AgentRx (held-out half) | 0.163 | 0.053 | 0.050 | 0.064 | 0.136 |
| Who&When Pro (fresh runs) | 0.035 | 0.054 | 0.069 | 0.077 | 0.076 |

</div>

### Table 10. Threshold rules at n = 20 {#table-10-threshold-rules-at-n-20}
Run level, V0; target at most 10% false alarms on clean runs; bfcl is the 66 fresh runs. The re-drawn and conformal rows are the mean of 200 draws of 20 calibration runs, evaluated on task-disjoint held-out runs (τ² draws from all 121 runs, 47 clean); "draws above 10%" is the share of draws whose held-out false-alarm rate exceeds 10%.

<div class="l-page" markdown="1">

| Rule | τ²: false alarms | τ²: draws above 10% | τ²: recall | bfcl: false alarms | bfcl: draws above 10% | bfcl: recall |
|---|---|---|---|---|---|---|
| Frozen threshold, applied once | dev 5% (1/22); test 16% (4/25) | n/a | dev 74%; test 67% | 70% (23/33) | n/a | 88% |
| Largest threshold with at most 10% false alarms on k clean runs (the frozen rule, re-drawn), n = 20 | 9% | 35% | 68% | 17% | 56% | 25% |
| Conformal <d-cite key="angelopoulos2024crc"></d-cite>, n = 20 | 6% | 20% | 64% | 9% | 29% | 14% |

</div>

## Appendix E. Lesson 6 details: monitor, audit and cascade {#appendix-e-lesson-6-details-monitor-audit-and-cascade}
### Table 11. Monitor, audit and cascade at matched false alarms {#table-11-monitor-audit-and-cascade-at-matched-false-alarms}
Run level; 15 failing and 15 clean runs per set; the audit is Gemini 4 Argon on the full run. Cells give failing runs caught, with false alarms in brackets. Monitor columns use an in-sample threshold matched to the policy's false alarms; paired columns count runs only one checker caught, with exact two-sided sign tests. None of the six survives Holm (smallest adjusted p 0.235).

<div class="l-page" markdown="1">

| Set | Audit every run | Monitor, matched to the audit | Runs only the audit / only the monitor catches | Cascade (monitor then audit) | Monitor, matched to the cascade | Runs only the cascade / only the monitor catches | Monitor threshold (audit / cascade) | Sign test p (audit / cascade) |
|---|---|---|---|---|---|---|---|---|
| bfcl (error run = any wrong step) | 10/15 (6/15) | 5/15 (6/15) | 6 vs 1 | 7/15 (5/15) | 5/15 (5/15) | 3 vs 1 | 0.085 / 0.068 | 0.125 / 0.625 |
| R-Judge (unsafe / safe) | 14/15 (1/15) | 13/15 (1/15) | 2 vs 1 | 13/15 (1/15) | 13/15 (1/15) | 1 vs 1 | 0.223 / 0.223 | 1.000 / 1.000 |
| TheAgentCompany (failed / perfect run) | 11/15 (1/15) | 4/15 (1/15) | 8 vs 1 | 10/15 (1/15) | 4/15 (1/15) | 7 vs 1 | 0.023 / 0.023 | 0.039 / 0.070 |

</div>

Table 12: The cascade against auditing every run, monitor at the frozen threshold (Figure 10). Total cost counts the monitor and the audits; failing runs missed are those the audit catches and the cascade does not. Across datasets the cascade sends 17% to 47% fewer runs to the audit, the 95% Wilson upper bound on the share of failing runs lost is 30% to 45%, and matching the audit's recall would need 70% to 100% of runs audited.

<div class="l-page" markdown="1">

| Dataset | Monitor alone: false alarms | Total cost saved | Audit spend saved | Failing runs missed | Monitor cost as a share of the audit's |
|---|---|---|---|---|---|
| bfcl | 73% (11/15) | 22% | 28% | 3 | 7% |
| R-Judge | 13% (2/15) | 39% | 40% | 1 | 0.6% |
| TheAgentCompany | 67% (10/15) | 0.4% | 23% | 1 | 23% |
| Who&When Pro | n/a (failing runs only) | 28% | 29% | 4 | 1.5% |
| AgentRx | n/a (failing runs only) | 4.5% | 15% | 4 | 10% |

</div>

### Table 13. Other designs cited in the text {#table-13-other-designs-cited-in-the-text}
Each group is its own experiment; compare rows within a group only. All exploratory.

| Group | Design | Recall | False alarms | Audits |
|---|---|---|---|---|
| τ² cascade (Opus audits the monitor's lowest-scoring step) | dev | 9/10 monitor-missed runs | V0 7/22 (4/22 at cutoff 0.6, post hoc); V1 1/16 | 32 runs |
| | test, cutoff 0.6 planned before scoring | 9/12 | V0 8/25; V1 1/17 | 37 runs |
| Argon in place of Opus (τ² dev, 20 runs) | same prompt; verdicts agree on 14 of 15 | 9/10 | 2/10 | 20, about &#36;0.017 each |
| TheAgentCompany (30 runs, 15 failed + 15 perfect) | monitor alone, frozen threshold | 0.87 | 0.67 | 0 |
| | Argon on the full run | 0.73 | 0.07 | 30 |
| | online, first prompt: prefix at the first alert (planned before scoring; failed) | 0.67 | 0.53 | 0.77 per run |
| | online, prompt rewritten after the first (not held out) | 0.40 | 0.00 | 0.77 per run |

### Table 14. bfcl under two label views {#table-14-bfcl-under-two-label-views}
Table 11's bfcl comparison under a second label view. V1 takes Opus 5.5's blind verdict on the 11 runs where the audit and the benchmark label disagree, so it favours the audit by construction; it is a second view, not a corrected truth.

<div class="l-page" markdown="1">

| bfcl label view | Error / clean runs | Audit every run: recall (false alarms) | Cascade: recall (false alarms) | Monitor at frozen threshold: recall (false alarms) | Monitor matched to the audit: recall (false alarms) | Failing runs only the audit / only the monitor catches |
|---|---|---|---|---|---|---|
| V0: the benchmark's labels | 15 / 15 | 10/15 (6/15) | 7/15 (5/15) | 10/15 (11/15) | 5/15 (6/15) | 6 vs 1 |
| V1: Opus-adjudicated (11 disagreements) | 20 / 10 | 16/20 (0/10) | 12/20 (0/10) | 15/20 (6/10) | 2/20 (0/10) | 14 vs 0 |

</div>

## Appendix F. Lesson 7 details: the knobs {#appendix-f-lesson-7-details-the-knobs}
### Table 15. The knobs we turned and what moved {#table-15-the-knobs-we-turned-and-what-moved}
Decision-1 and τ² dev step AUROC (V0) unless a row says otherwise. Holm and Benjamini-Hochberg are applied within each group drawn in Figure 11 (nine τ² variants, eight sub-criteria contrasts, four Opus-written-criteria contrasts, nine view changes), with approximate p-values: Holm-adjusted p for the filled rows is 0.12 to 0.61 and the best Benjamini-Hochberg value is 0.097, so none passes (the per-rule frozen-test interval ends at −0.0003). The τ² rows are a subset of about twenty variants, so these Holm values are lower bounds.

| Knob | What we changed | Effect | Status |
|---|---|---|---|
| **Question content** | Error-aware questions vs a generic "progress" question | `on_track` 0.88; `corrected` 0.85; `step_ok` 0.83; `grounded` 0.69; generic `progress` 0.52 (τ² dev); no combination beats `on_track` | Descriptive; chosen on dev |
| Question vs model on ITBench | Generic vs task-specific question, Decision-1 vs DeepSeek | DeepSeek generic 0.71, task-specific 0.77; Decision-1 generic 0.58; question effect +0.062 [−0.076, +0.204], model effect +0.124 [−0.047, +0.279]; neither interval excludes 0; power 12–17% | Exploratory, underpowered |
| Question content on a different task | Generic `on_track` question vs a privacy-specific `privacy_ok` question (PrivacyLens, run level; sample and label in the Lesson 7 footnote) | AUROC `on_track` 0.42, `privacy_ok` 0.71; at the frozen threshold, they catch 3% and 12% of leaks with 5% of clean outputs alerted. | Descriptive; LLM-judged label; one dataset |
| Answer scale | 10-level severity instead of yes/no | 0.84 vs 0.88, −0.034 [−0.069, −0.004]; its run-level edge did not replicate on test | Exploratory (worse on dev); did not replicate on test |
| Rubric framing | The benchmark's rubric as a three-way choice | −0.032 [−0.057, −0.002]; the model predicts "neutral" for 143 of 764 steps against 13 for humans (about 11 times as often) | Exploratory (worse) |
| Context in the prompt | Full tool schemas and policy checklists | −0.011 [−0.029, +0.010] | Not separable |
| Question per rule | One yes/no question per policy rule (`combo_min`) | dev +0.017 [−0.004, +0.043]; frozen test −0.023 [−0.054, −0.000]; alerts on successful runs rise 40% to 63% | Exploratory (dev not separable; worse on frozen test) |
| Output readout | Full output distribution, `confidence` | −0.029 [−0.056, 0.000]; `confidence` AUROC 0.54 inside the uncertain band | Not separable |
| **Criteria decomposition and aggregation** | Split one judgment into sub-criteria; combine by mean, min, weighted | TheAgentCompany: `min` minus holistic +0.113 [0.029, 0.226] (Decision-1, Holm 0.169); it helped where the holistic score was weak (Sonnet runs, 0.77 → 0.92–0.93), not where strong (Gemini runs), and did not separate from 0 on held-out runs. R-Judge: not separable (Table 16). | Exploratory, inconclusive |
| Derived criteria | Opus 5.5 wrote 199 criteria from the task text only; DeepSeek judge | derived minus holistic +0.05 [−0.04, +0.16] (Sonnet), +0.01 [−0.09, +0.11] (Gemini); between holistic and the given checkpoints | Not separable |
| **The view** | Tool outputs clipped at 500 or extended to 6,000 characters; conversation capped at 15K (old turns dropped) | Scores move 0.14 against a 0.02 noise floor (TheAgentCompany); 2 of 9 AUROC differences exclude 0 (6,000-character outputs +0.092 [0.024, 0.182]; 15K cap −0.105 [−0.197, −0.030]), and neither survives Holm or Benjamini-Hochberg; the cap lowers scores only in the 37 runs where old turns were dropped. Unlike sabotage monitoring, where less information often helps <d-cite key="arike2026information"></d-cite>. | Exploratory (two cells exclude 0; none passes BH) |
| Combining signals | A learned combiner of four signals; ensembles; a z-average with TF-IDF | combiner −0.006 [−0.020, +0.008] (frozen test); ensemble min(Decision-1, Jev 1.13) +0.021 [−0.004, +0.052] (dev); z-average bfcl +0.107 [−0.077, +0.275], τ² −0.016 [−0.092, +0.053] | Not separable |

Not drawn in Figure 11, and none better than `on_track`: other signals from the same calls (P(clean), expected severity, P(level ≥ 8, 6, 9), confidence, `on_track` × confidence, min and mean combinations), the mean, low-3 and min-2 aggregations of the per-rule questions, the `corrected`, `step_ok`, `grounded` and generic-progress wordings, and a rule-based grounding ledger (AUROC 0.52). Only P(clean), 0.036 below `on_track`, has an unadjusted interval that excludes 0.

### Table 16. Criteria and long runs on other benchmarks {#table-16-criteria-and-long-runs-on-other-benchmarks}
Exploratory checks on R-Judge, TheAgentCompany, AMA-Bench and ITBench; intervals are paired bootstrap intervals.

| Result | Setting | Numbers | Status |
|---|---|---|---|
| Criteria on R-Judge | 100 runs, 37 task clusters; Opus-written safety criteria; Decision-1 and Jev 1.14 | Run AUROC holistic / mean / min: Decision-1 0.906 / 0.967 / 0.936, Jev 0.941 / 0.958 / 0.959; planned comparison, Decision-1 `min` minus holistic, +0.030 [−0.079, +0.111] | Not separable |
| Opus-written criteria (TheAgentCompany) | 199 criteria for 54 tasks, from the task text only; DeepSeek judge | derived minus holistic +0.05 [−0.04, +0.16] (Sonnet runs), +0.01 [−0.09, +0.11] (Gemini runs); planned rule not met; 0 of 72 hidden checkpoint details reproduced | Not separable |
| Long runs and dropped turns | AMA-Bench (208 runs, up to 525 turns; within-domain pair accuracy); ITBench (90 runs; AUROC) | no decline across turn bins (0.69–0.86); final cut 0.79 vs run length 0.82 (post hoc); untruncated view +0.049 [−0.028, +0.134]; ledger of dropped turns +0.031 [−0.059, +0.126]; ITBench full vs monitor view +0.092 [−0.006, +0.213] | Not separable |
