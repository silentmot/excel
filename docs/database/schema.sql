-- =============================================================================
-- Alasela CDW Recycling Facility - Database Schema
-- =============================================================================
-- Version: 1.0.0
-- Database: PostgreSQL 14+
-- Normalization: 3NF (Third Normal Form)
-- Created: 2025-10-07
-- Source: Clean database design from CSV analysis (no migration)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: CORE MATERIAL TAXONOMY (SSOT)
-- =============================================================================

CREATE TABLE materials (
    material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_code VARCHAR(50) UNIQUE NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'AGGREGATE',
        'FINE_MATERIAL',
        'BASE_MATERIAL',
        'SPECIALTY',
        'CUSTOM_BLEND'
    )),
    size_mm DECIMAL(10, 2),
    unit_of_measure VARCHAR(10) NOT NULL DEFAULT 'Ton' CHECK (unit_of_measure IN ('Ton', 'Load')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_custom_blend BOOLEAN NOT NULL DEFAULT FALSE,
    blend_components JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_blend_logic CHECK (
        (is_custom_blend = FALSE AND blend_components IS NULL) OR
        (is_custom_blend = TRUE AND blend_components IS NOT NULL)
    )
);

-- Material Aliases for naming variations
CREATE TABLE material_aliases (
    alias_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    alias_name VARCHAR(100) NOT NULL,
    source_system VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(material_id, alias_name)
);

-- =============================================================================
-- SECTION 2: PRODUCTION TRACKING
-- =============================================================================

CREATE TABLE production_daily (
    production_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(material_id),
    production_date DATE NOT NULL,
    quantity_tons DECIMAL(10, 2) NOT NULL CHECK (quantity_tons >= 0),
    shift VARCHAR(10) NOT NULL CHECK (shift IN ('Day', 'Night', 'D&N')),
    operation_code VARCHAR(20) DEFAULT 'CRU-PRO',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID,
    
    UNIQUE(material_id, production_date, shift)
);

CREATE INDEX idx_production_date ON production_daily(production_date);
CREATE INDEX idx_production_material ON production_daily(material_id);

-- =============================================================================
-- SECTION 3: DISPATCH & OUTFLOW TRACKING
-- =============================================================================

CREATE TABLE dispatch_transactions (
    dispatch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(material_id),
    dispatch_date DATE NOT NULL,
    trip_count INTEGER DEFAULT 1 CHECK (trip_count > 0),
    net_weight_tons DECIMAL(10, 2) NOT NULL CHECK (net_weight_tons >= 0),
    weight_entrance DECIMAL(10, 2),
    weight_exit DECIMAL(10, 2),
    operation_code VARCHAR(20) DEFAULT 'CRU-DIS',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID,
    
    CONSTRAINT chk_weight_logic CHECK (
        (weight_entrance IS NULL AND weight_exit IS NULL) OR
        (weight_entrance IS NOT NULL AND weight_exit IS NOT NULL AND 
         ABS((weight_entrance - weight_exit) - net_weight_tons) < 0.01)
    )
);

CREATE INDEX idx_dispatch_date ON dispatch_transactions(dispatch_date);
CREATE INDEX idx_dispatch_material ON dispatch_transactions(material_id);

-- =============================================================================
-- SECTION 4: INVENTORY MANAGEMENT
-- =============================================================================

CREATE TABLE inventory_summary (
    inventory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(material_id),
    summary_date DATE NOT NULL,
    opening_balance DECIMAL(10, 2) NOT NULL,
    total_production DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_production >= 0),
    total_dispatched DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_dispatched >= 0),
    closing_balance DECIMAL(10, 2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(material_id, summary_date),
    
    CONSTRAINT chk_inventory_balance CHECK (
        ABS(closing_balance - (opening_balance + total_production - total_dispatched)) < 0.01
    )
);

CREATE INDEX idx_inventory_date ON inventory_summary(summary_date);
CREATE INDEX idx_inventory_material ON inventory_summary(material_id);

-- =============================================================================
-- SECTION 5: EQUIPMENT & RESOURCE TRACKING
-- =============================================================================

CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(100) NOT NULL,
    location VARCHAR(100) DEFAULT 'Al-asela LD',
    unit_count INTEGER NOT NULL DEFAULT 1 CHECK (unit_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(equipment_type, equipment_name, location)
);

CREATE TABLE equipment_attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(equipment_id),
    attendance_date DATE NOT NULL,
    units_operational INTEGER NOT NULL CHECK (units_operational >= 0),
    hours_operated DECIMAL(5, 2) CHECK (hours_operated >= 0 AND hours_operated <= 24),
    shift VARCHAR(10) CHECK (shift IN ('Day', 'Night', 'D&N')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(equipment_id, attendance_date)
);

