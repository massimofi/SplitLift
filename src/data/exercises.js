
// ---------- DAY TYPES ----------
// What a single day's session is "about" — used for split templates and the day-type chips.
export const DAY_TYPES = {
  push:    { id:'push',    label:'Push',          color:'#5B5BFF',  sub:'Chest · Shoulders · Triceps' },
  pull:    { id:'pull',    label:'Pull',          color:'#19B6FF',  sub:'Back · Biceps · Rear delts' },
  legs:    { id:'legs',    label:'Legs',          color:'#9B5BFF',  sub:'Quads · Hams · Glutes · Calves' },
  upper:   { id:'upper',   label:'Upper',         color:'#5B5BFF',  sub:'Whole upper body' },
  lower:   { id:'lower',   label:'Lower',         color:'#9B5BFF',  sub:'Whole lower body' },
  full:    { id:'full',    label:'Full body',     color:'#C09BFF',  sub:'Compound, balanced' },
  chest:   { id:'chest',   label:'Chest',         color:'#5B5BFF',  sub:'Bench, fly, dip' },
  back:    { id:'back',    label:'Back',          color:'#19B6FF',  sub:'Pull-ups, rows, pulldowns' },
  shoulder:{ id:'shoulder',label:'Shoulders',     color:'#7C7CFF',  sub:'Press, lateral, rear' },
  arms:    { id:'arms',    label:'Arms',          color:'#8C8CFF',  sub:'Biceps + triceps' },
  bis:     { id:'bis',     label:'Biceps',        color:'#19B6FF',  sub:'Curls, hammers' },
  tris:    { id:'tris',    label:'Triceps',       color:'#5B5BFF',  sub:'Pushdowns, dips' },
  quads:   { id:'quads',   label:'Quads',         color:'#9B5BFF',  sub:'Squats, lunges' },
  hams:    { id:'hams',    label:'Hamstrings',    color:'#7C5BFF',  sub:'RDLs, curls' },
  glutes:  { id:'glutes',  label:'Glutes',        color:'#A86CFF',  sub:'Hip thrusts, RDL' },
  calves:  { id:'calves',  label:'Calves',        color:'#C09BFF',  sub:'Raises' },
  core:    { id:'core',    label:'Core',          color:'#FF6BD6',  sub:'Plank, hang, anti-rotation' },
  cardio:  { id:'cardio',  label:'Cardio',        color:'#19B6FF',  sub:'Run, bike, row, intervals' },
  sport:   { id:'sport',   label:'Sport',         color:'#FFB344',  sub:'Practice or match day' },
  rest:    { id:'rest',    label:'Rest',          color:'#5E627A',  sub:'Recover. Adapt.' },
  custom:  { id:'custom',  label:'Custom',        color:'#8C8CFF',  sub:'Your own mix' },
};

// Legacy alias used by the rest of the app
export const TYPE_LABELS = {
  push:   { label: 'Push',     color: DAY_TYPES.push.color },
  pull:   { label: 'Pull',     color: DAY_TYPES.pull.color },
  legs:   { label: 'Legs',     color: DAY_TYPES.legs.color },
  shoul:  { label: 'Shoulders',color: DAY_TYPES.shoulder.color },
  core:   { label: 'Core',     color: DAY_TYPES.core.color },
  cardio: { label: 'Cardio',   color: DAY_TYPES.cardio.color },
  // 'full' is used by the new full-body exercises (farmer carry etc.) added
  // in the demo polish round; missing it here was crashing CmdK.
  full:   { label: 'Full',     color: DAY_TYPES.full.color },
};

