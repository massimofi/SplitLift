// SplitLift data: exercises with type tags, library, sports

const TYPE_LABELS = {
  push:   { label: 'Push',     color: 'var(--t-push)' },
  pull:   { label: 'Pull',     color: 'var(--t-pull)' },
  legs:   { label: 'Legs',     color: 'var(--t-legs)' },
  shoul:  { label: 'Shoulders',color: 'var(--t-shoul)' },
  core:   { label: 'Core',     color: 'var(--t-core)' },
  cardio: { label: 'Cardio',   color: 'var(--t-cardio)' },
};

const EXERCISES = [
  // Push
  { id:'bench',    name:'Bench Press',          type:'push',   gear:'BB',  sets:'4 × 6',  hits:{chest:1.0, shoulder:0.4, arms:0.3} },
  { id:'incline',  name:'Incline DB Press',     type:'push',   gear:'DB',  sets:'3 × 8',  hits:{chest:1.0, shoulder:0.5, arms:0.3} },
  { id:'fly',      name:'Cable Fly',            type:'push',   gear:'CBL', sets:'3 × 12', hits:{chest:1.0} },
  { id:'dip',      name:'Dip',                  type:'push',   gear:'BW',  sets:'3 × 10', hits:{chest:0.8, arms:0.6, shoulder:0.3} },
  { id:'pushup',   name:'Push-Up',              type:'push',   gear:'BW',  sets:'3 × 15', hits:{chest:0.7, core:0.3, arms:0.2} },
  { id:'tri',      name:'Tricep Pushdown',      type:'push',   gear:'CBL', sets:'3 × 12', hits:{arms:1.0} },

  // Pull
  { id:'pullup',   name:'Pull-Up',              type:'pull',   gear:'BW',  sets:'4 × 6',  hits:{back:1.0, arms:0.6} },
  { id:'row',      name:'Chest-Sup. Row',       type:'pull',   gear:'DB',  sets:'3 × 10', hits:{back:1.0, arms:0.5} },
  { id:'pulldown', name:'Lat Pulldown',         type:'pull',   gear:'CBL', sets:'3 × 10', hits:{back:1.0, arms:0.5} },
  { id:'tbar',     name:'T-Bar Row',            type:'pull',   gear:'BB',  sets:'4 × 8',  hits:{back:1.0, arms:0.4} },
  { id:'curlbb',   name:'Barbell Curl',         type:'pull',   gear:'BB',  sets:'3 × 10', hits:{arms:1.0} },
  { id:'hammer',   name:'Hammer Curl',          type:'pull',   gear:'DB',  sets:'3 × 10', hits:{arms:1.0} },

  // Legs
  { id:'squat',    name:'Back Squat',           type:'legs',   gear:'BB',  sets:'5 × 5',  hits:{quads:1.0, glutes:0.6, core:0.3} },
  { id:'front',    name:'Front Squat',          type:'legs',   gear:'BB',  sets:'5 × 4',  hits:{quads:1.0, core:0.4, glutes:0.4} },
  { id:'tbardl',   name:'Trap-Bar Deadlift',    type:'legs',   gear:'BB',  sets:'5 × 5',  hits:{glutes:1.0, hams:0.8, back:0.5} },
  { id:'rdl',      name:'Romanian Deadlift',    type:'legs',   gear:'BB',  sets:'4 × 8',  hits:{hams:1.0, glutes:0.7, back:0.3} },
  { id:'split',    name:'Bulgarian Split Sq.',  type:'legs',   gear:'DB',  sets:'3 × 10', hits:{quads:0.8, glutes:0.7, core:0.3} },
  { id:'curl',     name:'Hamstring Curl',       type:'legs',   gear:'MCH', sets:'3 × 12', hits:{hams:1.0} },
  { id:'calf',     name:'Calf Raise',           type:'legs',   gear:'MCH', sets:'4 × 12', hits:{calves:1.0} },
  { id:'box',      name:'Box Jump',             type:'legs',   gear:'BW',  sets:'5 × 3',  hits:{quads:0.7, glutes:0.5, calves:0.3} },

  // Shoulders
  { id:'ohp',      name:'Overhead Press',       type:'shoul',  gear:'BB',  sets:'3 × 8',  hits:{shoulder:1.0, arms:0.4, core:0.3} },
  { id:'lat',      name:'Lateral Raise',        type:'shoul',  gear:'DB',  sets:'3 × 15', hits:{shoulder:1.0} },
  { id:'rear',     name:'Rear Delt Fly',        type:'shoul',  gear:'DB',  sets:'3 × 12', hits:{shoulder:0.8, back:0.3} },
  { id:'face',     name:'Face Pull',            type:'shoul',  gear:'CBL', sets:'3 × 15', hits:{shoulder:0.8, back:0.4} },

  // Core
  { id:'plank',    name:'Plank',                type:'core',   gear:'BW',  sets:'3 × 45s',hits:{core:1.0} },
  { id:'hang',     name:'Hanging Leg Raise',    type:'core',   gear:'BW',  sets:'3 × 12', hits:{core:1.0} },
  { id:'pallof',   name:'Pallof Press',         type:'core',   gear:'CBL', sets:'3 × 10', hits:{core:1.0} },
  { id:'wood',     name:'Cable Woodchop',       type:'core',   gear:'CBL', sets:'3 × 12', hits:{core:1.0} },

  // Cardio
  { id:'z2run',    name:'Zone-2 Run',           type:'cardio', gear:'RUN', sets:'30 min', hits:{} },
  { id:'hiit',     name:'HIIT Intervals',       type:'cardio', gear:'BIK', sets:'8 × 1m',  hits:{} },
  { id:'row-erg',  name:'Row Erg',              type:'cardio', gear:'ROW', sets:'20 min', hits:{back:0.3} },
];

