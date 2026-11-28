/* A schematic allocation model, not a neural-network optimizer. No DOM or timers. */
(function (root) {
  "use strict";

  const LEARNING_RATE = 0.25;

  function integer(value, min, max, name) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${name} must be an integer from ${min} to ${max}.`);
    }
  }

  function validate(config) {
    if (!config || !Array.isArray(config.tasks)) throw new TypeError("Tasks are required.");
    integer(config.tasks.length, 1, 5, "Task count");
    const ids = new Set();
    for (const task of config.tasks) {
      if (!task || typeof task.id !== "string" || !/^[A-Za-z0-9_-]+$/.test(task.id) || ids.has(task.id)) {
        throw new TypeError("Each task needs a unique alphanumeric ID.");
      }
      ids.add(task.id);
      if (!Number.isFinite(task.weight) || task.weight < 0 || task.weight > 100) {
        throw new RangeError("Frequency weights must be from 0 to 100.");
      }
      integer(task.complexity, 1, 8, "Complexity");
    }
    if (!config.tasks.some((task) => task.weight > 0)) throw new RangeError("At least one frequency weight must be positive.");
    if (!Array.isArray(config.capacities) || config.capacities.length !== 2) {
      throw new TypeError("Provide two model capacities.");
    }
    config.capacities.forEach((capacity) => integer(capacity, 1, 24, "Capacity"));
    integer(config.seed, 0, 4294967295, "Seed");
    integer(config.steps, 1, 5000, "Signal count");
    if (!["space", "strength"].includes(config.mode)) throw new TypeError("Unknown mode.");
  }

  function createCatalog(tasks) {
    const total = tasks.reduce((sum, task) => sum + task.weight, 0);
    const normalized = tasks.map((task) => ({ ...task, frequency: task.weight / total }));
    const features = normalized.flatMap((task) =>
      Array.from({ length: task.complexity }, (_, index) => ({
        id: `${task.id}:${index + 1}`,
        taskId: task.id,
        index: index + 1,
        importance: 1 / task.complexity,
        utility: task.frequency / task.complexity,
      }))
    );
    return { tasks: normalized, features, byId: Object.fromEntries(features.map((feature) => [feature.id, feature])) };
  }

  // Mulberry32: randomness belongs to the stream, never to either model.
  function createRandom(seed) {
    let state = seed >>> 0;
    return function random() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function nextSignal(catalog, random) {
    let draw = random();
    const eligible = catalog.tasks.filter((task) => task.frequency > 0);
    let selected = eligible[eligible.length - 1];
    for (const task of eligible) {
      draw -= task.frequency;
      if (draw < 0) {
        selected = task;
        break;
      }
    }
    return `${selected.id}:${1 + Math.floor(random() * selected.complexity)}`;
  }

  function createModel(capacity) {
    integer(capacity, 1, 24, "Capacity");
    return {
      slots: Array.from({ length: capacity }, () => ({ parts: [], vacancy: 1 })),
      seen: new Set(),
      reinforcements: 0,
      last: null,
    };
  }

  function findSlot(model, featureId) {
    return model.slots.findIndex((slot) => slot.parts.some((part) => part.featureId === featureId));
  }

  function weakestSlot(model, catalog) {
    const scores = model.slots.map((slot) => slot.parts.reduce((sum, part) => sum + catalog.byId[part.featureId].utility * part.strength, 0));
    return scores.indexOf(Math.min(...scores));
  }

  function updateSpace(model, catalog, featureId) {
    const existing = findSlot(model, featureId);
    if (existing >= 0) {
      model.reinforcements++;
      return { type: "reinforced", slot: existing, gain: 0, donors: [] };
    }
    let index = model.slots.findIndex((slot) => slot.parts.length === 0);
    if (index < 0) {
      index = weakestSlot(model, catalog);
      const resident = model.slots[index].parts[0].featureId;
      if (catalog.byId[featureId].utility <= catalog.byId[resident].utility) {
        return { type: "not retained", slot: null, gain: 0, donors: [] };
      }
    }
    const donors = model.slots[index].parts.map((part) => ({ featureId: part.featureId, loss: part.strength }));
    model.slots[index] = { parts: [{ featureId, strength: 1 }], vacancy: 0 };
    return { type: donors.length ? "replaced" : "allocated", slot: index, gain: 1, donors };
  }

  function updateStrength(model, catalog, featureId) {
    let index = findSlot(model, featureId);
    if (index < 0) index = model.slots.findIndex((slot) => slot.parts.length === 0);
    if (index < 0) index = weakestSlot(model, catalog);
    const slot = model.slots[index];
    let incoming = slot.parts.find((part) => part.featureId === featureId);
    const residual = 1 - (incoming?.strength ?? 0);
    const delta = LEARNING_RATE * residual;
    const free = Math.min(slot.vacancy, delta);
    const others = slot.parts.filter((part) => part !== incoming);
    const donorMass = others.reduce((sum, part) => sum + part.strength, 0);
    const fraction = donorMass > 0 ? Math.min(1, (delta - free) / donorMass) : 0;
    const donors = [];
    for (const part of others) {
      const loss = part.strength * fraction;
      part.strength -= loss;
      if (loss > 0) donors.push({ featureId: part.featureId, loss });
    }
    const gain = free + donors.reduce((sum, donor) => sum + donor.loss, 0);
    if (!incoming) {
      incoming = { featureId, strength: 0 };
      slot.parts.push(incoming);
    }
    incoming.strength += gain;
    slot.vacancy -= free;
    slot.parts = slot.parts.filter((part) => part.strength > 0);
    return { type: donors.length ? "competing" : gain > 0 ? "strengthened" : "stable", slot: index, gain, donors };
  }

  function applySignal(model, catalog, featureId, mode) {
    if (!catalog.byId[featureId]) throw new TypeError("Unknown feature.");
    if (!["space", "strength"].includes(mode)) throw new TypeError("Unknown mode.");
    model.seen.add(featureId);
    const update = mode === "space" ? updateSpace : updateStrength;
    model.last = { featureId, ...update(model, catalog, featureId) };
    return model.last;
  }

  function metrics(model, catalog) {
    const strengths = Object.fromEntries(catalog.features.map((feature) => [feature.id, 0]));
    for (const slot of model.slots) {
      for (const part of slot.parts) strengths[part.featureId] += part.strength;
    }
    const tasks = catalog.tasks.map((task) => ({
      ...task,
      coverage: catalog.features
        .filter((feature) => feature.taskId === task.id)
        .reduce((sum, feature) => sum + feature.importance * strengths[feature.id], 0),
    }));
    return {
      strengths,
      tasks,
      weightedCoverage: tasks.reduce((sum, task) => sum + task.frequency * task.coverage, 0),
      unretained: catalog.features.filter((feature) => model.seen.has(feature.id) && strengths[feature.id] === 0),
      unseen: catalog.features.filter((feature) => !model.seen.has(feature.id)),
    };
  }

  function createSimulation(config) {
    validate(config);
    const catalog = createCatalog(config.tasks);
    const random = createRandom(config.seed);
    const mode = config.mode;
    const limit = config.steps;
    const models = config.capacities.map(createModel);
    let step = 0;
    return {
      catalog,
      models,
      get step() {
        return step;
      },
      advance() {
        if (step >= limit) return null;
        const featureId = nextSignal(catalog, random);
        models.forEach((model) => applySignal(model, catalog, featureId, mode));
        return { step: ++step, feature: catalog.byId[featureId] };
      },
    };
  }

  const api = Object.freeze({ LEARNING_RATE, createSimulation, createModel, applySignal, metrics });
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ResourceCompetition = api;
})(globalThis);