// ---------- EXERCISES ----------
// `body` = primary fine-grained body part this exercise belongs to (used for grouping/library)
// `type` = legacy push/pull/legs/etc. bucket
// `hits` = weighted muscle coverage map (scaled by sets)
export const EXERCISES = [
  // ===== CHEST =====
  { id:'bench',    name:'Bench Press',          body:'chest',  type:'push', gear:'BB',  sets:'4 × 6',  hits:{chest:1.0, shoulder:0.4, tris:0.3} },
  { id:'incline',  name:'Incline DB Press',     body:'chest',  type:'push', gear:'DB',  sets:'3 × 8',  hits:{chest:1.0, shoulder:0.5, tris:0.3} },
  { id:'fly',      name:'Cable Fly',            body:'chest',  type:'push', gear:'CBL', sets:'3 × 12', hits:{chest:1.0} },
  { id:'dip',      name:'Dip',                  body:'chest',  type:'push', gear:'BW',  sets:'3 × 10', hits:{chest:0.8, tris:0.6, shoulder:0.3} },
  { id:'pushup',   name:'Push-Up',              body:'chest',  type:'push', gear:'BW',  sets:'3 × 15', hits:{chest:0.7, core:0.3, tris:0.2} },
  { id:'declinedb',name:'Decline DB Press',     body:'chest',  type:'push', gear:'DB',  sets:'3 × 10', hits:{chest:1.0, tris:0.3} },

  // ===== BACK =====
  { id:'pullup',   name:'Pull-Up',              body:'back',   type:'pull', gear:'BW',  sets:'4 × 6',  hits:{back:1.0, bis:0.5, arms:0.5} },
  { id:'row',      name:'Chest-Sup. Row',       body:'back',   type:'pull', gear:'DB',  sets:'3 × 10', hits:{back:1.0, bis:0.4, arms:0.4} },
  { id:'pulldown', name:'Lat Pulldown',         body:'back',   type:'pull', gear:'CBL', sets:'3 × 10', hits:{back:1.0, bis:0.4, arms:0.4} },
  { id:'tbar',     name:'T-Bar Row',            body:'back',   type:'pull', gear:'BB',  sets:'4 × 8',  hits:{back:1.0, bis:0.3, arms:0.3} },
  { id:'cabrow',   name:'Seated Cable Row',     body:'back',   type:'pull', gear:'CBL', sets:'3 × 10', hits:{back:1.0, bis:0.4} },
  { id:'shrug',    name:'Barbell Shrug',        body:'back',   type:'pull', gear:'BB',  sets:'3 × 12', hits:{back:0.7, shoulder:0.3} },

  // ===== BICEPS =====
  { id:'curlbb',   name:'Barbell Curl',         body:'bis',    type:'pull', gear:'BB',  sets:'3 × 10', hits:{bis:1.0, arms:1.0} },
  { id:'hammer',   name:'Hammer Curl',          body:'bis',    type:'pull', gear:'DB',  sets:'3 × 10', hits:{bis:1.0, arms:1.0} },
  { id:'preacher', name:'Preacher Curl',        body:'bis',    type:'pull', gear:'MCH', sets:'3 × 12', hits:{bis:1.0, arms:1.0} },
  { id:'incdb',    name:'Incline DB Curl',      body:'bis',    type:'pull', gear:'DB',  sets:'3 × 10', hits:{bis:1.0, arms:1.0} },

  // ===== TRICEPS =====
  { id:'tri',      name:'Tricep Pushdown',      body:'tris',   type:'push', gear:'CBL', sets:'3 × 12', hits:{tris:1.0, arms:1.0} },
  { id:'skull',    name:'Skull Crusher',        body:'tris',   type:'push', gear:'BB',  sets:'3 × 10', hits:{tris:1.0, arms:1.0} },
  { id:'overtri',  name:'Overhead Tricep Ext.', body:'tris',   type:'push', gear:'DB',  sets:'3 × 10', hits:{tris:1.0, arms:1.0} },

  // ===== SHOULDERS =====
  { id:'ohp',      name:'Overhead Press',       body:'shoulder',type:'shoul',gear:'BB', sets:'3 × 8',  hits:{shoulder:1.0, tris:0.4, arms:0.4, core:0.3} },
  { id:'dbpress',  name:'DB Shoulder Press',    body:'shoulder',type:'shoul',gear:'DB', sets:'3 × 10', hits:{shoulder:1.0, tris:0.3} },
  { id:'lat',      name:'Lateral Raise',        body:'shoulder',type:'shoul',gear:'DB', sets:'3 × 15', hits:{shoulder:1.0} },
  { id:'rear',     name:'Rear Delt Fly',        body:'shoulder',type:'shoul',gear:'DB', sets:'3 × 12', hits:{shoulder:0.8, back:0.3} },
  { id:'face',     name:'Face Pull',            body:'shoulder',type:'shoul',gear:'CBL',sets:'3 × 15', hits:{shoulder:0.8, back:0.4} },
  { id:'arnold',   name:'Arnold Press',         body:'shoulder',type:'shoul',gear:'DB', sets:'3 × 10', hits:{shoulder:1.0, tris:0.3} },

  // ===== QUADS =====
  { id:'squat',    name:'Back Squat',           body:'quads',  type:'legs', gear:'BB',  sets:'5 × 5',  hits:{quads:1.0, glutes:0.6, core:0.3} },
  { id:'front',    name:'Front Squat',          body:'quads',  type:'legs', gear:'BB',  sets:'5 × 4',  hits:{quads:1.0, core:0.4, glutes:0.4} },
  { id:'lunge',    name:'Walking Lunge',        body:'quads',  type:'legs', gear:'DB',  sets:'3 × 12', hits:{quads:0.9, glutes:0.6, core:0.3} },
  { id:'split',    name:'Bulgarian Split Sq.',  body:'quads',  type:'legs', gear:'DB',  sets:'3 × 10', hits:{quads:0.8, glutes:0.7, core:0.3} },
  { id:'legpress', name:'Leg Press',            body:'quads',  type:'legs', gear:'MCH', sets:'4 × 10', hits:{quads:1.0, glutes:0.5} },
  { id:'box',      name:'Box Jump',             body:'quads',  type:'legs', gear:'BW',  sets:'5 × 3',  hits:{quads:0.7, glutes:0.5, calves:0.3} },

  // ===== HAMSTRINGS =====
  { id:'rdl',      name:'Romanian Deadlift',    body:'hams',   type:'legs', gear:'BB',  sets:'4 × 8',  hits:{hams:1.0, glutes:0.7, back:0.3} },
  { id:'curl',     name:'Hamstring Curl',       body:'hams',   type:'legs', gear:'MCH', sets:'3 × 12', hits:{hams:1.0} },
  { id:'gm',       name:'Good Morning',         body:'hams',   type:'legs', gear:'BB',  sets:'3 × 8',  hits:{hams:1.0, glutes:0.5, back:0.3} },

  // ===== GLUTES =====
  { id:'tbardl',   name:'Trap-Bar Deadlift',    body:'glutes', type:'legs', gear:'BB',  sets:'5 × 5',  hits:{glutes:1.0, hams:0.8, back:0.5} },
  { id:'thrust',   name:'Hip Thrust',           body:'glutes', type:'legs', gear:'BB',  sets:'4 × 8',  hits:{glutes:1.0, hams:0.5} },
  { id:'gluteback',name:'Glute Kickback',       body:'glutes', type:'legs', gear:'CBL', sets:'3 × 12', hits:{glutes:1.0} },

  // ===== CALVES =====
  { id:'calf',     name:'Standing Calf Raise',  body:'calves', type:'legs', gear:'MCH', sets:'4 × 12', hits:{calves:1.0} },
  { id:'seatedcalf',name:'Seated Calf Raise',   body:'calves', type:'legs', gear:'MCH', sets:'4 × 15', hits:{calves:1.0} },

  // ===== CORE =====
  { id:'plank',    name:'Plank',                body:'core',   type:'core', gear:'BW',  sets:'3 × 45s',hits:{core:1.0} },
  { id:'hang',     name:'Hanging Leg Raise',    body:'core',   type:'core', gear:'BW',  sets:'3 × 12', hits:{core:1.0} },
  { id:'pallof',   name:'Pallof Press',         body:'core',   type:'core', gear:'CBL', sets:'3 × 10', hits:{core:1.0} },
  { id:'wood',     name:'Cable Woodchop',       body:'core',   type:'core', gear:'CBL', sets:'3 × 12', hits:{core:1.0} },
  { id:'abwheel',  name:'Ab Wheel Rollout',     body:'core',   type:'core', gear:'BW',  sets:'3 × 10', hits:{core:1.0} },

  // ===== FOREARMS (added so the forearm slug has real exercises) =====
  { id:'wristcurl',  name:'Wrist Curl',           body:'forearm', type:'pull', gear:'DB',  sets:'3 × 15',  hits:{forearm:1.0} },
  { id:'rwristcurl', name:'Reverse Wrist Curl',   body:'forearm', type:'pull', gear:'DB',  sets:'3 × 12',  hits:{forearm:1.0} },
  { id:'farmer',     name:'Farmer Carry',         body:'forearm', type:'full', gear:'DB',  sets:'3 × 30s', hits:{forearm:1.0, traps:0.4, glutes:0.3} },
  { id:'pinch',      name:'Plate Pinch Hold',     body:'forearm', type:'pull', gear:'BB',  sets:'3 × 30s', hits:{forearm:1.0} },

  // ===== ADDUCTORS =====
  { id:'addmach',    name:'Adductor Machine',     body:'glutes',  type:'legs', gear:'MCH', sets:'3 × 12',  hits:{adductors:1.0} },
  { id:'sumosq',     name:'Sumo Squat',           body:'quads',   type:'legs', gear:'BB',  sets:'4 × 8',   hits:{quads:0.7, adductors:0.6, glutes:0.6} },
  { id:'copen',      name:'Copenhagen Plank',     body:'core',    type:'core', gear:'BW',  sets:'3 × 30s', hits:{adductors:1.0, obliques:0.4} },

  // ===== ABDUCTORS =====
  { id:'abdmach',    name:'Abductor Machine',     body:'glutes',  type:'legs', gear:'MCH', sets:'3 × 12',  hits:{abductors:1.0, glutes:0.4} },
  { id:'sidelyleg',  name:'Side-Lying Leg Raise', body:'glutes',  type:'legs', gear:'BW',  sets:'3 × 15',  hits:{abductors:1.0} },
  { id:'bandlat',    name:'Banded Lateral Walk',  body:'glutes',  type:'legs', gear:'BW',  sets:'3 × 20',  hits:{abductors:1.0, glutes:0.4} },

  // ===== NECK (covers head + neck slugs in the body highlighter) =====
  { id:'neckflex',   name:'Neck Flexion',         body:'core',    type:'core', gear:'BW',  sets:'3 × 12',  hits:{neck:1.0} },
  { id:'neckext',    name:'Neck Extension',       body:'core',    type:'core', gear:'BW',  sets:'3 × 12',  hits:{neck:1.0} },
  { id:'neckraise',  name:'Lateral Neck Raise',   body:'core',    type:'core', gear:'BW',  sets:'3 × 12',  hits:{neck:1.0} },
  { id:'chintuck',   name:'Chin Tuck',            body:'core',    type:'core', gear:'BW',  sets:'3 × 15',  hits:{neck:1.0} },

  // ===== CALVES (one more so all three calf-raise variants exist) =====
  { id:'donkey',     name:'Donkey Calf Raise',    body:'calves',  type:'legs', gear:'BW',  sets:'3 × 15',  hits:{calves:1.0} },

  // ===== CARDIO =====
  { id:'z2run',    name:'Zone-2 Run',           body:'cardio', type:'cardio',gear:'RUN', sets:'30 min', hits:{} },
  { id:'hiit',     name:'HIIT Intervals',       body:'cardio', type:'cardio',gear:'BIK', sets:'8 × 1m', hits:{} },
  { id:'row-erg',  name:'Row Erg',              body:'cardio', type:'cardio',gear:'ROW', sets:'20 min', hits:{back:0.3} },
];

