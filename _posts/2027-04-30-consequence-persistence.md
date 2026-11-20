---
layout: distill
title: "Consequence Persistence: Admission Control for Open Agent Meshes"
description: Open agent meshes can fail while every request stays valid. A consequence persistence layer checks a signed header before the payload, keeps a subjective viability score by identity and task, and makes viability fall much faster than it recovers. The price of a fresh identity, false isolation of long tasks, and the receiver's cost of holding a delay are left open.
date: 2027-04-30
future: true
htmlwidgets: true

# anonymize when submitting
authors:
  - name: Anonymous

# must be the exact same name as your blogpost
bibliography: 2027-04-30-consequence-persistence.bib

toc:
  - name: Every request can be valid
  - name: What current tools remember
  - name: A header before the payload
  - name: Viability is local
  - name: Delay has to land on the sender
  - name: The penalty reads a counter
  - name: Hysteresis stops reuse, not a new key
  - name: Signed gossip still lies about harm
  - name: The measurement that is still missing
---

An agent that fails to get a resource does not stop. It rewrites the call and tries again, because its objective is the task. Each attempt can be schema-valid, signed, and well under any per-request cap. The shared service still falls over. Nothing in the protocol added up who was speaking.

This post is a mechanism-design agenda for that failure. It is not a finished system, and it reports no measurements. The proposal is a consequence persistence layer for admission among strangers. Peers that share an operator, and can govern their own planners, are a different game. They are mentioned only to keep the two games apart.

## Every request can be valid

Open meshes are full of optimizers. A semantic protocol can say which tools are visible, which schemas are valid, and which capabilities a peer advertises. It does not say how often a peer may speak, and it does not remember who spoke. A gateway that authorizes each request on its own has topology amnesia. Under that amnesia a shared service is a commons <d-cite key="hardin1968tragedy"></d-cite>. The locally rational move is to export load onto whoever still answers.

Repeat that move against a gateway with no identity memory and you get a retry storm. Every message is well-formed. The damage is the sequence.

Call the missing object a consequence persistence layer. Its state outlives the request and is indexed by peer identity. Its first frame is a governance header, checked before the payload is interpreted. Its memory is a subjective viability score. Its friction is injected latency, a cost inside the sender's own objective, rather than an error that invites another attempt. Its recovery is asymmetric. Viability is required to fall much faster than it is allowed to return. When a peer's score for an identity drops through that peer's threshold, the identity leaves that peer's eligible-neighbor set. No registry expels anyone from the mesh. The identity simply stops being a neighbor of the peers that dropped it.

We do not claim this layer solves open-mesh coordination. Fresh identities reset identity-bound penalties. Gossip can isolate a faithful long-running task. Capacity control does not inspect a prompt injection. Those limits are the point of the post. A conference paper that closed them would be a different paper. <d-cite key="shoham2009multiagent,feigenbaum2007damd"></d-cite>

## What current tools remember

Four familiar mechanisms stop at the wrong object.

A circuit breaker trips on error rate or timeout and resets when the connection closes <d-cite key="nygard2018release"></d-cite>. Its key is the session, sometimes the client address. An agent trajectory is not a session. It crosses hosts, and the objective survives a new connection. A breaker that forgets at teardown is topology amnesia with a shorter timeout. The object worth remembering is a trajectory, a sequence of attempts that share an objective and may change host, connection, and identity. Stateless admission scores each attempt. Topology memory scores the identity across the trajectory. When the identity itself is replaceable, the trajectory leaves the memory. The bound at which that escape becomes the better strategy is below.

Congestion control damps only senders who implement it <d-cite key="jacobson1988congestion,chiu1989aimd"></d-cite>. Once endpoints choose their response strategically, those equilibria need not be efficient <d-cite key="akella2002selfish"></d-cite>. An autonomous optimizer is that case in a sharper form. Loss and application errors are evidence about its search problem. They are not a social signal to slow down. Cooperative backoff is not an assumption available for import.

Tool protocols and commitment languages constrain content and obligation <d-cite key="anthropic2024mcp,yolum2002commitment"></d-cite>. A commitment can persist as a deontic fact inside an institution the agents accept. It does not insert delay before the payload, and it does not delete a peer from a routing neighborhood. Per-request authorization still forgets rate.

Reputation models for open multi-agent systems already keep history <d-cite key="huynh2006fire,sabater2005review"></d-cite>. Their attack catalogue is part of the open problems below. Whitewashing, bad-mouthing, and Sybil identities are old <d-cite key="hoffman2009survey,friedman2001pseudonyms,douceur2002sybil"></d-cite>. What those models typically do not specify is a header checked before the payload, latency as the price rather than a score read after a semantic outcome, and a hard separation from enterprise role administration.

