---
layout: distill
title: "Two Fragments, or Silence"
description: A personal agent that already holds memories a person chose to share should default to silence. The only other action returns two original fragments and one gap or causal constraint already written in those texts. Semantic nearness is not a trigger, a feeling of insight is not evidence, and whether an interruption is worth making is left open.
date: 2027-04-30
future: true
htmlwidgets: true

# anonymize when submitting
authors:
  - name: Anonymous

# must be the exact same name as your blogpost
bibliography: 2027-04-30-two-fragments-or-silence.bib

toc:
  - name: One meeting, two fragments
  - name: The agent already remembers
  - name: Nearness is the cheap stage
  - name: Silence is the default
  - name: What a delivery is allowed to contain
  - name: Aha is not evidence
  - name: Where the memories live
  - name: What would show the policy is idle
---

A personal agent already holds notes one person chose to keep, including early memories they chose to share. The usual action with that store is retrieval plus generation. Return whatever sits near the sentence being written, or produce a paragraph when asked. The open question is narrower. When may the agent interrupt, and how little may it hand back?

The claim is one decision policy. It is not a new theory of analogy, and it is not a measured insight. The default is silence. The only other action returns two original fragments and one gap or causal constraint already written in those texts. The person still restructures the problem. Whether an interruption is worth making is left open. A feeling of insight is not evidence that it was.

The case below is an illustration of that rule, not a result.

## One meeting, two fragments

Someone keeps notes on a recurring planning meeting and confirms two fragments. They name the clusters.

Overrun. "The afternoon planning meeting usually runs past four, but the notes say it ended at half past three." What is missing: who held the previous item open.

Headcount. "The reimbursement count is short the people who stayed after an item was held open." What is missing: the attendance list for the people who stayed.

On Tuesday they only rewrite the agenda. "Someone keeps holding the previous item open, so I am moving the vote up." That page meets the overrun note and not the headcount note. The agent stays silent. It does not call a model. A search for notes that mention the meeting would have returned both fragments. This rule does not.

On Thursday they write: "I cannot tell whether we ran long because the same people stayed, and I still do not have the attendance list for those who stayed after an item was held open." Both missing-pieces meet this sentence, and the person is treating the clusters as separate matters. Only then may the agent sample.

A passing card has four cells. The Thursday sentence. The overrun note, unchanged. The headcount note, unchanged. One line already in the stored text: the headcount note's "people who stayed after an item was held open." There is no summary. A sample that only repeats the Thursday sentence, or that adds an instruction to merge the two projects, is dropped with the rest of its set, including the fluent sentence.

Later, the person may change the cut in their own words: these are not two projects until the list exists, so the next step is to get the list. Recognizing the notes, or finding the card clever, does not count. If they cannot say that without reading the card back, it does not count either. Still later, the list may show that staying late and the short count were the same fact, or it may show they were not. That third record is separate. The card made a candidate traceable. It did not make the link true.

## The agent already remembers

The agent runs for one person. It reads memories that person chose to place there. It does not read weights or hidden states, and it does not compose a childhood the person never told.

A fragment that can be returned is an unfinished observation, a fact that does not fit, or two accounts that obstruct each other. Each one is stored with its source and with a failure index: what is absent, or what situation would make it relevant again. In the meeting notes, "who held the previous item open" and "the attendance list for the people who stayed" are those indices. A topic word or a mood is not one. A conclusion can point at a fragment. It is not the material.

The index is the opportunistic-assimilation claim. At an impasse, a person stores what is missing, and a later feature of the situation retrieves that unsolved problem. Retrieval is not the new cut <d-cite key="seifert1995demystification"></d-cite>. Unsolved problems are remembered better when they are uncommon. A store that marks everything as stuck has thrown the index away <d-cite key="patalano1994memory"></d-cite>.

Clusters are names the person assigns to matters they are still treating as separate. A model that first partitions the store will call neighbors a pair of clusters, and the far question never gets asked. That question is whether two clusters lie under one constraint once "they are two problems" is set down.

The wide constraint is what an impasse hides, so it is not filled in while stuck. On matchstick arithmetic, a constraint of wider scope was harder to release, and transfer followed the type of constraint rather than the surface of the puzzle <d-cite key="knoblich1999constraint"></d-cite>. The policy borrows the question, not a solver and not the solution rate. While a path still meets its own criterion, as on Tuesday, the agent does not open a change of representation. Progress monitoring, a second account of impasse, supports that restraint and leaves the more general mechanism open <d-cite key="macgregor2001information,jones2003testing"></d-cite>.

## Nearness is the cheap stage

Documented tools return neighbors during writing <d-cite key="devonthink2026,mem2026,smartconnections2026"></d-cite>, a far prompt at query time <d-cite key="chan2018solvent,hope2018analogy,infranodus2026"></d-cite>, or a clocked highlight, synthesis, or answer <d-cite key="notebooklm2024,khoj2026,readwise2026"></d-cite>. None of those interfaces states the rule above. That is not a finding that they could not.

Analogy maps relations rather than object attributes <d-cite key="gentner1983structure"></d-cite>. A cheap content vector recalls surface neighbors, and structural alignment comes after <d-cite key="forbus1995macfac"></d-cite>. A remote story can sit unused until a specific cue. In lab meetings the distant analogies often explained a point to other people and were later forgotten <d-cite key="gick1980analogical,gick1983schema,dunbar2000scientists"></d-cite>. A shared relation is not the same thing as surface similarity <d-cite key="mednick1962associative"></d-cite>. Far relations on public texts are already returned while a person is generating <d-cite key="hope2018analogy,chan2018solvent"></d-cite>. What is missing is the decision to stay silent on Tuesday. Spending the model call on the nearest note repeats the cheap stage.