// Library filter chips — granular body parts
export const FILTER_CHIPS = [
  { id:'all',       label:'All' },
  { id:'chest',     label:'Chest' },
  { id:'back',      label:'Back' },
  { id:'shoulder',  label:'Shoulders' },
  { id:'bis',       label:'Biceps' },
  { id:'tris',      label:'Triceps' },
  { id:'quads',     label:'Quads' },
  { id:'hams',      label:'Hamstrings' },
  { id:'glutes',    label:'Glutes' },
  { id:'calves',    label:'Calves' },
  { id:'core',      label:'Core' },
  { id:'cardio',    label:'Cardio' },
];

export const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// SPLIT_TEMPLATES is in src/data/templates.js.

export const INITIAL_DAYS = [
  { type:'push', focus:'Push',                exIds:['bench','ohp','fly','tri'] },
  { type:'rest', focus:'Rest',                exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' },
  { type:'pull', focus:'Pull',                exIds:['pullup','row','face','curlbb'] },
  { type:'legs', focus:'Legs',                exIds:['squat','rdl','curl','calf'] },
  { type:'push', focus:'Push',                exIds:['incline','dbpress','lat','overtri'] },
  { type:'pull', focus:'Pull',                exIds:['tbar','pulldown','hammer','rear'] },
  { type:'rest', focus:'Rest',                exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' },
];

// Sports + their muscle priorities + cardio recommendations.
// `cardioProfile`: which cardio sessions matter for this sport's energy
// system, plus a one-line rationale shown in the day-picker drawer.
export const SPORTS = [
  { id:'general',   label:'General fitness', sub:'Balanced everywhere',
    priority:{}, daysHint:4, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-z2-30', 'c-z2-45'],
      secondary: ['c-hiit-1', 'c-bike'],
      rationale: 'Mixed approach. Zone-2 builds aerobic base for everyday energy; an interval session per week keeps VO₂ honest.',
    },
  },
  { id:'soccer',    label:'Soccer',          sub:'Posterior + power',
    priority:{ glutes:1.4, hams:1.4, quads:1.2, core:1.2, calves:1.2 }, daysHint:3, template:'sport4',
    cardioProfile: {
      primary:   ['c-sprint', 'c-agility'],
      secondary: ['c-z2-45', 'c-tempo'],
      rationale: 'Soccer = repeated sprints with short recoveries. Build anaerobic capacity with sprint intervals + agility work; zone 2 lifts 90-min match endurance.',
    },
  },
  { id:'bball',     label:'Basketball',      sub:'Jump + lateral',
    priority:{ quads:1.4, glutes:1.3, calves:1.3, core:1.2, shoulder:1.1 }, daysHint:3, template:'sport4',
    cardioProfile: {
      primary:   ['c-sprint', 'c-agility'],
      secondary: ['c-z2-30', 'c-jumprope'],
      rationale: 'Basketball needs explosive bursts + recovery. Sprint intervals build anaerobic capacity; zone 2 builds aerobic base for game endurance.',
    },
  },
  { id:'football',  label:'Football',        sub:'Power + strength',
    priority:{ glutes:1.3, quads:1.3, hams:1.3, back:1.2, shoulder:1.2, core:1.2 }, daysHint:4, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-sprint', 'c-hill'],
      secondary: ['c-z2-30', 'c-agility'],
      rationale: 'Football is short, max-effort plays. Hill sprints develop power; brief zone-2 keeps the engine without sapping strength.',
    },
  },
  { id:'baseball',  label:'Baseball',        sub:'Rotational + posterior',
    priority:{ shoulder:1.3, back:1.2, core:1.4, hams:1.2, glutes:1.2 }, daysHint:3, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-sprint', 'c-agility'],
      secondary: ['c-z2-30'],
      rationale: 'Baseball is bursts of effort. Short sprints + agility cover the energy system; light zone-2 keeps recovery between games.',
    },
  },
  { id:'tennis',    label:'Tennis',          sub:'Rotational + shoulder',
    priority:{ shoulder:1.3, core:1.4, back:1.2, quads:1.1 }, daysHint:3, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-agility', 'c-sprint'],
      secondary: ['c-z2-30', 'c-jumprope'],
      rationale: 'Tennis = lateral bursts + recovery between points. Agility ladders + sprints; jump rope builds court coverage.',
    },
  },
  { id:'volleyball',label:'Volleyball',      sub:'Vertical + shoulder',
    priority:{ shoulder:1.3, quads:1.3, calves:1.3, core:1.2 }, daysHint:3, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-jumprope', 'c-sprint'],
      secondary: ['c-z2-30'],
      rationale: 'Volleyball is jump-and-recover. Plyometric jump rope + short sprints; minimal long cardio so jumps stay snappy.',
    },
  },
  { id:'bjj',       label:'BJJ / Grappling', sub:'Pull + core',
    priority:{ back:1.4, bis:1.2, core:1.5, hams:1.1 }, daysHint:3, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-z2-45', 'c-metcon'],
      secondary: ['c-row', 'c-hiit-1'],
      rationale: 'BJJ rounds = sustained mid-intensity. Zone-2 builds the engine for 5-min rounds; metcons mimic scramble pace.',
    },
  },
  { id:'climb',     label:'Climbing',        sub:'Pull-dominant',
    priority:{ back:1.5, bis:1.3, shoulder:1.2, core:1.4, hams:0.8 }, daysHint:3, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-z2-30'],
      secondary: ['c-finger', 'c-bike'],
      rationale: 'Climbing pulls from finger + grip endurance. Long-form zone-2 keeps total body conditioning low-impact; finger ladders are sport-specific.',
    },
  },
  { id:'run',       label:'Running',         sub:'Posterior + core',
    priority:{ glutes:1.3, hams:1.3, calves:1.3, core:1.3 }, daysHint:3, template:'full3',
    cardioProfile: {
      primary:   ['c-z2-45', 'c-tempo', 'c-hill'],
      secondary: ['c-long', 'c-easy-20'],
      rationale: 'Distance runners build a big aerobic base (zone-2 + long), top off with one tempo + one hill day for VO₂ + lactate threshold.',
    },
  },
  { id:'cycling',   label:'Cycling',         sub:'Quads + posterior',
    priority:{ quads:1.4, glutes:1.3, hams:1.2, core:1.2, calves:1.1 }, daysHint:3, template:'full3',
    cardioProfile: {
      primary:   ['c-bike', 'c-tempo'],
      secondary: ['c-z2-45', 'c-hiit-1'],
      rationale: 'Cyclists live at threshold. Sweet-spot intervals + zone-2 long rides; one HIIT block keeps top-end power.',
    },
  },
  { id:'swimming',  label:'Swimming',        sub:'Pull + shoulder',
    priority:{ back:1.4, shoulder:1.3, core:1.3, tris:1.1 }, daysHint:3, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-swim-long', 'c-swim-int'],
      secondary: ['c-z2-30'],
      rationale: 'Swim cardio in the pool: a long aerobic swim + a sprint set. Brief land zone-2 for active recovery.',
    },
  },
  { id:'powerlift', label:'Powerlifting',    sub:'Squat / Bench / DL focus',
    priority:{ quads:1.3, glutes:1.3, hams:1.3, back:1.4, chest:1.3, shoulder:1.1, core:1.2 }, daysHint:4, template:'ulhalf',
    cardioProfile: {
      primary:   ['c-easy-20', 'c-z2-30'],
      secondary: ['c-fasted'],
      rationale: 'Minimal cardio — protect strength sessions. Easy zone-2 walks for recovery + circulation; no HIIT, no hills.',
    },
  },
  { id:'crossfit',  label:'CrossFit',        sub:'Mixed-modal',
    priority:{ quads:1.2, glutes:1.2, back:1.2, shoulder:1.2, core:1.3 }, daysHint:5, template:'ppl5',
    cardioProfile: {
      primary:   ['c-metcon', 'c-row'],
      secondary: ['c-z2-30', 'c-hiit-1'],
      rationale: 'CrossFit is the cardio. Most days are metcons; pad with a row erg or zone-2 between session-heavy weeks.',
    },
  },
];

