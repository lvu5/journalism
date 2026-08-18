import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "supabase_user_id" varchar;
  ALTER TABLE "_users_v" ADD COLUMN "version_supabase_user_id" varchar;
  CREATE UNIQUE INDEX "users_supabase_user_id_idx" ON "users" USING btree ("supabase_user_id");
  CREATE INDEX "_users_v_version_version_supabase_user_id_idx" ON "_users_v" USING btree ("version_supabase_user_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_supabase_user_id_idx";
  DROP INDEX "_users_v_version_version_supabase_user_id_idx";
  ALTER TABLE "users" DROP COLUMN "supabase_user_id";
  ALTER TABLE "_users_v" DROP COLUMN "version_supabase_user_id";`)
}
