// Map SplitLift exercise IDs to slugs from yuhonas/free-exercise-db.
// Each slug points to a folder with /images/0.jpg and /images/1.jpg that we
// alternate as a 2-frame animation.
//
// Source: https://github.com/yuhonas/free-exercise-db (public domain)
//
// Best-effort matches. If a slug 404s, ExerciseGif falls back to a placeholder
// (dumbbell glyph) silently — no broken-image icons. Add new mappings here as
// we extend EXERCISES.

export const EXERCISE_IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export const EXERCISE_IMAGES = {
  // ---- CHEST ----
  bench:     'Barbell_Bench_Press_-_Medium_Grip',
  incline:   'Incline_Dumbbell_Press',
  fly:       'Cable_Crossover',
  dip:       'Dips_-_Triceps_Version',
  pushup:    'Pushups',
  declinedb: 'Decline_Dumbbell_Press',

  // ---- BACK ----
  pullup:    'Pullups',
  row:       'Bent_Over_Two-Dumbbell_Row',
  pulldown:  'Wide-Grip_Lat_Pulldown',
  tbar:      'T-Bar_Row_with_Handle',
  cabrow:    'Seated_Cable_Rows',
  shrug:     'Barbell_Shrug',

  // ---- BICEPS ----
  curlbb:    'Barbell_Curl',
  hammer:    'Hammer_Curls',
  preacher:  'Preacher_Curl',
  incdb:     'Incline_Dumbbell_Curl',

  // ---- TRICEPS ----
  tri:       'Triceps_Pushdown',
  skull:     'EZ-Bar_Skullcrusher',
  overtri:   'Overhead_Triceps_Extension',

  // ---- SHOULDERS ----
  ohp:       'Standing_Military_Press',
  dbpress:   'Seated_Dumbbell_Press',
  lat:       'Side_Lateral_Raise',
  rear:      'Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench',
  face:      'Face_Pull',
  arnold:    'Arnold_Dumbbell_Press',

  // ---- QUADS ----
  squat:     'Barbell_Squat',
  front:     'Front_Barbell_Squat',
  lunge:     'Dumbbell_Lunges',
  split:     'Bulgarian_Split_Squat',
  legpress:  'Leg_Press',
  box:       'Box_Jump_Up',

  // ---- HAMSTRINGS ----
  rdl:       'Romanian_Deadlift_from_Deficit',
  curl:      'Lying_Leg_Curls',
  gm:        'Good_Morning',

  // ---- GLUTES ----
  tbardl:    'Trap_Bar_Deadlift',
  thrust:    'Hip_Thrusts_-_With_Bands',
  gluteback: 'Glute_Kickback',

  // ---- CALVES ----
  calf:        'Standing_Calf_Raises',
  seatedcalf:  'Seated_Calf_Raise',

  // ---- CORE ----
  plank:    'Plank',
  hang:     'Hanging_Leg_Raise',
  pallof:   'Pallof_Press_With_Rotation',
  wood:     'Cable_Wood_Chops',
  abwheel:  'Ab_Roller',

  // ---- CARDIO (no GIF needed; the pickers don't show ExerciseGif for cardio) ----
};