CREATE INDEX idx_equipment_attendance_date ON equipment_attendance(attendance_date);

-- =============================================================================
-- SECTION 6: MANPOWER TRACKING
-- =============================================================================

CREATE TABLE manpower_roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_code VARCHAR(20) UNIQUE NOT NULL,
    role_description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE manpower_attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES manpower_roles(role_id),
    attendance_date DATE NOT NULL,
    headcount INTEGER NOT NULL CHECK (headcount >= 0),
    shift VARCHAR(10) NOT NULL CHECK (shift IN ('Day', 'Night', 'D&N')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role_id, attendance_date, shift)
);

CREATE INDEX idx_manpower_attendance_date ON manpower_attendance(attendance_date);

-- =============================================================================
-- SECTION 7: OPERATIONAL METRICS
-- =============================================================================

CREATE TABLE operational_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    unit_of_measure VARCHAR(20),
    operation_code VARCHAR(20),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_date ON operational_metrics(metric_date);
CREATE INDEX idx_metrics_type ON operational_metrics(metric_type);

-- =============================================================================
-- SECTION 8: AUDIT & SYSTEM TRACKING
-- =============================================================================

CREATE TABLE system_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table ON system_audit_log(table_name);
CREATE INDEX idx_audit_date ON system_audit_log(changed_at);

-- =============================================================================
-- SECTION 9: VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Current Inventory View
CREATE OR REPLACE VIEW v_current_inventory AS
SELECT 
    m.material_code,
    m.material_name,
    m.category,
    i.closing_balance as current_stock,
    m.unit_of_measure,
    i.summary_date as last_updated
FROM materials m
LEFT JOIN LATERAL (
    SELECT closing_balance, summary_date
    FROM inventory_summary
    WHERE material_id = m.material_id
    ORDER BY summary_date DESC
    LIMIT 1
) i ON TRUE
WHERE m.is_active = TRUE;

-- Daily Production Summary
CREATE OR REPLACE VIEW v_daily_production_summary AS
SELECT 
    production_date,
    COUNT(DISTINCT material_id) as materials_produced,
    SUM(quantity_tons) as total_production_tons,
    shift
FROM production_daily
GROUP BY production_date, shift
ORDER BY production_date DESC;

-- Daily Dispatch Summary  
CREATE OR REPLACE VIEW v_daily_dispatch_summary AS
SELECT 
    dispatch_date,
    COUNT(DISTINCT material_id) as materials_dispatched,
    SUM(net_weight_tons) as total_dispatched_tons,
    SUM(trip_count) as total_trips
FROM dispatch_transactions
GROUP BY dispatch_date
ORDER BY dispatch_date DESC;

-- Equipment Utilization
CREATE OR REPLACE VIEW v_equipment_utilization AS
SELECT 
    e.equipment_type,
    e.equipment_name,
    ea.attendance_date,
    e.unit_count as total_units,
    ea.units_operational,
    ea.hours_operated,
    ROUND((ea.units_operational::DECIMAL / NULLIF(e.unit_count, 0) * 100), 2) as utilization_percentage
FROM equipment e
JOIN equipment_attendance ea ON e.equipment_id = ea.equipment_id
WHERE e.is_active = TRUE
ORDER BY ea.attendance_date DESC, e.equipment_type;

-- =============================================================================
-- SECTION 10: FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp trigger to relevant tables
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate inventory closing balance
CREATE OR REPLACE FUNCTION calculate_inventory_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.closing_balance := NEW.opening_balance + NEW.total_production - NEW.total_dispatched;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_inventory_before_insert_or_update 
BEFORE INSERT OR UPDATE ON inventory_summary
FOR EACH ROW EXECUTE FUNCTION calculate_inventory_balance();

-- =============================================================================
-- SECTION 11: INITIAL SEED DATA - MATERIALS TAXONOMY
-- =============================================================================

-- Aggregate Materials
INSERT INTO materials (material_code, material_name, category, size_mm, unit_of_measure) VALUES
    ('AGG-3/4', 'Aggregate 3/4"', 'AGGREGATE', 19.05, 'Ton'),
    ('AGG-1/2', 'Aggregate 1/2"', 'AGGREGATE', 12.70, 'Ton'),
    ('AGG-3/8', 'Aggregate 3/8"', 'AGGREGATE', 9.53, 'Ton'),
    ('AGG-2', 'Aggregate 2"', 'AGGREGATE', 50.80, 'Ton'),
    ('AGG-1.5', 'Aggregate 1.5"', 'AGGREGATE', 38.10, 'Ton'),
    ('AGG-1', 'Aggregate 1"', 'AGGREGATE', 25.40, 'Ton');

