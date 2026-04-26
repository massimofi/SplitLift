// Fuzzy-match a mesh name (Latin / English) from the Z-Anatomy .glb to one of
// the 17 canonical muscle keys we use everywhere else in SplitLift.
//
// If the model uses different mesh names, extend this function rather than
// loosening the muscle list. The dev-mode mesh inventory log (see
// AnatomyModel.jsx) will print every unmapped mesh's actual name.

export function mapMeshNameToMuscle(name) {
  if (!name) return null;
  const n = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const has = (s) => n.indexOf(s) !== -1;

  // Order matters — more specific matches first.
  if (has('deltoid_posterior') || has('rear_delt') || has('posterior_deltoid')) return 'rear_delt';
  if (has('deltoid') || has('delt_clav') || has('delt_acrom')) return 'shoulder';
  if (has('pectoralis') || has('pec_major') || has('pec_min') || has('chest')) return 'chest';
  if (has('biceps_brachii') || has('biceps')) return 'biceps';
  if (has('triceps_brachii') || has('triceps')) return 'triceps';
  if (has('brachioradialis') || has('flexor_carpi') || has('extensor_carpi') || has('forearm')) return 'forearm';
  if (has('latissimus') || has('lats')) return 'lats';
  if (has('trapezius') || has('traps')) return 'traps';
  if (has('erector_spinae') || has('lower_back') || has('multifidus')) return 'lower_back';
  if (has('rectus_abdominis') || has('abdominis') || (has('abs') && !has('abscess'))) return 'abs';
  if (has('obliques') || has('oblique')) return 'obliques';
  if (has('gluteus') || has('glute')) return 'glutes';
  if (has('biceps_femoris') || has('semimembranosus') || has('semitendinosus') || has('hamstring') || has('hams')) return 'hams';
  if (has('quadriceps') || has('vastus') || has('rectus_femoris') || (has('quad') && !has('quadrate'))) return 'quads';
  if (has('gastrocnemius') || has('soleus') || has('calf') || has('calves')) return 'calves';
  if (has('iliopsoas') || has('hip_flex') || has('psoas')) return 'hip_flex';
  if (has('adductor')) return 'adductors';
  return null;
}
