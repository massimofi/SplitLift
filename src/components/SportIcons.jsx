// Lucide-react icons mapped to each sport id from data/exercises.js SPORTS.
// Used by Onboarding step 0 + (later) the General-tab sport sheet.

import React from 'react';
import {
  Dumbbell, Bike, Mountain, Activity, Zap, Trophy, Volleyball,
  Footprints, Waves, Users, CircleDot, Award,
} from 'lucide-react';

const SIZE = 28;

const REGISTRY = {
  general:   Dumbbell,
  soccer:    CircleDot,    // best stand-in; lucide has no soccer ball
  bball:     Volleyball,   // closest fit; lucide has no basketball
  football:  Trophy,
  baseball:  Award,
  tennis:    CircleDot,
  volleyball:Volleyball,
  bjj:       Users,
  climb:     Mountain,
  run:       Footprints,
  cycling:   Bike,
  swimming:  Waves,
  powerlift: Dumbbell,
  crossfit:  Zap,
};

export function SportIcon({ id, size = SIZE, color = 'currentColor' }) {
  const Cmp = REGISTRY[id] || Activity;
  return <Cmp size={size} color={color} strokeWidth={2}/>;
}