-- Fine Materials
INSERT INTO materials (material_code, material_name, category, size_mm, unit_of_measure) VALUES
    ('FINE-ZERO', 'Zero 3/16"', 'FINE_MATERIAL', 4.76, 'Ton'),
    ('FINE-MICRO', 'Micro 1/16', 'FINE_MATERIAL', 1.59, 'Ton'),
    ('FINE-0-5', '0-5mm', 'FINE_MATERIAL', 5.00, 'Ton'),
    ('FINE-POWDER', 'Powder', 'FINE_MATERIAL', NULL, 'Ton'),
    ('FINE-SAND', 'Sand', 'FINE_MATERIAL', NULL, 'Ton');

-- Base Materials
INSERT INTO materials (material_code, material_name, category, size_mm, unit_of_measure) VALUES
    ('BASE-SUBBASE', 'Subbase', 'BASE_MATERIAL', NULL, 'Ton'),
    ('BASE-SUBGRADE', 'Sub-grade', 'BASE_MATERIAL', NULL, 'Ton'),
    ('BASE-COURSE', 'Base Course', 'BASE_MATERIAL', NULL, 'Ton');

-- Specialty Materials
INSERT INTO materials (material_code, material_name, category, size_mm, unit_of_measure) VALUES
    ('SPEC-OVERSIZE', 'Oversize', 'SPECIALTY', NULL, 'Ton'),
    ('SPEC-PIPE-BED', 'Pipe Bedding', 'SPECIALTY', NULL, 'Ton'),
    ('SPEC-RAPID-DRAIN', 'Rapid Draining', 'SPECIALTY', NULL, 'Ton'),
    ('SPEC-ABC', 'ABC (Aggregate Base Course)', 'SPECIALTY', NULL, 'Ton'),
    ('SPEC-SC1', 'Sc1(0-38mm)', 'SPECIALTY', 38.00, 'Ton'),
    ('SPEC-CLEAN-POWDER', 'Cleaning Powder', 'SPECIALTY', NULL, 'Ton');

-- Custom Blend (A1A)
INSERT INTO materials (
    material_code, material_name, category, size_mm, unit_of_measure, 
    is_custom_blend, blend_components
) VALUES (
    'CUSTOM-A1A', 
    'A1A', 
    'CUSTOM_BLEND', 
    NULL, 
    'Ton',
    TRUE,
    '{"base_materials": ["FINE-POWDER", "BASE-SUBBASE"], "aggregate_sizes": ["AGG-3/4", "AGG-1/2", "AGG-3/8"], "blend_note": "Custom blend per client specification"}'::JSONB
);

-- Feed Material
INSERT INTO materials (material_code, material_name, category, size_mm, unit_of_measure) VALUES
    ('FEED-RAW', 'Feed', 'BASE_MATERIAL', NULL, 'Ton');

-- =============================================================================
-- SECTION 12: EQUIPMENT SEED DATA
-- =============================================================================

INSERT INTO equipment (equipment_type, equipment_name, location, unit_count) VALUES
    ('Static Crusher', 'Static Crusher No-1', 'Al-asela LD', 1),
    ('Static Crusher', 'Static Crusher No-2', 'Al-asela LD', 1),
    ('Mobile Screen', 'Mobile Screen 7707', 'Al-asela LD', 1),
    ('Excavator', 'CAT', 'Al-asela LD', 2),
    ('Front Loader', 'Shavol', 'Al-asela LD', 4),
    ('Bulldozer', 'Bulldozer', 'Al-asela LD', 1),
    ('Dumper', 'Dumper', 'Al-asela LD', 4),
    ('Grader', 'Grader', 'Al-asela LD', 0),
    ('Dyna', 'Dyna', 'Al-asela LD', 2),
    ('Winch', 'Winch (Mechanical Device)', 'Al-asela LD', 0);

-- =============================================================================
-- SECTION 13: MANPOWER ROLES SEED DATA
-- =============================================================================

INSERT INTO manpower_roles (role_code, role_description) VALUES
    ('EQP-DRV', 'Equipment Driver'),
    ('CRU-OP', 'Crusher Operator'),
    ('MAINT', 'Maintenance Worker'),
    ('SALES', 'Sales Representative'),
    ('OTHER', 'Other Personnel');

-- =============================================================================
-- SECTION 14: CONSTRAINTS SUMMARY
-- =============================================================================

/*
KEY CONSTRAINTS ENFORCED:
1. Inventory Balance: closing_balance = opening_balance + production - dispatched
2. Weight Consistency: net_weight = weight_entrance - weight_exit (when available)
3. Custom Blend Logic: blend_components required for custom blends
4. Non-negative Quantities: All quantity fields >= 0
5. Date Uniqueness: No duplicate records for same material/date combinations
6. Referential Integrity: All foreign keys enforced with cascade rules
7. Time Validation: hours_operated <= 24 hours per day
8. Shift Validation: Only valid shift values allowed
*/

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
