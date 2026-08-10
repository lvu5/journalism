import * as migration_20260807_213321_initial_journalism_schema from './20260807_213321_initial_journalism_schema'
import * as migration_20260807_222618_case_lifecycle_and_contributions from './20260807_222618_case_lifecycle_and_contributions'
import * as migration_20260810_110000_fix_relationship_delete_rules from './20260810_110000_fix_relationship_delete_rules'
import * as migration_20260810_135605_audit_logs_and_field_crypto from './20260810_135605_audit_logs_and_field_crypto'

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
  {
    up: migration_20260810_110000_fix_relationship_delete_rules.up,
    down: migration_20260810_110000_fix_relationship_delete_rules.down,
    name: '20260810_110000_fix_relationship_delete_rules',
  },
  {
    up: migration_20260810_135605_audit_logs_and_field_crypto.up,
    down: migration_20260810_135605_audit_logs_and_field_crypto.down,
    name: '20260810_135605_audit_logs_and_field_crypto',
  },
];
