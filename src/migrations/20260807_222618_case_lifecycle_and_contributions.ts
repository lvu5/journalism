import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_incidents_case_status" AS ENUM('newly-opened', 'investigating', 'accepting-contributions', 'reviewing-contributions', 'closed');
  CREATE TYPE "public"."enum__incidents_v_version_case_status" AS ENUM('newly-opened', 'investigating', 'accepting-contributions', 'reviewing-contributions', 'closed');
  CREATE TYPE "public"."enum_community_contributions_contribution_type" AS ENUM('document', 'eyewitness', 'data-tip', 'correction', 'context', 'other');
  CREATE TYPE "public"."enum_community_contributions_review_status" AS ENUM('received', 'screening', 'needs-info', 'approved', 'rejected');
  CREATE TYPE "public"."enum__community_contributions_v_version_contribution_type" AS ENUM('document', 'eyewitness', 'data-tip', 'correction', 'context', 'other');
  CREATE TYPE "public"."enum__community_contributions_v_version_review_status" AS ENUM('received', 'screening', 'needs-info', 'approved', 'rejected');
  CREATE TABLE "community_contributions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"incident_id" integer NOT NULL,
  	"contribution_type" "enum_community_contributions_contribution_type" DEFAULT 'data-tip' NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"source_url" varchar,
  	"contributor_name" varchar,
  	"contact_email" varchar NOT NULL,
  	"publish_name" boolean DEFAULT false,
  	"consent_to_review" boolean DEFAULT false NOT NULL,
  	"review_status" "enum_community_contributions_review_status" DEFAULT 'received' NOT NULL,
  	"publish_in_case" boolean DEFAULT false,
  	"reviewer_notes" varchar,
  	"reviewed_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_community_contributions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_incident_id" integer NOT NULL,
  	"version_contribution_type" "enum__community_contributions_v_version_contribution_type" DEFAULT 'data-tip' NOT NULL,
  	"version_title" varchar NOT NULL,
  	"version_description" varchar NOT NULL,
  	"version_source_url" varchar,
  	"version_contributor_name" varchar,
  	"version_contact_email" varchar NOT NULL,
  	"version_publish_name" boolean DEFAULT false,
  	"version_consent_to_review" boolean DEFAULT false NOT NULL,
  	"version_review_status" "enum__community_contributions_v_version_review_status" DEFAULT 'received' NOT NULL,
  	"version_publish_in_case" boolean DEFAULT false,
  	"version_reviewer_notes" varchar,
  	"version_reviewed_by_id" integer,
  	"version_approved_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "incidents" ADD COLUMN "case_status" "enum_incidents_case_status" DEFAULT 'newly-opened';
  ALTER TABLE "incidents" ADD COLUMN "crowdsourcing_enabled" boolean DEFAULT false;
  ALTER TABLE "_incidents_v" ADD COLUMN "version_case_status" "enum__incidents_v_version_case_status" DEFAULT 'newly-opened';
  ALTER TABLE "_incidents_v" ADD COLUMN "version_crowdsourcing_enabled" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_contributions_id" integer;
  ALTER TABLE "community_contributions" ADD CONSTRAINT "community_contributions_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_contributions" ADD CONSTRAINT "community_contributions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_contributions_v" ADD CONSTRAINT "_community_contributions_v_parent_id_community_contributions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_contributions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_contributions_v" ADD CONSTRAINT "_community_contributions_v_version_incident_id_incidents_id_fk" FOREIGN KEY ("version_incident_id") REFERENCES "public"."incidents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_contributions_v" ADD CONSTRAINT "_community_contributions_v_version_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "community_contributions_incident_idx" ON "community_contributions" USING btree ("incident_id");
  CREATE INDEX "community_contributions_review_status_idx" ON "community_contributions" USING btree ("review_status");
  CREATE INDEX "community_contributions_reviewed_by_idx" ON "community_contributions" USING btree ("reviewed_by_id");
  CREATE INDEX "community_contributions_updated_at_idx" ON "community_contributions" USING btree ("updated_at");
  CREATE INDEX "community_contributions_created_at_idx" ON "community_contributions" USING btree ("created_at");
  CREATE INDEX "_community_contributions_v_parent_idx" ON "_community_contributions_v" USING btree ("parent_id");
  CREATE INDEX "_community_contributions_v_version_version_incident_idx" ON "_community_contributions_v" USING btree ("version_incident_id");
  CREATE INDEX "_community_contributions_v_version_version_review_status_idx" ON "_community_contributions_v" USING btree ("version_review_status");
  CREATE INDEX "_community_contributions_v_version_version_reviewed_by_idx" ON "_community_contributions_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_community_contributions_v_version_version_updated_at_idx" ON "_community_contributions_v" USING btree ("version_updated_at");
  CREATE INDEX "_community_contributions_v_version_version_created_at_idx" ON "_community_contributions_v" USING btree ("version_created_at");
  CREATE INDEX "_community_contributions_v_created_at_idx" ON "_community_contributions_v" USING btree ("created_at");
  CREATE INDEX "_community_contributions_v_updated_at_idx" ON "_community_contributions_v" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_community_contributions_fk" FOREIGN KEY ("community_contributions_id") REFERENCES "public"."community_contributions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "incidents_case_status_idx" ON "incidents" USING btree ("case_status");
  CREATE INDEX "_incidents_v_version_version_case_status_idx" ON "_incidents_v" USING btree ("version_case_status");
  CREATE INDEX "payload_locked_documents_rels_community_contributions_id_idx" ON "payload_locked_documents_rels" USING btree ("community_contributions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_community_contributions_fk";
  DROP INDEX "payload_locked_documents_rels_community_contributions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "community_contributions_id";
  ALTER TABLE "community_contributions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_contributions_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "community_contributions" CASCADE;
  DROP TABLE "_community_contributions_v" CASCADE;
  DROP INDEX "incidents_case_status_idx";
  DROP INDEX "_incidents_v_version_version_case_status_idx";
  ALTER TABLE "incidents" DROP COLUMN "case_status";
  ALTER TABLE "incidents" DROP COLUMN "crowdsourcing_enabled";
  ALTER TABLE "_incidents_v" DROP COLUMN "version_case_status";
  ALTER TABLE "_incidents_v" DROP COLUMN "version_crowdsourcing_enabled";
  DROP TYPE "public"."enum_incidents_case_status";
  DROP TYPE "public"."enum__incidents_v_version_case_status";
  DROP TYPE "public"."enum_community_contributions_contribution_type";
  DROP TYPE "public"."enum_community_contributions_review_status";
  DROP TYPE "public"."enum__community_contributions_v_version_contribution_type";
  DROP TYPE "public"."enum__community_contributions_v_version_review_status";`)
}