That separation is a protocol boundary. Inside one administrative domain the operator owns both the optimizer and the mediator. Role-based admission means something, because the principals enrolled. That arrangement does not let one operator instrument a stranger's planner, and a role registry has no standing among peers who never enrolled. Folding the second game into a switch on the first would treat a role decision and a subjective viability score as the same state. They are not.

## A header before the payload

A coordination attempt is a pair $$(H, \pi)$$. The payload $$\pi$$ is not interpreted until the header $$H$$ has been admitted.

$$
H = \langle \mathrm{Intent},\, \mathrm{Claim},\, \mathrm{Collateral},\, \mathrm{Signature} \rangle.
$$

Intent names a task class $$\tau$$ and a declared resource demand. It is not the cognitive content of $$\pi$$. Claim is the sender's assertion of the terms on which it asks to be admitted, including an identity handle $$j$$. Collateral names a sender-local resource the sender commits to attenuate if this signed header is later tied to exploitation. Signature is $$j$$'s signature on $$(\mathrm{Intent}, \mathrm{Claim}, \mathrm{Collateral}, h(\pi))$$, so the binding can be checked before $$\pi$$ is read. A header that fails verification is dropped. The payload is not parsed.

The check cannot sit inside the optimizer that produces $$\pi$$. An optimizer charged with a local objective treats an internal refusal as another constraint to plan around, including by rewriting the request until the check accepts it. The header is therefore evaluated by a mediation step that does not share that objective, and the step runs before $$\pi$$ is delivered. Out of band means this separation of objectives. It does not name a deployment. In the open mesh the receiver controls only its own mediation. That process never shares an objective with the stranger's optimizer.

Collateral does not extend the receiver's write into the sender's process. A compliant sender can honor the header and attenuate the named local resource. A stranger need not run any mediator the receiver trusts. Against that stranger the actions the receiver can take alone are delay, a smaller grant, and deletion from the eligible-neighbor set. A collateral field the sender can abandon by minting a new key is cheap talk. The signature makes the claim quotable later. It does not create a payment. Pricing the identity is an open problem, not a settled primitive, which is why collateral sits in the header as a bound declaration and not as an enforced transfer.

## Viability is local

Admission at peer $$i$$ is a function of local memory. For each identity $$i$$ has observed and each task class, $$i$$ stores a subjective viability tensor

$$
CVP_i^{(\tau)}(j,t) \in [0,1]^{d}.
$$

Subjectivity is required. The score $$i$$ holds for $$j$$ need not equal the score $$k$$ holds for $$j$$, and no peer is assumed to hold a network-wide number. A weight vector $$w_i^{(\tau)}$$ with nonnegative coordinates and unit $$\ell_1$$ norm projects the tensor to a scalar,

$$
v_i^{(\tau)}(j,t) = w_i^{(\tau)} \cdot CVP_i^{(\tau)}(j,t).
$$

The coordinates may track completion reliability, fidelity to a collateral claim, and behavior under contention. The mechanism does not depend on one canonical basis. It depends on the projection being local, task-conditioned, and identity-indexed.

An unseen identity is assigned a default strictly below the fast-path threshold. First contact is admission control with a bounded grant <d-cite key="gibbens1995admission"></d-cite>, not a default allow.

Two thresholds $$\theta_i^{\mathrm{iso}} < \theta_i^{\mathrm{fast}}$$ partition the scalar. Above the fast threshold the payload is delivered at a baseline delay $$L_{\min}$$. Between the thresholds, $$i$$ injects additional delay. Below the isolation threshold, $$j$$ leaves the task-conditioned neighborhood,

$$
j \in N_i^{(\tau)}(t) \iff v_i^{(\tau)}(j,t) \ge \theta_i^{\mathrm{iso}}.
$$

Loss of the route is the event $$j \notin N_i^{(\tau)}(t)$$. The mesh-wide picture is the union of these neighborhoods. A partition appears only when many such local decisions align. That emergence is a property to be bounded, not a ban to be issued.

## Delay has to land on the sender

Between the thresholds the delay is

$$
L_i(j,\tau) = L_{\min} + \lambda_i \, \psi\bigl(1 - v_i^{(\tau)}(j,t)\bigr),
$$

with $$\lambda_i > 0$$ and $$\psi$$ positive and nondecreasing.

This delay is the friction. An application error is information. A search procedure that treats failure as feedback will change a parameter and retry. Injected latency offers no such gradient. The attempt's urgency is converted into waiting time. We use that conversion as dissipative damping, a frictional loss inside the sender's objective, and not as a derived thermodynamic identity. Delay is already a control signal in backpressure scheduling <d-cite key="tassiulas1992stability"></d-cite>. The difference here is that the signal is assessed per identity and then remembered.