const FILTER_CHIPS = [
  { id:'all',    label:'All' },
  { id:'push',   label:'Push' },
  { id:'pull',   label:'Pull' },
  { id:'legs',   label:'Legs' },
  { id:'shoul',  label:'Shoulders' },
  { id:'core',   label:'Core' },
  { id:'cardio', label:'Cardio' },
];

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const INITIAL_DAYS = [
  { focus:'Push',                exIds:['bench','ohp','fly','tri'] },
  { focus:'Sport',               exIds:[], rest:true, restNote:'Sport practice — coverage handled on the field.' },
  { focus:'Pull',                exIds:['pullup','row','face','curlbb'] },
  { focus:'Legs / Posterior',    exIds:['tbardl','split','curl','calf'] },
  { focus:'Power',               exIds:['front','box','rdl'] },
  { focus:'Sport',               exIds:[], rest:true, restNote:'Match day.' },
  { focus:'Rest',                exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' },
];

const SPORTS = [
  { id:'general', label:'General fitness', sub:'Balanced everywhere' },
  { id:'soccer',  label:'Soccer',          sub:'Posterior + power' },
  { id:'bball',   label:'Basketball',      sub:'Jump + lateral' },
  { id:'bjj',     label:'BJJ / Grappling', sub:'Pull + core' },
  { id:'climb',   label:'Climbing',        sub:'Pull-dominant' },
  { id:'run',     label:'Running',         sub:'Posterior + core' },
];

const TARGETS = {
  chest:    { min:10, max:18 },
  back:     { min:12, max:20 },
  shoulder: { min:8,  max:16 },
  arms:     { min:6,  max:16 },
  quads:    { min:12, max:22 },
  hams:     { min:10, max:18 },
  glutes:   { min:10, max:18 },
  calves:   { min:6,  max:12 },
  core:     { min:8,  max:16 },
};

const MUSCLE_LABELS = {
  chest:'Chest', back:'Back', shoulder:'Shoulders', arms:'Arms',
  quads:'Quads', hams:'Hamstrings', glutes:'Glutes', calves:'Calves', core:'Core',
};

function setsForExercise(ex) {
  const m = ex.sets.match(/^(\d+)/);
  return m ? parseInt(m[1],10) : 3;
}

function computeCoverage(days) {
  const out = { chest:0, back:0, shoulder:0, arms:0, quads:0, hams:0, glutes:0, calves:0, core:0 };
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

function statusFor(sets, target) {
  if (sets < target.min) return 'under';
  if (sets > target.max) return 'over';
  return 'optimal';
}

Object.assign(window, {
  TYPE_LABELS, EXERCISES, FILTER_CHIPS, DAY_NAMES, INITIAL_DAYS, SPORTS,
  TARGETS, MUSCLE_LABELS, setsForExercise, computeCoverage, statusFor
});
