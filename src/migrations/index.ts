import * as migration_20260807_213321_initial_journalism_schema from './20260807_213321_initial_journalism_schema'
import * as migration_20260807_222618_case_lifecycle_and_contributions from './20260807_222618_case_lifecycle_and_contributions'

export const migrations = [
  {
    up: migration_20260807_213321_initial_journalism_schema.up,
    down: migration_20260807_213321_initial_journalism_schema.down,
    name: '20260807_213321_initial_journalism_schema',
  },
  {
    up: migration_20260807_222618_case_lifecycle_and_contributions.up,
    down: migration_20260807_222618_case_lifecycle_and_contributions.down,
    name: '20260807_222618_case_lifecycle_and_contributions',
  },
];
