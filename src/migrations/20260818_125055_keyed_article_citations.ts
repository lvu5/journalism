import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles_citations" ADD COLUMN "citation_key" varchar;
  ALTER TABLE "_articles_v_version_citations" ADD COLUMN "citation_key" varchar;

  UPDATE "articles_citations"
  SET "citation_key" = 'source-' || ("_order" + 1)::text
  WHERE "citation_key" IS NULL;

  UPDATE "_articles_v_version_citations"
  SET "citation_key" = 'source-' || ("_order" + 1)::text
  WHERE "citation_key" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles_citations" DROP COLUMN "citation_key";
  ALTER TABLE "_articles_v_version_citations" DROP COLUMN "citation_key";`)
}