The charge is admissible only when the wait falls on the sender and $$i$$ keeps state bounded in the number of delayed identities. A realization that holds the connection open at $$i$$ spends $$i$$'s memory and file descriptors on the attacker. Under a burst of new identities, each of which starts below the fast path and therefore in the delay band, that bill comes due before hysteresis has done anything to the senders. The damping is then inverted. A token the sender must present after waiting, or a refusal until a deadline, keeps the wait on the sender. Parking the socket does not.

Strangers start in that delay band on purpose. First contact is a bounded grant, not a free fast path. The implementation of the grant has to be as careful as the grant itself.

## The penalty reads a counter

Memory without asymmetry is a revolving door. The drop reads an accounting predicate on the admitted trajectory bound to a verified header. Measured consumption against the grant, not a classification of what $$\pi$$ means. Pieces that share $$j$$ and $$\tau$$ add on that trajectory, so a burst split into many well-formed requests is one identity's excess. How a faithful long-running task stays distinct from that sum is unfinished. It belongs with the map from evidence to $$(\gamma, \beta, \theta_i)$$ below.

When the predicate holds, peer $$i$$ scales viability in one step,

$$
CVP_i^{(\tau)}(j) \leftarrow (1-\gamma)\, CVP_i^{(\tau)}(j),
$$

with a peer-chosen $$\gamma \in (0,1)$$. In an epoch with no new exploitation evidence, each coordinate $$x$$ recovers by

$$
x \leftarrow x + \beta(1-x), \qquad 0 < \beta \ll \gamma.
$$

The residual $$1-x$$ then contracts by $$1-\beta$$ per epoch, so the number of clean epochs required to climb from $$v_0$$ back through a threshold $$v^{\star}$$ is

$$
t \ge \frac{\log\bigl((1-v_0)/(1-v^{\star})\bigr)}{-\log(1-\beta)}.
$$

In the design regime $$\beta \ll 1$$ this is on the order of $$\beta^{-1} \log(\cdot)$$ epochs. Degradation is one epoch. Recovery is many. The qualitative device is the same as multiplicative decrease against additive increase <d-cite key="chiu1989aimd"></d-cite>, with one change of agency. Compliant transport endpoints are assumed to execute the decrease themselves. Here the peer that was exploited writes the decrease into its own memory of the identity. The sender is not asked to be socially responsible.

Checking the header before parsing the payload is the admission step. The counter runs after admission, on resource use tied to a header that already verified. The layer does not promise to detect exploitation without ever observing a consequence. It does promise that the observation is an accounting event on an identity's trajectory, not a reading of the payload's meaning.

## Hysteresis stops reuse, not a new key

Two strategies have to be written separately.

Identity $$j$$ offers a burst whose demand exceeds the grant $$i$$ meant to allow, by splitting the work or by immediate retry. If each attempt returns an error, the optimizer's continuation is another attempt. Under the delay and the one-step drop, a reused identity pays the recovery time after the burst is tied to its signature. Reuse is unattractive when that opportunity cost exceeds the one-shot gain.

Let $$u(B)$$ be the value of one admitted burst of size $$B$$, let $$\kappa > 0$$ be the per-epoch opportunity cost of holding a degraded identity, and let $$T$$ be the recovery time above. Reuse returns $$u(B) - \kappa T$$. Rotation, at minting cost $$c_{\mathrm{id}}$$, returns $$u(B) - c_{\mathrm{id}}$$. The burned identity is discarded, and the drop is never felt by the attacker.

Hysteresis deters reuse when $$\kappa T > u(B)$$. It deters the attack itself only when

$$
c_{\mathrm{id}} > u(B).
$$

Asymmetric hysteresis therefore makes a hit-and-run on a persistent identity unviable, and it selects for Sybil rotation whenever identities are cheaper than that bound <d-cite key="douceur2002sybil,friedman2001pseudonyms"></d-cite>. Persistence of consequences and persistence of identity are different assumptions. The layer supplies the first. The second is open.

The design question is how to price a never-seen identity from local information, without a global ledger. The cost the admitting peer can assess on its own has to exceed the value of the stranger grant that peer is willing to offer. A ledger would make issuance history common knowledge. Any substitute must be either expended at $$i$$, as work or escrow $$i$$ can check, or borrowed against another identity whose viability $$i$$ already stores.

