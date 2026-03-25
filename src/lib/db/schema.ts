import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").unique().notNull(),
  url: text("url").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const clicks = sqliteTable("clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  linkId: integer("link_id")
    .notNull()
    .references(() => links.id),
  clickedAt: text("clicked_at").default(sql`(datetime('now'))`),
  referer: text("referer"),
  country: text("country"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
});
