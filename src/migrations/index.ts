import * as migration_20260807_213321_initial_journalism_schema from './20260807_213321_initial_journalism_schema'
import * as migration_20260807_222618_case_lifecycle_and_contributions from './20260807_222618_case_lifecycle_and_contributions'
import * as migration_20260810_110000_fix_relationship_delete_rules from './20260810_110000_fix_relationship_delete_rules'
import * as migration_20260810_124622_article_corrections from './20260810_124622_article_corrections'
import * as migration_20260810_135605_audit_logs_and_field_crypto from './20260810_135605_audit_logs_and_field_crypto'
import * as migration_20260815_150657_add_supabase_author_identity from './20260815_150657_add_supabase_author_identity'
import * as migration_20260816_084007_add_cloud_media_prefix from './20260816_084007_add_cloud_media_prefix'
import * as migration_20260818_125055_keyed_article_citations from './20260818_125055_keyed_article_citations'

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
    up: migration_20260810_124622_article_corrections.up,
    down: migration_20260810_124622_article_corrections.down,
    name: '20260810_124622_article_corrections',
  },
  {
    up: migration_20260810_135605_audit_logs_and_field_crypto.up,
    down: migration_20260810_135605_audit_logs_and_field_crypto.down,
    name: '20260810_135605_audit_logs_and_field_crypto',
  },
  {
    up: migration_20260815_150657_add_supabase_author_identity.up,
    down: migration_20260815_150657_add_supabase_author_identity.down,
    name: '20260815_150657_add_supabase_author_identity',
  },
  {
    up: migration_20260816_084007_add_cloud_media_prefix.up,
    down: migration_20260816_084007_add_cloud_media_prefix.down,
    name: '20260816_084007_add_cloud_media_prefix',
  },
  {
    up: migration_20260818_125055_keyed_article_citations.up,
    down: migration_20260818_125055_keyed_article_citations.down,
    name: '20260818_125055_keyed_article_citations',
  },
]