// v11 Issue 6: per-sport athletic context for the Cardio tab. Three short
// human-readable strings per sport; if a sport isn't in the map we fall
// back to the 'general' entry so the tab never renders blank.
export const SPORT_DEEP_INFO = {
  general: {
    athleticProfile: "General fitness covers a balanced approach to strength, cardio, and mobility. The goal is health and resilience, not specialization. Mix moderate aerobic work with strength training to support everyday activity.",
    energySystems: "All three systems matter: aerobic for daily energy, anaerobic for short bursts, and ATP-PC for explosive moves. No one system dominates — train all of them moderately.",
    trainingNotes: "Aim for 150 minutes of moderate cardio per week (CDC baseline) plus 2-3 strength sessions. Don't chase any single metric. Consistency over intensity. Most over-do cardio and skimp on lower-body strength — invert that.",
  },
  soccer: {
    athleticProfile: "Soccer is a 90-minute repeated-sprint sport with short recovery windows between high-intensity efforts. Players cover 7-12 km per match, with 2-3% at sprint pace. Posterior-chain strength + change-of-direction stability are critical.",
    energySystems: "ATP-PC dominates each sprint (5-15 seconds). Glycolytic system fires for repeated sprints in the same passage of play. Aerobic system runs the show in between sprints and across the full 90 minutes.",
    trainingNotes: "Most soccer players over-emphasize quads and neglect hamstrings + glutes (the prime sprint movers). Cardio should mix sprint intervals (6-10 × 30s) with one weekly zone-2 run for 90-min match endurance. Skip the long slow distance.",
  },
  bball: {
    athleticProfile: "Basketball is a stop-go sport demanding repeated explosive sprints with brief recovery. Athletes need vertical jump, lateral agility, and the aerobic base to maintain output deep into Q4. Quads, glutes, and calves carry the load.",
    energySystems: "ATP-PC dominates the first 10 seconds of every play (sprint, jump). Glycolytic fires in 30-90s rallies up the court. Aerobic supports recovery between possessions and full-game endurance.",
    trainingNotes: "Most basketball players over-train chest and under-train rear delts and external rotators. Lower-body should emphasize unilateral work (lunges, single-leg deadlifts) for change-of-direction stability. Cardio: sprint intervals + one weekly zone-2 run.",
  },
  football: {
    athleticProfile: "Football is short, max-effort plays with long recovery between snaps. Average play lasts 4-7 seconds with 30-40s rest. Demands explosive power, top-end strength, and positional speed.",
    energySystems: "ATP-PC absolutely dominates (every play). Glycolytic fires on sustained drives. Aerobic system mostly for recovery between plays and avoiding cumulative fatigue.",
    trainingNotes: "Heavy compound lifts (squat, bench, deadlift, clean) drive position-relevant power. Cardio is hill sprints + brief zone-2; avoid long aerobic work that erodes strength. Pre-season conditioning matters more than in-season volume.",
  },
  baseball: {
    athleticProfile: "Baseball is rotational power sport with short bursts and long passive periods. Sprint speed (90ft to 1st base), throwing velocity, and bat speed are all rotational + explosive. Core stability across multiple planes is the foundation.",
    energySystems: "Almost entirely ATP-PC for the actual sport actions (swing, throw, sprint to base). Aerobic system mostly contributes to recovery and avoiding mid-game fatigue from heat.",
    trainingNotes: "Pitchers need shoulder + scapular health drills daily — the throwing motion grinds the joint. Hitters need rotational power (medicine-ball throws, cable rotations). Cardio is light: short sprints + a couple zone-2 sessions.",
  },
  tennis: {
    athleticProfile: "Tennis points last 5-15 seconds at high intensity, separated by 15-25s of rest. Lateral movement dominates. Shoulder, core, and quads handle the workload; serve velocity comes from full-body rotation.",
    energySystems: "ATP-PC for each point. Glycolytic fires on long rallies. Aerobic supports the 2-3 hour match length and recovery between points.",
    trainingNotes: "Most tennis players over-develop the dominant arm side; train both sides equally. Agility work (ladder, cone drills) mirrors court coverage better than long-distance running. Mix sprint intervals + one zone-2 + one jump-rope session.",
  },
  volleyball: {
    athleticProfile: "Volleyball is jump-and-recover. Players jump 100-300 times per match (more for hitters/blockers). Vertical leap, shoulder durability, and lateral defensive movement are key. Calves, quads, and glutes drive the jump.",
    energySystems: "ATP-PC dominates each jump and spike. Brief glycolytic effort between rallies. Aerobic system minimal — most rest periods are short and active.",
    trainingNotes: "Plyometric work (jump rope, box jumps, depth jumps) trumps long cardio for jump-sport athletes. Avoid heavy aerobic that taxes the legs. Shoulder mobility + rotator-cuff work daily for hitters. Most over-train chest and skip rear delts.",
  },
  bjj: {
    athleticProfile: "BJJ rounds are sustained 5-minute bouts of grappling with brief rests. Demands grip endurance, posterior-chain strength, and core stability across multiple planes. Pull-dominant.",
    energySystems: "Glycolytic system runs the show in 5-min rounds. Aerobic builds the engine for multiple matches in a competition day. ATP-PC for explosive scrambles and submissions.",
    trainingNotes: "Most BJJ players neglect cardio entirely and gas in round 2. Build a zone-2 base with rowing or running 2× per week. Add metcons (kettlebell flows, complexes) to mimic scramble pace. Grip work (farmer carries) pays off on the mat.",
  },
  climb: {
    athleticProfile: "Climbing is finger and grip endurance, pull-dominant strength, body tension, and route reading. Power-to-weight ratio matters more than absolute strength. Forearms, lats, and core do most of the work.",
    energySystems: "Aerobic capacity in fingers/forearms = ability to recover on small holds mid-route. ATP-PC for crux moves and dynamic catches. Glycolytic for sustained pumpy sequences.",
    trainingNotes: "Most climbers over-pull and under-press, leading to shoulder imbalances. Antagonist work (push-ups, dumbbell press) keeps shoulders healthy. Cardio: zone-2 to keep weight in check; finger-board ladders for sport-specific power.",
  },
  run: {
    athleticProfile: "Distance running is dominated by aerobic systems with sport-specific stride efficiency. Running economy, lactate threshold, and VO₂max matter more than top-end strength. Posterior chain + core stability prevent injury.",
    energySystems: "Aerobic dominates above all else (>85% of energy on long runs). Lactate threshold sets your sustainable race pace. Anaerobic only matters for kicks at the finish.",
    trainingNotes: "80% of weekly mileage should be easy (zone-2). 20% can be tempo or intervals. Most beginners run all their easy days too hard. Add 2× weekly strength: posterior chain (RDLs, hip thrusts) + single-leg work (lunges, step-ups) to bulletproof against injury.",
  },
  cycling: {
    athleticProfile: "Cycling is a quad-dominant power-endurance sport. Sustained threshold output (FTP) is the key metric. Glutes, quads, and core contribute; upper body mostly stabilizes. Position on the bike matters as much as fitness.",
    energySystems: "Aerobic system is the engine for road cycling. Lactate threshold (sweet-spot work) extends sustainable race pace. Anaerobic capacity matters for breakaways and short climbs.",
    trainingNotes: "Most cyclists ride too much in the 'gray zone' — neither easy enough to recover nor hard enough to drive adaptation. Polarize: 80% easy zone-2, 20% threshold/VO₂. Add lower-body strength 2× per week to support sustained power.",
  },
  swimming: {
    athleticProfile: "Swimming is a pull-dominant whole-body sport. Lats, shoulders, and core drive every stroke. Streamline + technique matter more than raw strength. Demands shoulder mobility + flexibility most other sports don't need.",
    energySystems: "Depends on event: sprint events (50m) are nearly all anaerobic; distance events (1500m+) are 80%+ aerobic. Most training balances aerobic base + race-pace intervals.",
    trainingNotes: "Most swimmers over-pull and develop shoulder impingement; balance with rear delt + external rotation work in the gym. Land cardio (run, bike) supports off-day recovery without taxing the shoulders. Streamline + dolphin kick = free speed.",
  },
  powerlift: {
    athleticProfile: "Powerlifting is one-rep-max strength in three lifts: squat, bench, deadlift. Demands maximal force production, joint stability, and the ability to generate full-body tension under heavy loads. Cardio is a recovery tool, not a goal.",
    energySystems: "ATP-PC system handles the actual lift (1-5 second efforts). Aerobic system supports recovery between sets and across training weeks. Glycolytic mostly irrelevant for max-strength work.",
    trainingNotes: "Cardio should be minimal — easy zone-2 walks or short stationary bike for circulation only. NO HIIT, NO hill sprints (taxes recovery). Keep heart rate < 130 bpm. Most powerlifters either over-do cardio (kills strength) or do none (poor recovery, fat gain).",
  },
  crossfit: {
    athleticProfile: "CrossFit is mixed-modal fitness across all energy systems. Workouts blend strength, gymnastics, and cardio in unpredictable combinations. Demands broad capacity rather than peak in any one domain.",
    energySystems: "All three. ATP-PC (1RM lifts, single-rep movements). Glycolytic (most metcons in the 5-20 min range). Aerobic (longer chippers, recovery between rounds, total weekly volume).",
    trainingNotes: "CrossFit IS the cardio for most days. Pad recovery with one zone-2 session per week (row erg or run) to support total volume. Strength bias: prioritize the named lifts (squat, deadlift, press, snatch, clean) over the metcon-of-the-day for long-term gains.",
  },
};

