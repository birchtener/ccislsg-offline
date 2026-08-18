-- CreateIndex
CREATE INDEX "attendance_event_id_idx" ON "attendance"("event_id");

-- CreateIndex
CREATE INDEX "attendance_student_id_idx" ON "attendance"("student_id");

-- CreateIndex
CREATE INDEX "attendance_time_idx" ON "attendance"("time");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_category_idx" ON "audit_logs"("category");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "inventory_assets_item_id_idx" ON "inventory_assets"("item_id");

-- CreateIndex
CREATE INDEX "inventory_assets_status_idx" ON "inventory_assets"("status");

-- CreateIndex
CREATE INDEX "inventory_borrows_item_id_idx" ON "inventory_borrows"("item_id");

-- CreateIndex
CREATE INDEX "inventory_borrows_student_id_idx" ON "inventory_borrows"("student_id");

-- CreateIndex
CREATE INDEX "inventory_borrows_borrowed_by_idx" ON "inventory_borrows"("borrowed_by");

-- CreateIndex
CREATE INDEX "inventory_borrows_returned_at_idx" ON "inventory_borrows"("returned_at");

-- CreateIndex
CREATE INDEX "inventory_borrows_borrowed_at_idx" ON "inventory_borrows"("borrowed_at");

-- CreateIndex
CREATE INDEX "inventory_items_category_id_idx" ON "inventory_items"("category_id");

-- CreateIndex
CREATE INDEX "inventory_items_type_idx" ON "inventory_items"("type");

-- CreateIndex
CREATE INDEX "inventory_items_created_at_idx" ON "inventory_items"("created_at");

-- CreateIndex
CREATE INDEX "students_last_name_idx" ON "students"("last_name");

-- CreateIndex
CREATE INDEX "students_program_idx" ON "students"("program");

-- CreateIndex
CREATE INDEX "students_year_idx" ON "students"("year");

-- CreateIndex
CREATE INDEX "transaction_items_transaction_id_idx" ON "transaction_items"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_items_item_id_idx" ON "transaction_items"("item_id");