Fluent models largely recognize near narrative analogies. GPT-4 scored below chance on far ones in a zero-shot setting <d-cite key="sourati2024arn"></d-cite>. Two real quotations do not make the proposed relation true.

## Silence is the default

Before any generative call, current work is compared only with confirmed failure indices. One cluster, or a gray zone where no pair is clearly nearer than the rest, is silence and zero model calls. Two different clusters, both matching and both nearer than the rest, may be sampled. That comparison is the only gate a first instrument runs.

A violated constraint and a causal mediator are checked only after the gate, by pointing into stored sentences, not by embeddings. Personal stake may bring two clusters up. "Both sides are like this" does not pass. These three are part of the policy and are not claimed as tested. A sample that invents a bridge word, disagrees on the relation, or swaps an endpoint is dropped with its set <d-cite key="sourati2024arn,knoblich1999constraint"></d-cite>.

The rule is conservative because the costs are unequal. A false delivery can be taken up as the person's own judgment. A missed link can return. It does not estimate what an interruption is worth. A fixation is easier to leave after a delay than by pressing on, once a misleading cue has been planted <d-cite key="smith1991incubation"></d-cite>. The agent cannot forget on the person's behalf. During continuous work it does not light the same cluster again. Setting a problem aside sometimes helps, and the mechanism is not one thing <d-cite key="sio2009incubation,wallas1926art"></d-cite>. An empty cycle writes no paragraph. Asking for an insight now is not a collision <d-cite key="gick1980analogical"></d-cite>. Nothing is read from weights, a hidden state, or a prepared-mind signal <d-cite key="beaty2016creative,kounios2006prepared"></d-cite>.

## What a delivery is allowed to contain

A pass is traceable. It is not proof.

| Stage | Question | If not |
| --- | --- | --- |
| Context | Do two clusters' failure indices meet this work, outside either cluster? | Silence |
| Retrieve | Are both endpoints stored fragments with source text? | Discard |
| Relation | Is one gap, dropped constraint, or in-text causal link named? | Discard |
| Deliver | Is the message only those texts plus that item, tied to this work? | Silence |
| Later | Did the cut or the next step change, and can the person restate it? | Not a success |

At delivery the log records only whether the person recognizes the two fragments. If they do not, the delivery failed. Later, three outcomes stay apart. The cut or the next step changed. The person can restate the link without repeating the card. Subsequent work supports the link. The first two can hold for a false story. In the meeting notes, fetching the list is a changed next step. Whether staying late and the short count were one cause is the third record.

## Aha is not evidence

On magic problems, 417 of 1,124 incorrect solutions scored above the mean aha of the correct ones <d-cite key="danek2017false"></d-cite>. A locally coherent attempt can miss the real problem space <d-cite key="ohlsson1984restructuring"></d-cite>. Fluency and a nod are not the later questions.

## Where the memories live

Where the store lives is a separate hypothesis. It does not decide whether the rule helps.

Childhood memories the person chose to share, and personal stakes, are not entries in a company memory other people can read. Mixing them into a shared store threatens privacy and control. It does not, by itself, show that silence would then stop helping. A private store on infrastructure a company pays for does not, by itself, show that the policy helps.

Deleting a fragment removes the edges and undelivered candidates that depend only on it. There is no view onto another person's graph. After the person has chosen a next step, the only message that may cross to a work agent is a task constraint they release in their own words. Fragments, early memories, stakes, and failure indices stay behind. The work agent does not run this policy.

## What would show the policy is idle

No result in this post is an insight measured on a person. The meeting notes illustrate the rule. A log of silence is not a measurement of insight. The instrument is one person, real work, and cases, not puzzle solution rates. Log silence with no generative call, discards with reasons, and deliveries of two originals plus one gap or constraint. The first gate uses only failure indices. The other triggers stay untested. The person answers the later questions.

Baselines are a neighbor list, a request to generate an insight now, and a review clock.

A closed loop with one user, who also wrote the rule, only calibrates the instrument. It checks that the gate stays silent, that the logs are complete, and that entry is cheap enough to continue. It does not falsify the claim that a four-cell delivery changes the cut more often than those baselines. Restructuring happens once, so the same materials cannot take more than one strategy. The comparisons that could falsify the policy assign one strategy to each pair of problems, and the scorer does not know which strategy the pair received.

The following observations, on that later comparison, would falsify the proposal in this form.

- Recognized neighbor reminders match typed deliveries on a later change in the cut or the next step. The extra constraint check is then idle.
- The person usually cannot restate the link without repeating the card. The format has closed the restructuring.
- Prompts during within-cluster work, where this policy stays silent, produce as many later changes. The gate should not be kept <d-cite key="smith1991incubation"></d-cite>.
- Stake alone, with no named gap, dropped constraint, or causal link in the texts, meets the later criteria. The recall-only rule is then too strong.
- A bridge word in neither text works as well as a relation already written in both. The check has collapsed into the far-analogy failure already measured <d-cite key="sourati2024arn"></d-cite>.
- The two later questions hold while subsequent work fails to support the link. Traceability was mistaken for truth.
- Aha, fluency, or a nod predicts those questions better than the three-material check <d-cite key="danek2017false"></d-cite>.
- Unreleased childhood or stakes are readable by others. The governance hypothesis is then too strong. That result does not refute the intervention rule.

Many days with nothing delivered, when the reasons match the materials, do not falsify the policy. Dozens of deliveries in a day show that the gate failed open. That stops the calibration. It is not yet the comparison above. The decision left open is when returning two fragments and one constraint is worth the interruption.