export const TARGETS = {
  chest:    { min:10, max:18 },
  back:     { min:12, max:20 },
  shoulder: { min:8,  max:16 },
  arms:     { min:6,  max:16 },
  bis:      { min:6,  max:12 },
  tris:     { min:6,  max:12 },
  quads:    { min:12, max:22 },
  hams:     { min:10, max:18 },
  glutes:   { min:10, max:18 },
  calves:   { min:6,  max:12 },
  core:     { min:8,  max:16 },
};

export const MUSCLE_LABELS = {
  chest:'Chest', back:'Back', shoulder:'Shoulders', arms:'Arms',
  bis:'Biceps', tris:'Triceps',
  quads:'Quads', hams:'Hamstrings', glutes:'Glutes', calves:'Calves', core:'Core',
};

export function setsForExercise(ex) {
  const m = ex.sets.match(/^(\d+)/);
  return m ? parseInt(m[1],10) : 3;
}

export function computeCoverage(days) {
  const out = { chest:0, back:0, shoulder:0, arms:0, bis:0, tris:0, quads:0, hams:0, glutes:0, calves:0, core:0 };
  for (const day of days) {
    if (day.rest) continue;
    for (const exId of day.exIds) {
      const ex = EXERCISES.find(e => e.id === exId);
      if (!ex) continue;
      const setCount = setsForExercise(ex);
      for (const [muscle, weight] of Object.entries(ex.hits)) {
        if (out[muscle] !== undefined) out[muscle] += setCount * weight;
      }
    }
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k]);
  return out;
}

