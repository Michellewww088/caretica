-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'trialing',
    "trial_start_date" DATETIME,
    "trial_end_date" DATETIME,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "subscription_expiry" DATETIME,
    "is_premium" BOOLEAN NOT NULL DEFAULT true,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_pregnant" BOOLEAN NOT NULL DEFAULT false,
    "due_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "babies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "birthdate" DATETIME NOT NULL,
    "gender" TEXT,
    "blood_type" TEXT,
    "baby_type" TEXT NOT NULL DEFAULT 'normal',
    "weeks_premature" INTEGER NOT NULL DEFAULT 0,
    "photo_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "babies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_tips" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "baby_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_tips_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "growth_summaries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "baby_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_summaries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "baby_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "datetime" DATETIME NOT NULL,
    "repeat_frequency" TEXT NOT NULL DEFAULT 'once',
    "notification_method" TEXT NOT NULL DEFAULT 'in-app',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reminders_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "growth_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "baby_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "logged_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_logs_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "baby_id" INTEGER NOT NULL,
    "record_type" TEXT,
    "vaccine_name" TEXT,
    "date" DATETIME,
    "weight" REAL,
    "height" REAL,
    "doctor_notes" TEXT,
    "ai_summary" TEXT,
    "file_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medical_records_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "daily_tips_baby_id_date_key" ON "daily_tips"("baby_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "growth_summaries_baby_id_date_key" ON "growth_summaries"("baby_id", "date");
