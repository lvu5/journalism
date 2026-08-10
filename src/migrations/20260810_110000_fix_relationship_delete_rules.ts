import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The generated schema declared NOT NULL relationship columns with
// ON DELETE SET NULL foreign keys — Postgres rejects that combination at
// runtime, so deleting an article/user/incident with children failed with an
// integrity error. This migration replaces those constraints with deliberate
// rules:
//   - reviews are editorial records of an article: CASCADE with the article
//   - reviewers and contribution evidence are never dropped silently: RESTRICT
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "reviews" DROP CONSTRAINT "reviews_article_id_articles_id_fk";
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" DROP CONSTRAINT "reviews_reviewer_id_users_id_fk";
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "_reviews_v" DROP CONSTRAINT "_reviews_v_version_article_id_articles_id_fk";
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_article_id_articles_id_fk" FOREIGN KEY ("version_article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reviews_v" DROP CONSTRAINT "_reviews_v_version_reviewer_id_users_id_fk";
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_reviewer_id_users_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "community_contributions" DROP CONSTRAINT "community_contributions_incident_id_incidents_id_fk";
  ALTER TABLE "community_contributions" ADD CONSTRAINT "community_contributions_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "_community_contributions_v" DROP CONSTRAINT "_community_contributions_v_version_incident_id_incidents_id_fk";
  ALTER TABLE "_community_contributions_v" ADD CONSTRAINT "_community_contributions_v_version_incident_id_incidents_id_fk" FOREIGN KEY ("version_incident_id") REFERENCES "public"."incidents"("id") ON DELETE restrict ON UPDATE no action;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "reviews" DROP CONSTRAINT "reviews_article_id_articles_id_fk";
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" DROP CONSTRAINT "reviews_reviewer_id_users_id_fk";
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" DROP CONSTRAINT "_reviews_v_version_article_id_articles_id_fk";
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_article_id_articles_id_fk" FOREIGN KEY ("version_article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" DROP CONSTRAINT "_reviews_v_version_reviewer_id_users_id_fk";
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_reviewer_id_users_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_contributions" DROP CONSTRAINT "community_contributions_incident_id_incidents_id_fk";
  ALTER TABLE "community_contributions" ADD CONSTRAINT "community_contributions_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_contributions_v" DROP CONSTRAINT "_community_contributions_v_version_incident_id_incidents_id_fk";
  ALTER TABLE "_community_contributions_v" ADD CONSTRAINT "_community_contributions_v_version_incident_id_incidents_id_fk" FOREIGN KEY ("version_incident_id") REFERENCES "public"."incidents"("id") ON DELETE set null ON UPDATE no action;
  `)
}