export function statusFor(sets, target) {
  if (sets < target.min) return 'under';
  if (sets > target.max) return 'over';
  return 'optimal';
}

// Get exercises that match a day-type (for the type-filtered library)
export function exercisesForDayType(typeId) {
  if (!typeId || typeId === 'rest' || typeId === 'sport') return [];
  if (typeId === 'custom') return EXERCISES.filter(e => e.type !== 'cardio');
  // Compound types
  if (typeId === 'push')   return EXERCISES.filter(e => e.type === 'push' || e.body === 'shoulder');
  if (typeId === 'pull')   return EXERCISES.filter(e => e.type === 'pull');
  if (typeId === 'legs')   return EXERCISES.filter(e => e.type === 'legs');
  if (typeId === 'upper')  return EXERCISES.filter(e => ['chest','back','shoulder','bis','tris','core'].includes(e.body));
  if (typeId === 'lower')  return EXERCISES.filter(e => ['quads','hams','glutes','calves','core'].includes(e.body));
  if (typeId === 'full')   return EXERCISES.filter(e => ['chest','back','quads','glutes','hams','shoulder','core'].includes(e.body));
  if (typeId === 'arms')   return EXERCISES.filter(e => ['bis','tris'].includes(e.body));
  if (typeId === 'cardio') return EXERCISES.filter(e => e.body === 'cardio');
  // Specific body part — just exercises tagged with that body
  return EXERCISES.filter(e => e.body === typeId);
}

// planForSport lives in src/data/templates.js to avoid a circular dependency
// (SPORTS lives here, SPLIT_TEMPLATES lives there).

