import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'reviewer', 'author');
  CREATE TYPE "public"."enum__users_v_version_roles" AS ENUM('admin', 'reviewer', 'author');
  CREATE TYPE "public"."enum_articles_topics" AS ENUM('public-spending', 'environment', 'justice', 'labour', 'land', 'public-services');
  CREATE TYPE "public"."enum_articles_workflow_status" AS ENUM('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'published', 'rejected');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_topics" AS ENUM('public-spending', 'environment', 'justice', 'labour', 'land', 'public-services');
  CREATE TYPE "public"."enum__articles_v_version_workflow_status" AS ENUM('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'published', 'rejected');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_incidents_verification_status" AS ENUM('under-review', 'disputed', 'confirmed', 'resolved');
  CREATE TYPE "public"."enum_incidents_severity" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_incidents_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__incidents_v_version_verification_status" AS ENUM('under-review', 'disputed', 'confirmed', 'resolved');
  CREATE TYPE "public"."enum__incidents_v_version_severity" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum__incidents_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_reviews_decision" AS ENUM('approve', 'changes_requested', 'reject');
  CREATE TYPE "public"."enum__reviews_v_version_decision" AS ENUM('approve', 'changes_requested', 'reject');
  CREATE TYPE "public"."enum_media_visibility" AS ENUM('private', 'public');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"public_name" varchar NOT NULL,
  	"bio" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "_users_v_version_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__users_v_version_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_users_v_version_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "_users_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_public_name" varchar NOT NULL,
  	"version_bio" varchar,
  	"version_active" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_email" varchar NOT NULL,
  	"version_reset_password_token" varchar,
  	"version_reset_password_expiration" timestamp(3) with time zone,
  	"version_salt" varchar,
  	"version_hash" varchar,
  	"version_login_attempts" numeric DEFAULT 0,
  	"version_lock_until" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "articles_byline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "articles_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_title" varchar,
  	"publisher" varchar,
  	"url" varchar,
  	"accessed_at" timestamp(3) with time zone,
  	"archive_url" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "articles_topics" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_articles_topics",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"event_date" timestamp(3) with time zone,
  	"summary" varchar,
  	"body_markdown" varchar,
  	"workflow_status" "enum_articles_workflow_status" DEFAULT 'draft',
  	"submitted_by_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"incidents_id" integer
  );
  
  CREATE TABLE "_articles_v_version_byline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_title" varchar,
  	"publisher" varchar,
  	"url" varchar,
  	"accessed_at" timestamp(3) with time zone,
  	"archive_url" varchar,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_topics" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__articles_v_version_topics",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_event_date" timestamp(3) with time zone,
  	"version_summary" varchar,
  	"version_body_markdown" varchar,
  	"version_workflow_status" "enum__articles_v_version_workflow_status" DEFAULT 'draft',
  	"version_submitted_by_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"incidents_id" integer
  );
  
  CREATE TABLE "incidents_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_title" varchar,
  	"url" varchar,
  	"archive_url" varchar,
  	"accessed_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "incidents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"date_start" timestamp(3) with time zone,
  	"date_end" timestamp(3) with time zone,
  	"summary" varchar,
  	"notability_reason" varchar,
  	"location" varchar,
  	"verification_status" "enum_incidents_verification_status" DEFAULT 'under-review',
  	"severity" "enum_incidents_severity" DEFAULT 'medium',
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_incidents_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "incidents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer
  );
  
  CREATE TABLE "_incidents_v_version_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_title" varchar,
  	"url" varchar,
  	"archive_url" varchar,
  	"accessed_at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_incidents_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_date_start" timestamp(3) with time zone,
  	"version_date_end" timestamp(3) with time zone,
  	"version_summary" varchar,
  	"version_notability_reason" varchar,
  	"version_location" varchar,
  	"version_verification_status" "enum__incidents_v_version_verification_status" DEFAULT 'under-review',
  	"version_severity" "enum__incidents_v_version_severity" DEFAULT 'medium',
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__incidents_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_incidents_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"article_id" integer NOT NULL,
  	"decision" "enum_reviews_decision" NOT NULL,
  	"comments" varchar NOT NULL,
  	"reviewer_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_reviews_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_article_id" integer NOT NULL,
  	"version_decision" "enum__reviews_v_version_decision" NOT NULL,
  	"version_comments" varchar NOT NULL,
  	"version_reviewer_id" integer NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"visibility" "enum_media_visibility" DEFAULT 'private' NOT NULL,
  	"uploaded_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"articles_id" integer,
  	"incidents_id" integer,
  	"reviews_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_version_roles" ADD CONSTRAINT "_users_v_version_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_version_sessions" ADD CONSTRAINT "_users_v_version_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v" ADD CONSTRAINT "_users_v_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_byline" ADD CONSTRAINT "articles_byline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_citations" ADD CONSTRAINT "articles_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_topics" ADD CONSTRAINT "articles_topics_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_incidents_fk" FOREIGN KEY ("incidents_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_byline" ADD CONSTRAINT "_articles_v_version_byline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_citations" ADD CONSTRAINT "_articles_v_version_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_topics" ADD CONSTRAINT "_articles_v_version_topics_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_incidents_fk" FOREIGN KEY ("incidents_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "incidents_citations" ADD CONSTRAINT "incidents_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "incidents_rels" ADD CONSTRAINT "incidents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "incidents_rels" ADD CONSTRAINT "incidents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_incidents_v_version_citations" ADD CONSTRAINT "_incidents_v_version_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_incidents_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_incidents_v" ADD CONSTRAINT "_incidents_v_parent_id_incidents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."incidents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_incidents_v_rels" ADD CONSTRAINT "_incidents_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_incidents_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_incidents_v_rels" ADD CONSTRAINT "_incidents_v_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_parent_id_reviews_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_article_id_articles_id_fk" FOREIGN KEY ("version_article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_reviewer_id_users_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_incidents_fk" FOREIGN KEY ("incidents_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "_users_v_version_roles_order_idx" ON "_users_v_version_roles" USING btree ("order");
  CREATE INDEX "_users_v_version_roles_parent_idx" ON "_users_v_version_roles" USING btree ("parent_id");
  CREATE INDEX "_users_v_version_sessions_order_idx" ON "_users_v_version_sessions" USING btree ("_order");
  CREATE INDEX "_users_v_version_sessions_parent_id_idx" ON "_users_v_version_sessions" USING btree ("_parent_id");
  CREATE INDEX "_users_v_parent_idx" ON "_users_v" USING btree ("parent_id");
  CREATE INDEX "_users_v_version_version_updated_at_idx" ON "_users_v" USING btree ("version_updated_at");
  CREATE INDEX "_users_v_version_version_created_at_idx" ON "_users_v" USING btree ("version_created_at");
  CREATE INDEX "_users_v_version_version_email_idx" ON "_users_v" USING btree ("version_email");
  CREATE INDEX "_users_v_created_at_idx" ON "_users_v" USING btree ("created_at");
  CREATE INDEX "_users_v_updated_at_idx" ON "_users_v" USING btree ("updated_at");
  CREATE INDEX "articles_byline_order_idx" ON "articles_byline" USING btree ("_order");
  CREATE INDEX "articles_byline_parent_id_idx" ON "articles_byline" USING btree ("_parent_id");
  CREATE INDEX "articles_citations_order_idx" ON "articles_citations" USING btree ("_order");
  CREATE INDEX "articles_citations_parent_id_idx" ON "articles_citations" USING btree ("_parent_id");
  CREATE INDEX "articles_topics_order_idx" ON "articles_topics" USING btree ("order");
  CREATE INDEX "articles_topics_parent_idx" ON "articles_topics" USING btree ("parent_id");
  CREATE INDEX "articles_title_idx" ON "articles" USING btree ("title");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_event_date_idx" ON "articles" USING btree ("event_date");
  CREATE INDEX "articles_workflow_status_idx" ON "articles" USING btree ("workflow_status");
  CREATE INDEX "articles_submitted_by_idx" ON "articles" USING btree ("submitted_by_id");
  CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_users_id_idx" ON "articles_rels" USING btree ("users_id");
  CREATE INDEX "articles_rels_incidents_id_idx" ON "articles_rels" USING btree ("incidents_id");
  CREATE INDEX "_articles_v_version_byline_order_idx" ON "_articles_v_version_byline" USING btree ("_order");
  CREATE INDEX "_articles_v_version_byline_parent_id_idx" ON "_articles_v_version_byline" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_citations_order_idx" ON "_articles_v_version_citations" USING btree ("_order");
  CREATE INDEX "_articles_v_version_citations_parent_id_idx" ON "_articles_v_version_citations" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_topics_order_idx" ON "_articles_v_version_topics" USING btree ("order");
  CREATE INDEX "_articles_v_version_topics_parent_idx" ON "_articles_v_version_topics" USING btree ("parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_title_idx" ON "_articles_v" USING btree ("version_title");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_event_date_idx" ON "_articles_v" USING btree ("version_event_date");
  CREATE INDEX "_articles_v_version_version_workflow_status_idx" ON "_articles_v" USING btree ("version_workflow_status");
  CREATE INDEX "_articles_v_version_version_submitted_by_idx" ON "_articles_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_articles_v_version_version_published_at_idx" ON "_articles_v" USING btree ("version_published_at");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_users_id_idx" ON "_articles_v_rels" USING btree ("users_id");
  CREATE INDEX "_articles_v_rels_incidents_id_idx" ON "_articles_v_rels" USING btree ("incidents_id");
  CREATE INDEX "incidents_citations_order_idx" ON "incidents_citations" USING btree ("_order");
  CREATE INDEX "incidents_citations_parent_id_idx" ON "incidents_citations" USING btree ("_parent_id");
  CREATE INDEX "incidents_title_idx" ON "incidents" USING btree ("title");
  CREATE UNIQUE INDEX "incidents_slug_idx" ON "incidents" USING btree ("slug");
  CREATE INDEX "incidents_date_start_idx" ON "incidents" USING btree ("date_start");
  CREATE INDEX "incidents_location_idx" ON "incidents" USING btree ("location");
  CREATE INDEX "incidents_verification_status_idx" ON "incidents" USING btree ("verification_status");
  CREATE INDEX "incidents_updated_at_idx" ON "incidents" USING btree ("updated_at");
  CREATE INDEX "incidents_created_at_idx" ON "incidents" USING btree ("created_at");
  CREATE INDEX "incidents__status_idx" ON "incidents" USING btree ("_status");
  CREATE INDEX "incidents_rels_order_idx" ON "incidents_rels" USING btree ("order");
  CREATE INDEX "incidents_rels_parent_idx" ON "incidents_rels" USING btree ("parent_id");
  CREATE INDEX "incidents_rels_path_idx" ON "incidents_rels" USING btree ("path");
  CREATE INDEX "incidents_rels_articles_id_idx" ON "incidents_rels" USING btree ("articles_id");
  CREATE INDEX "_incidents_v_version_citations_order_idx" ON "_incidents_v_version_citations" USING btree ("_order");
  CREATE INDEX "_incidents_v_version_citations_parent_id_idx" ON "_incidents_v_version_citations" USING btree ("_parent_id");
  CREATE INDEX "_incidents_v_parent_idx" ON "_incidents_v" USING btree ("parent_id");
  CREATE INDEX "_incidents_v_version_version_title_idx" ON "_incidents_v" USING btree ("version_title");
  CREATE INDEX "_incidents_v_version_version_slug_idx" ON "_incidents_v" USING btree ("version_slug");
  CREATE INDEX "_incidents_v_version_version_date_start_idx" ON "_incidents_v" USING btree ("version_date_start");
  CREATE INDEX "_incidents_v_version_version_location_idx" ON "_incidents_v" USING btree ("version_location");
  CREATE INDEX "_incidents_v_version_version_verification_status_idx" ON "_incidents_v" USING btree ("version_verification_status");
  CREATE INDEX "_incidents_v_version_version_updated_at_idx" ON "_incidents_v" USING btree ("version_updated_at");
  CREATE INDEX "_incidents_v_version_version_created_at_idx" ON "_incidents_v" USING btree ("version_created_at");
  CREATE INDEX "_incidents_v_version_version__status_idx" ON "_incidents_v" USING btree ("version__status");
  CREATE INDEX "_incidents_v_created_at_idx" ON "_incidents_v" USING btree ("created_at");
  CREATE INDEX "_incidents_v_updated_at_idx" ON "_incidents_v" USING btree ("updated_at");
  CREATE INDEX "_incidents_v_latest_idx" ON "_incidents_v" USING btree ("latest");
  CREATE INDEX "_incidents_v_autosave_idx" ON "_incidents_v" USING btree ("autosave");
  CREATE INDEX "_incidents_v_rels_order_idx" ON "_incidents_v_rels" USING btree ("order");
  CREATE INDEX "_incidents_v_rels_parent_idx" ON "_incidents_v_rels" USING btree ("parent_id");
  CREATE INDEX "_incidents_v_rels_path_idx" ON "_incidents_v_rels" USING btree ("path");
  CREATE INDEX "_incidents_v_rels_articles_id_idx" ON "_incidents_v_rels" USING btree ("articles_id");
  CREATE INDEX "reviews_article_idx" ON "reviews" USING btree ("article_id");
  CREATE INDEX "reviews_reviewer_idx" ON "reviews" USING btree ("reviewer_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "_reviews_v_parent_idx" ON "_reviews_v" USING btree ("parent_id");
  CREATE INDEX "_reviews_v_version_version_article_idx" ON "_reviews_v" USING btree ("version_article_id");
  CREATE INDEX "_reviews_v_version_version_reviewer_idx" ON "_reviews_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_reviews_v_version_version_updated_at_idx" ON "_reviews_v" USING btree ("version_updated_at");
  CREATE INDEX "_reviews_v_version_version_created_at_idx" ON "_reviews_v" USING btree ("version_created_at");
  CREATE INDEX "_reviews_v_created_at_idx" ON "_reviews_v" USING btree ("created_at");
  CREATE INDEX "_reviews_v_updated_at_idx" ON "_reviews_v" USING btree ("updated_at");
  CREATE INDEX "media_uploaded_by_idx" ON "media" USING btree ("uploaded_by_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_incidents_id_idx" ON "payload_locked_documents_rels" USING btree ("incidents_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "_users_v_version_roles" CASCADE;
  DROP TABLE "_users_v_version_sessions" CASCADE;
  DROP TABLE "_users_v" CASCADE;
  DROP TABLE "articles_byline" CASCADE;
  DROP TABLE "articles_citations" CASCADE;
  DROP TABLE "articles_topics" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_version_byline" CASCADE;
  DROP TABLE "_articles_v_version_citations" CASCADE;
  DROP TABLE "_articles_v_version_topics" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "incidents_citations" CASCADE;
  DROP TABLE "incidents" CASCADE;
  DROP TABLE "incidents_rels" CASCADE;
  DROP TABLE "_incidents_v_version_citations" CASCADE;
  DROP TABLE "_incidents_v" CASCADE;
  DROP TABLE "_incidents_v_rels" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "_reviews_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum__users_v_version_roles";
  DROP TYPE "public"."enum_articles_topics";
  DROP TYPE "public"."enum_articles_workflow_status";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_topics";
  DROP TYPE "public"."enum__articles_v_version_workflow_status";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_incidents_verification_status";
  DROP TYPE "public"."enum_incidents_severity";
  DROP TYPE "public"."enum_incidents_status";
  DROP TYPE "public"."enum__incidents_v_version_verification_status";
  DROP TYPE "public"."enum__incidents_v_version_severity";
  DROP TYPE "public"."enum__incidents_v_version_status";
  DROP TYPE "public"."enum_reviews_decision";
  DROP TYPE "public"."enum__reviews_v_version_decision";
  DROP TYPE "public"."enum_media_visibility";`)
}
