// Map SplitLift exercise IDs to slugs from yuhonas/free-exercise-db.
// URL pattern: ${BASE}/${slug}/${frame}.jpg  (no /images/ subfolder)
// Each slug folder contains 0.jpg and 1.jpg that ExerciseGif alternates.
//
// Source: https://github.com/yuhonas/free-exercise-db (public domain)
//
// Every slug listed here was verified against the GitHub raw URL (HTTP 200).
// Exercises without an entry get a dumbbell-glyph placeholder — that's the
// intended fallback, no broken image icons. Add new mappings as we extend
// EXERCISES.

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
  box:       'Lateral_Box_Jump',

  // ---- HAMSTRINGS ----
  rdl:       'Romanian_Deadlift_from_Deficit',
  curl:      'Lying_Leg_Curls',
  gm:        'Good_Morning',

  // ---- GLUTES ----
  tbardl:    'Trap_Bar_Deadlift',
  thrust:    'Hip_Lift_with_Band',
  gluteback: 'Glute_Kickback',

  // ---- CALVES ----
  calf:        'Standing_Calf_Raises',
  seatedcalf:  'Seated_Calf_Raise',
  // donkey: no clean slug in the dataset → placeholder

  // ---- CORE ----
  plank:    'Plank',
  hang:     'Hanging_Leg_Raise',
  pallof:   'Pallof_Press_With_Rotation',
  wood:     'Standing_Cable_Wood_Chop',
  abwheel:  'Ab_Roller',

  // ---- FOREARMS (added in v3) ----
  wristcurl:  'Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench',
  rwristcurl: 'Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench',
  farmer:     'Farmers_Walk',
  pinch:      'Plate_Pinch',

  // ---- ADDUCTORS (added in v3) ----
  addmach: 'Cable_Hip_Adduction',
  sumosq:  'Sumo_Deadlift',     // closest verified match
  copen:   'Side_Bridge',       // closest verified match

  // ---- ABDUCTORS (added in v3) ----
  abdmach:   'Standing_Hip_Circles',
  sidelyleg: 'Lateral_Cone_Hops',
  bandlat:   'Lateral_Raise_-_With_Bands',

  // ---- NECK (added in v3) ----
  // Dataset only has a single neck slug; all 4 variants share it for now.
  neckflex:  'Neck-SMR',
  neckext:   'Neck-SMR',
  neckraise: 'Neck-SMR',
  chintuck:  'Neck-SMR',

  // CARDIO has no GIF — pickers don't render ExerciseGif for cardio types.
};
