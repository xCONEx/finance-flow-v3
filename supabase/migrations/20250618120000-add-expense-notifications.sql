
-- Add new columns to expenses table for cost notifications and recurring/installment features
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installments INTEGER,
ADD COLUMN IF NOT EXISTS current_installment INTEGER,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT TRUE;

-- Create cost_notifications table
CREATE TABLE IF NOT EXISTS cost_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cost_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    due_date DATE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for cost_notifications
ALTER TABLE cost_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON cost_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
    ON cost_notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON cost_notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON cost_notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically create notifications for expenses with due dates
CREATE OR REPLACE FUNCTION create_expense_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notifications if the expense has a due date and notifications are enabled
    IF NEW.due_date IS NOT NULL AND NEW.notification_enabled = TRUE THEN
        -- Create notification for 3 days before due date
        INSERT INTO cost_notifications (user_id, cost_id, title, message, due_date)
        VALUES (
            NEW.user_id,
            NEW.id,
            'Vencimento em 3 dias',
            NEW.description || ' vence em ' || TO_CHAR(NEW.due_date, 'DD/MM/YYYY'),
            NEW.due_date - INTERVAL '3 days'
        );
        
        -- Create notification for due date
        INSERT INTO cost_notifications (user_id, cost_id, title, message, due_date)
        VALUES (
            NEW.user_id,
            NEW.id,
            'Vencimento hoje',
            NEW.description || ' vence hoje!',
            NEW.due_date
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expense notifications
DROP TRIGGER IF EXISTS expense_notifications_trigger ON expenses;
CREATE TRIGGER expense_notifications_trigger
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION create_expense_notifications();

-- Create function to handle recurring expenses
CREATE OR REPLACE FUNCTION create_recurring_expenses()
RETURNS void AS $$
DECLARE
    expense_record RECORD;
    next_month DATE;
    next_due_date DATE;
BEGIN
    -- Process all recurring expenses
    FOR expense_record IN 
        SELECT * FROM expenses 
        WHERE is_recurring = TRUE 
        AND parent_id IS NULL -- Only process original expenses, not generated ones
    LOOP
        -- Calculate next month
        next_month := DATE_TRUNC('month', DATE (expense_record.month || '-01')) + INTERVAL '1 month';
        
        -- Calculate next due date if original has due date
        IF expense_record.due_date IS NOT NULL THEN
            next_due_date := next_month + (expense_record.due_date - DATE(expense_record.month || '-01'));
        ELSE
            next_due_date := NULL;
        END IF;
        
        -- Check if next month's expense doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM expenses 
            WHERE parent_id = expense_record.id 
            AND month = TO_CHAR(next_month, 'YYYY-MM')
        ) THEN
            -- Create next month's expense
            INSERT INTO expenses (
                user_id, description, category, value, month, 
                due_date, is_recurring, notification_enabled, parent_id
            ) VALUES (
                expense_record.user_id,
                expense_record.description,
                expense_record.category,
                expense_record.value,
                TO_CHAR(next_month, 'YYYY-MM'),
                next_due_date,
                FALSE, -- Generated expenses are not recurring themselves
                expense_record.notification_enabled,
                expense_record.id
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_expenses_parent_id ON expenses(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cost_notifications_user_unread ON cost_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_cost_notifications_due_date ON cost_notifications(due_date);

-- Add updated_at trigger for cost_notifications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cost_notifications_updated_at ON cost_notifications;
CREATE TRIGGER update_cost_notifications_updated_at
    BEFORE UPDATE ON cost_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