Three families match that constraint. None is adopted here. A proof-of-work puzzle, in the style of computational pricing for unwanted traffic <d-cite key="dwork1993pricing"></d-cite>, can be required before a stranger grant. The payment is computation checked by the admitting peer, not a coin. A stake can be escrowed with that peer, or with a small coalition, and returned only after clean epochs. Forfeiture is a refused refund, not a traded token. A sponsored introduction can bond the sponsor's own viability to the newcomer, so rotation spends a scarce relationship rather than a free key <d-cite key="kamvar2003eigentrust"></d-cite>. The families fail differently. Puzzles yield to capital, local escrow reintroduces custody, and sponsorship concentrates influence. The research task is to state for which meshes which cost suffices. It is not to announce a universal Sybil defense. Choosing the local map from evidence to $$(\gamma, \beta, \theta_i)$$ is part of the same unfinished mechanism, not a constant identified here.

## Signed gossip still lies about harm

Peers that never saw the burst may still need evidence when load is forwarded. A report is admissible at peer $$k$$ only if it contains a header whose signature verifies under the accused identity's key, together with the reporter's own signature on a measurement bound to that header. An unsigned allegation is not evidence. Inventing "$$j$$ sent this" requires forging the accused signature. Binding the measurement to the header matters for the same reason. A true signature on an old or unrelated request must not be reused as proof of a burst the reporter did not receive. That filter removes the simplest poisoning strategy, fabrication of a request that was never made.

It does not authenticate the measurement. A reporter can overstate harm on a header $$j$$ did sign, and several reporters can do so together. The target's signature is a filter on forgery of the request. It is not a solution to false isolation.

Local deletion of edges is how isolation stays decentralized, and it is how a mesh can partition a peer that is slow because its task is long. Write the eligibility graph

$$
E_t^{(\tau)} = \bigl\{(i,j) : j \in N_i^{(\tau)}(t)\bigr\}.
$$

A benign long-running identity suffers false isolation when a large fraction of its in-edges disappear at peers that never verified an exploitation header for it. Contagion is the special case in which one peer's admissible report causes others to delete edges they did not observe. Gossip of signed headers amplifies whichever of those decisions is wrong. The analytical target is a percolation threshold on this graph <d-cite key="callaway2000robustness"></d-cite>. The region of interest is the one in which cuts stay on identities with signed exploitation evidence, and the region in which deleted edges consume a giant component of faithful peers. Task-conditioned tensors are a candidate damper, because a record under $$\tau$$ need not move the score under another task class. Conditioning helps only if exploitation cannot be relabeled into a fresh task class at negligible cost. That relabeling is another face of identity rotation. We do not claim a threshold.

The layer prices capacity and topology. A header on the fast path can still carry an indirect prompt injection in $$\pi$$ <d-cite key="greshake2023injection,debenedetti2024agentdojo"></d-cite>. The viability update does not inspect whether the payload manipulates a downstream model. Semantic defenses remain necessary. An interface at which an injection monitor may submit signed evidence into the same hysteresis rule is plausible and unevaluated. The failure modes are orthogonal. This is not a joint defense.

## The measurement that is still missing

The arguments above are incentive and graph arguments. A discrete-event model can test them without rolling out a language model. A random graph of peers, each holding a tensor. Compliant optimizers with an explicit retry policy. Three adversaries. Load export with identity reuse. The same export with free minting. Gossip of unsigned versus signed headers.

The comparison that would make the study informative is three admission rules on the same arrival process. Stateless per-request admission. A session circuit breaker that resets when the connection closes. The hysteresis rule, with the stranger default below the fast path. The parameters $$\gamma$$, $$\beta$$, and the isolation threshold should be swept. The agenda claims a qualitative asymmetry, not a tuned constant. Free minting should be an explicit adversary. Hysteresis without an identity cost fails exactly there, and a study that omits rotation would confirm only the easy case.

The observables to define, and not yet to report, are the recovery time of a punished identity, the grant a stranger consumes before damping binds, the fraction of a planted long-running benign flow that loses in-edges, and the critical fraction of exploiting identities at which the eligibility graph loses a giant component. The last quantity is a topological phase transition. Publishing it requires the simulation. This post does not contain it.

One further observable belongs with the delay. For each rule, count the receiver state held per delayed identity. A rule that looks good on sender waiting time and bad on receiver descriptors has not implemented the damping above. It has moved the bill.

A mesh with consequence persistence is one in which coordination state outlives the session and is stored as subjective topology memory. The governance header is judged before the payload. Delay, not an error code, is the friction a reused identity incurs, and only if that delay does not park the cost on the receiver. Isolation is the loss of eligible neighbors. Governance of an operator's own planners remains a different protocol under a different trust assumption. The open problems are the price of a new identity, the percolation of local cuts, and the boundary with semantic injection. Those problems are the agenda. Mechanism design for untrusted neighbors, governed by topological consequences rather than by stateless sessions.
