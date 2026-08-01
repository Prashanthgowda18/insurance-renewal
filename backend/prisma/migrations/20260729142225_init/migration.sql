-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "alt_mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "preferred_notification_channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "customer_status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "manufacturing_year" INTEGER,
    "fuel_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicle_id" TEXT NOT NULL,
    "insurance_company" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "insurance_type" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "renewal_status" TEXT NOT NULL DEFAULT 'pending',
    "policy_document_url" TEXT,
    "renewal_amount" DECIMAL NOT NULL,
    "last_reminder_date" DATETIME,
    "next_reminder_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "insurance_policies_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "renewals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policy_id" TEXT NOT NULL,
    "renewal_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "new_expiry_date" DATETIME NOT NULL,
    "renewed_by" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "renewals_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminder_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policy_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "scheduled_date" DATETIME NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reminder_schedules_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_histories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reminder_id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "delivery_result" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 1,
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_histories_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "reminder_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admin_id" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_mobile_key" ON "customers"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_mobile_idx" ON "customers"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_number_idx" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_policy_number_key" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE INDEX "insurance_policies_expiry_date_idx" ON "insurance_policies"("expiry_date");

-- CreateIndex
CREATE INDEX "insurance_policies_policy_number_idx" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE INDEX "insurance_policies_renewal_status_idx" ON "insurance_policies"("renewal_status");

-- CreateIndex
CREATE INDEX "reminder_schedules_scheduled_date_sent_idx" ON "reminder_schedules"("scheduled_date", "sent");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
