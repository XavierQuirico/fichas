CREATE TABLE "card_fonts" (
	"owner_id" text NOT NULL,
	"card_id" text NOT NULL,
	"font" text DEFAULT 'sans' NOT NULL,
	CONSTRAINT "card_fonts_owner_id_card_id_pk" PRIMARY KEY("owner_id","card_id"),
	CONSTRAINT "card_fonts_font_check" CHECK ("card_fonts"."font" IN ('sans','serif','hand','mono'))
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text NOT NULL,
	"owner_id" text NOT NULL,
	"deck_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"color" text NOT NULL,
	"style" text NOT NULL,
	"size" integer NOT NULL,
	"background_color" text,
	"position" integer NOT NULL,
	CONSTRAINT "cards_owner_id_id_pk" PRIMARY KEY("owner_id","id"),
	CONSTRAINT "cards_color_check" CHECK ("cards"."color" IN ('lemon','peach','blue','mint','lilac','white')),
	CONSTRAINT "cards_style_check" CHECK ("cards"."style" IN ('sticky','lined','clean','grid')),
	CONSTRAINT "cards_size_check" CHECK ("cards"."size" BETWEEN 18 AND 42),
	CONSTRAINT "cards_position_check" CHECK ("cards"."position" >= 0),
	CONSTRAINT "cards_background_color_check" CHECK ("cards"."background_color" IS NULL OR "cards"."background_color" IN ('default','blue-mist','lilac-mist','ink','orange','red'))
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" text NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "decks_owner_id_id_pk" PRIMARY KEY("owner_id","id"),
	CONSTRAINT "decks_title_length_check" CHECK (char_length("decks"."title") BETWEEN 1 AND 160),
	CONSTRAINT "decks_position_check" CHECK ("decks"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_fonts" ADD CONSTRAINT "card_fonts_owner_card_fk" FOREIGN KEY ("owner_id","card_id") REFERENCES "public"."cards"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_owner_deck_fk" FOREIGN KEY ("owner_id","deck_id") REFERENCES "public"."decks"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cards_owner_deck_position_idx" ON "cards" USING btree ("owner_id","deck_id","position");--> statement-breakpoint
CREATE INDEX "decks_owner_position_idx" ON "decks" USING btree ("owner_id","position");