// ---------- CARDIO ----------
export const CARDIO_TYPES = {
  zone2:  { label: 'Zone 2',     color: '#19B6FF', kcal: 9 },
  hiit:   { label: 'HIIT',       color: '#FF6BD6', kcal: 14 },
  tempo:  { label: 'Tempo',      color: '#9B5BFF', kcal: 12 },
  long:   { label: 'Long run',   color: '#5B5BFF', kcal: 10 },
  easy:   { label: 'Easy',       color: '#7C7CFF', kcal: 8 },
  bike:   { label: 'Bike',       color: '#19B6FF', kcal: 8 },
  row:    { label: 'Row',        color: '#C09BFF', kcal: 11 },
  sprint: { label: 'Sprints',    color: '#FF4444', kcal: 16 },
  hill:   { label: 'Hill repeats',color:'#FF8C42', kcal: 14 },
  agility:{ label: 'Agility',    color: '#FFD93D', kcal: 12 },
  jump:   { label: 'Jump rope',  color: '#FF6BD6', kcal: 13 },
  swim:   { label: 'Swim',       color: '#4ED9C0', kcal: 11 },
  metcon: { label: 'Metcon',     color: '#FF4444', kcal: 15 },
  fasted: { label: 'Fasted walk',color: '#7C7CFF', kcal: 5 },
  finger: { label: 'Finger ladder', color: '#A86CFF', kcal: 4 },
};

export const CARDIO_LIBRARY = [
  { id:'c-z2-30',    type:'zone2',  name:'Zone-2 Run',        dur:30, dist:4.5, unit:'mi' },
  { id:'c-z2-45',    type:'zone2',  name:'Zone-2 Run',        dur:45, dist:6.5, unit:'mi' },
  { id:'c-easy-20',  type:'easy',   name:'Easy Recovery',     dur:20, dist:2.5, unit:'mi' },
  { id:'c-tempo',    type:'tempo',  name:'Tempo Run',         dur:25, dist:4.0, unit:'mi' },
  { id:'c-hiit-1',   type:'hiit',   name:'HIIT 8×1m',         dur:20, dist:0,   unit:'min' },
  { id:'c-hiit-2',   type:'hiit',   name:'HIIT 30/30',        dur:18, dist:0,   unit:'min' },
  { id:'c-long',     type:'long',   name:'Long Run',          dur:60, dist:8.0, unit:'mi' },
  { id:'c-bike',     type:'bike',   name:'Bike Ride',         dur:40, dist:12,  unit:'mi' },
  { id:'c-row',      type:'row',    name:'Row Erg',           dur:20, dist:0,   unit:'min' },
  // ---- Sport-specific (added v5) ----
  { id:'c-sprint',   type:'sprint', name:'Sprint Intervals',  dur:18, dist:0,   unit:'min' },
  { id:'c-agility',  type:'agility',name:'Agility Ladder',    dur:15, dist:0,   unit:'min' },
  { id:'c-hill',     type:'hill',   name:'Hill Sprints',      dur:25, dist:0,   unit:'min' },
  { id:'c-jumprope', type:'jump',   name:'Jump Rope',         dur:15, dist:0,   unit:'min' },
  { id:'c-swim-long',type:'swim',   name:'Long Swim',         dur:45, dist:1.5, unit:'mi' },
  { id:'c-swim-int', type:'swim',   name:'Swim Sprint Set',   dur:30, dist:0,   unit:'min' },
  { id:'c-metcon',   type:'metcon', name:'Metcon WOD',        dur:20, dist:0,   unit:'min' },
  { id:'c-fasted',   type:'fasted', name:'Fasted Walk',       dur:30, dist:1.5, unit:'mi' },
  { id:'c-finger',   type:'finger', name:'Finger Endurance',  dur:20, dist:0,   unit:'min' },
];

export const INITIAL_CARDIO_DAYS = [
  { items: [] },
  { items: ['c-z2-30'] },
  { items: [] },
  { items: ['c-hiit-1'] },
  { items: [] },
  { items: ['c-long'] },
  { items: [] },
];

export function cardioFor(id) { return CARDIO_LIBRARY.find(c => c.id === id); }

export function totalCardioMinutes(cardioDays) {
  let m = 0;
  for (const d of cardioDays) for (const id of d.items) {
    const c = cardioFor(id); if (c) m += c.dur;
  }
  return m;
}

export function totalCardioKcal(cardioDays) {
  let k = 0;
  for (const d of cardioDays) for (const id of d.items) {
    const c = cardioFor(id); if (c) k += c.dur * (CARDIO_TYPES[c.type]?.kcal || 8);
  }
  return Math.round(k);
}

export function totalCardioMiles(cardioDays) {
  let mi = 0;
  for (const d of cardioDays) for (const id of d.items) {
    const c = cardioFor(id); if (c && c.unit === 'mi') mi += c.dist;
  }
  return Math.round(mi * 10) / 10;
}

// ---------- TIME / KCAL ESTIMATIONS ----------
export function liftMinutesForDay(day) {
  if (!day || day.rest) return 0;
  const sets = day.exIds.reduce((s, id) => {
    const ex = EXERCISES.find(e => e.id === id);
    return s + (ex ? setsForExercise(ex) : 0);
  }, 0);
  if (sets === 0) return 0;
  return sets * 3 + 8;
}

export function totalLiftMinutes(days) {
  return days.reduce((s, d) => s + liftMinutesForDay(d), 0);
}

export function totalLiftKcal(days) { return Math.round(totalLiftMinutes(days) * 6); }

// Derive age (years) from a YYYY-MM-DD birthday string. Handles the leap-day
// edge case and returns null if the string is empty / invalid.
export function ageFromBirthday(bdayStr) {
  if (!bdayStr || typeof bdayStr !== 'string') return null;
  const parts = bdayStr.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(n => parseInt(n, 10));
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBday) age--;
  return age;
}

