import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "articles_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"issued_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_articles_v_version_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"issued_at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  ALTER TABLE "articles_corrections" ADD CONSTRAINT "articles_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_corrections" ADD CONSTRAINT "_articles_v_version_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_corrections_order_idx" ON "articles_corrections" USING btree ("_order");
  CREATE INDEX "articles_corrections_parent_id_idx" ON "articles_corrections" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_corrections_order_idx" ON "_articles_v_version_corrections" USING btree ("_order");
  CREATE INDEX "_articles_v_version_corrections_parent_id_idx" ON "_articles_v_version_corrections" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles_corrections" CASCADE;
  DROP TABLE "_articles_v_version_corrections" CASCADE;`)
}