// Compute a synthetic YYYY-MM-DD birthday from an age (used in migrations).
export function birthdayFromAge(age) {
  const a = Number(age) || 22;
  const today = new Date();
  const y = today.getFullYear() - a;
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function estimateBMR({ weight, wUnit, height, hUnit, age = 28, sex = 'm', birthday }) {
  // Prefer derived age from birthday if available — single source of truth.
  const eff = (birthday && ageFromBirthday(birthday)) || age || 28;
  const wKg = wUnit === 'lb' ? weight * 0.4536 : Number(weight);
  // v9: 'in' (whole inches) is the new imperial height unit; legacy 'ft'
  // (decimal feet) still supported for back-compat.
  const hCm = hUnit === 'in' ? Number(height) * 2.54
            : hUnit === 'ft' ? Number(height) * 30.48
            : Number(height);
  const base = 10 * wKg + 6.25 * hCm - 5 * eff;
  // Mifflin–St Jeor: m +5, f −161; non-binary / undisclosed → midpoint (−78).
  if (sex === 'f' || sex === 'female') return Math.round(base - 161);
  if (sex === 'm' || sex === 'male')   return Math.round(base + 5);
  return Math.round(base - 78);
}

// Activity multiplier from training days/week.
export function activityMultiplier(days) {
  const d = Number(days) || 4;
  if (d <= 2) return 1.375;
  if (d === 3) return 1.45;
  if (d === 4) return 1.55;
  if (d === 5) return 1.65;
  return 1.725;
}

export function tdeeFor(profile) {
  const bmr = estimateBMR(profile);
  return Math.round(bmr * activityMultiplier(profile.days));
}

// Macro targets (g/day). Protein 1.8g/kg (2.2 if cutting flag set), fat 25% TDEE / 9, carbs remainder / 4.
export function macrosFor(profile, tdee) {
  const wKg = profile.wUnit === 'lb' ? Number(profile.weight) * 0.4536 : Number(profile.weight);
  const proteinPerKg = profile.cutting ? 2.2 : 1.8;
  const protein = Math.round(wKg * proteinPerKg);
  const fat = Math.round((tdee * 0.25) / 9);
  const carbs = Math.max(0, Math.round((tdee - (protein * 4 + fat * 9)) / 4));
  return { protein, fat, carbs };
}

// Tanaka max HR + zones.
export function hrZonesFor(age) {
  const a = Number(age) || 28;
  const max = Math.round(208 - 0.7 * a);
  const z2  = [Math.round(max * 0.60), Math.round(max * 0.70)];
  const tempo = [Math.round(max * 0.75), Math.round(max * 0.85)];
  const hiit  = [Math.round(max * 0.85), Math.round(max * 0.95)];
  return { max, z2, tempo, hiit };
}

// Map a cardio session's type to a target HR band, using profile age via Tanaka.
export function cardioHRZone(cardio, profile) {
  if (!cardio || !profile) return null;
  const intensityMap = { zone2:'z2', easy:'z2', bike:'z2', row:'z2', tempo:'tempo', long:'tempo', hiit:'hiit' };
  const key = intensityMap[cardio.type];
  if (!key) return null;
  const age = (profile.birthday && ageFromBirthday(profile.birthday)) || profile.age;
  return hrZonesFor(age)[key];
}

export function dailyKcalNeed(profile, weeklyTrainingKcal) {
  const bmr = estimateBMR(profile);
  const baseMaint = bmr * 1.45;
  const fromTraining = weeklyTrainingKcal / 7;
  return Math.round(baseMaint + fromTraining);
}

// ---------- SCORE (split into two: lifting + cardio) ----------
export function liftingScore(days, profile) {
  const liftDays = days.filter(d => !d.rest).length;
  const adherence = Math.min(1, liftDays / Math.max(1, profile.days));

  const cov = computeCoverage(days);
  let inBand = 0, total = 0;
  for (const k of Object.keys(TARGETS)) {
    total++;
    const s = cov[k] || 0;
    const t = TARGETS[k];
    if (s >= t.min && s <= t.max) inBand++;
  }
  const balance = total === 0 ? 0 : inBand / total;
  const minutes = totalLiftMinutes(days);
  const hours = minutes / 60;
  let timeScore = 0;
  if (hours >= 2 && hours <= 6) timeScore = 1;
  else if (hours >= 1 && hours < 2) timeScore = 0.7;
  else if (hours > 6 && hours <= 8) timeScore = 0.85;
  else timeScore = 0.5;

  const score = Math.round(adherence * 35 + balance * 40 + timeScore * 25);
  return { score, adherence, balance, timeScore, hours, inBand, total };
}

export function cardioScoreFor(cardioDays) {
  const sessions = cardioDays.filter(d => d.items.length > 0).length;
  const minutes = totalCardioMinutes(cardioDays);
  // CDC-ish: 150min mod or 75min vig. Use 120min as full credit baseline.
  const minScore = Math.min(1, minutes / 120);
  const sessionScore = Math.min(1, sessions / 3);
  // Variety: count distinct types
  const types = new Set();
  for (const d of cardioDays) for (const id of d.items) {
    const c = cardioFor(id); if (c) types.add(c.type);
  }
  const varietyScore = Math.min(1, types.size / 3);
  const score = Math.round(minScore * 50 + sessionScore * 35 + varietyScore * 15);
  return { score, minScore, sessionScore, varietyScore, sessions, minutes, types: types.size };
}

// Combined health score (kept for backwards compat with confetti trigger)
export function computeScore(days, cardioDays, profile) {
  const lift = liftingScore(days, profile);
  const cardio = cardioScoreFor(cardioDays);
  // Combined: 60% lift, 40% cardio
  const score = Math.round(lift.score * 0.6 + cardio.score * 0.4);
  return { score, lift, cardio,
    adherence: lift.adherence, balance: lift.balance,
    cardioOK: cardio.score / 100, timeScore: lift.timeScore,
    hours: lift.hours + cardio.minutes/60, inBand: lift.inBand, total: lift.total };
}

// Find under-worked muscles (below target min)
export function underworkedMuscles(days) {
  const cov = computeCoverage(days);
  const out = [];
  for (const k of Object.keys(TARGETS)) {
    const s = cov[k] || 0;
    const t = TARGETS[k];
    if (s < t.min) out.push({ key: k, label: MUSCLE_LABELS[k], sets: s, gap: t.min - s });
  }
  return out.sort((a,b) => b.gap - a.gap);
}

