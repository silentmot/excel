# Alasela Operations Database - Data Dictionary

## Document Information

**Version**: 1.0.0  
**Database**: alasela_ops  
**DBMS**: PostgreSQL 14+  
**Created**: 2025-10-07  
**Source**: CSV analysis from D:\excel\docs\csv\

---

## Table of Contents

1. [Core Tables](#core-tables)
   - [materials](#1-materials)
   - [production_daily](#2-production_daily)
   - [dispatch_transactions](#3-dispatch_transactions)
   - [inventory_summary](#4-inventory_summary)
2. [Resource Tables](#resource-tables)
   - [equipment](#5-equipment)
   - [equipment_attendance](#6-equipment_attendance)
   - [manpower_roles](#7-manpower_roles)
   - [manpower_attendance](#8-manpower_attendance)
3. [Supporting Tables](#supporting-tables)
   - [material_aliases](#9-material_aliases)
   - [operational_metrics](#10-operational_metrics)
   - [system_audit_log](#11-system_audit_log)
4. [Views](#views)
5. [Data Types Reference](#data-types-reference)
6. [Constraints Summary](#constraints-summary)

---

## Core Tables

### 1. materials

**Purpose**: Single source of truth for all material types in the facility

**Source**: Material types extracted from AlaselaMaster.csv rows 1-16 and AlaselaDispatched.csv

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| material_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique identifier for material |
| material_code | VARCHAR(50) | NO | - | UNIQUE, NOT NULL | Standardized material code (e.g., AGG-3/4) |
| material_name | VARCHAR(100) | NO | - | NOT NULL | Display name for material |
| category | VARCHAR(50) | NO | - | CHECK (in list), NOT NULL | Material category classification |
| size_mm | DECIMAL(10,2) | YES | NULL | - | Material size in millimeters (NULL for unsized) |
| unit_of_measure | VARCHAR(10) | NO | 'Ton' | CHECK (in list), NOT NULL | Standard unit (Ton or Load) |
| is_active | BOOLEAN | NO | TRUE | NOT NULL | Active status flag |
| is_custom_blend | BOOLEAN | NO | FALSE | NOT NULL | Indicates custom blended material |
| blend_components | JSONB | YES | NULL | - | JSON structure defining blend composition |
| created_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record last update timestamp |

**Valid Categories**:
- `AGGREGATE` - Size-graded crushed aggregates
- `FINE_MATERIAL` - Fine particulates and sands
- `BASE_MATERIAL` - Foundation and base course materials
- `SPECIALTY` - Specialized application materials
- `CUSTOM_BLEND` - Client-specific blended materials

**Valid Units**:
- `Ton` - Weight-based measurement
- `Load` - Volume-based measurement (deprecated, standardize to Ton)

**Business Rules**:
- Material code must be unique across system
- If `is_custom_blend = TRUE`, `blend_components` must be populated
- If `is_custom_blend = FALSE`, `blend_components` must be NULL
- Size in mm should be populated for sized aggregates, NULL for unsized materials

**Relationships**:
- Referenced by: production_daily, dispatch_transactions, inventory_summary, material_aliases

**Indexes**:
- Primary Key: material_id
- Unique: material_code
- None on other columns (small lookup table)

**Sample Data**:
```sql
INSERT INTO materials (material_code, material_name, category, size_mm, unit_of_measure)
VALUES ('AGG-3/4', 'Aggregate 3/4"', 'AGGREGATE', 19.05, 'Ton');
```

---

### 2. production_daily

**Purpose**: Track daily production output per material type

**Source**: AlaselaMaster.csv Production section (rows 33-42)

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| production_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique production record identifier |
| material_id | UUID | NO | - | FOREIGN KEY → materials, NOT NULL | Reference to produced material |
| production_date | DATE | NO | - | NOT NULL | Date of production |
| quantity_tons | DECIMAL(10,2) | NO | - | CHECK (>= 0), NOT NULL | Quantity produced in tons |
| shift | VARCHAR(10) | NO | - | CHECK (in list), NOT NULL | Production shift |
| operation_code | VARCHAR(20) | YES | 'CRU-PRO' | - | Operation code identifier |
| recorded_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |
| recorded_by | UUID | YES | NULL | - | User who recorded (future: FK to users table) |

**Valid Shifts**:
- `Day` - Day shift production
- `Night` - Night shift production
- `D&N` - Combined day and night shift

**Business Rules**:
- No duplicate entries for same material, date, and shift combination (UNIQUE constraint)
- Quantity must be non-negative (cannot produce negative materials)
- Production date cannot be in the future (application-level validation)
- Default operation code is 'CRU-PRO' (Crusher Production)

**Relationships**:
- References: materials (material_id)
- Used by: inventory_summary calculations

**Indexes**:
- Primary Key: production_id
- Index: production_date (for date-range queries)
- Index: material_id (for material-specific queries)
- Unique: (material_id, production_date, shift)

**Sample Query**:
```sql
-- Get total production for a specific date
SELECT m.material_name, SUM(p.quantity_tons) as total_production
FROM production_daily p
JOIN materials m ON p.material_id = m.material_id
WHERE p.production_date = '2025-07-01'
GROUP BY m.material_name;
```

---

### 3. dispatch_transactions

**Purpose**: Record individual dispatch events for material outflow

**Source**: AlaselaDispatched.csv structure (905 transaction records)

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| dispatch_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique dispatch identifier |
| material_id | UUID | NO | - | FOREIGN KEY → materials, NOT NULL | Reference to dispatched material |
| dispatch_date | DATE | NO | - | NOT NULL | Date of dispatch |
| trip_count | INTEGER | YES | 1 | CHECK (> 0) | Number of trips/loads |
| net_weight_tons | DECIMAL(10,2) | NO | - | CHECK (>= 0), NOT NULL | Net weight dispatched in tons |
| weight_entrance | DECIMAL(10,2) | YES | NULL | - | Truck weight at entrance (optional) |
| weight_exit | DECIMAL(10,2) | YES | NULL | - | Truck weight at exit (optional) |
| operation_code | VARCHAR(20) | YES | 'CRU-DIS' | - | Operation code identifier |
| recorded_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |
| recorded_by | UUID | YES | NULL | - | User who recorded |

**Business Rules**:
- Net weight must be non-negative
- Trip count must be positive (minimum 1)
- If weight_entrance and weight_exit are both provided, their difference must equal net_weight_tons (within 0.01 tolerance)
- If weight measurements are not available (N/A in source), both entrance and exit should be NULL
- Default operation code is 'CRU-DIS' (Crusher Dispatch)

**Weight Calculation Logic**:
```sql
net_weight_tons = weight_entrance - weight_exit
```

**Relationships**:
- References: materials (material_id)
- Used by: inventory_summary calculations

**Indexes**:
- Primary Key: dispatch_id
- Index: dispatch_date (for date-range queries)
- Index: material_id (for material-specific queries)

**Sample Query**:
```sql
-- Get total dispatches by material for a date range
SELECT m.material_name, 
       SUM(d.net_weight_tons) as total_dispatched,
       SUM(d.trip_count) as total_trips
FROM dispatch_transactions d
JOIN materials m ON d.material_id = m.material_id
WHERE d.dispatch_date BETWEEN '2025-07-01' AND '2025-07-31'
GROUP BY m.material_name;
```

---

### 4. inventory_summary

**Purpose**: Periodic inventory reconciliation and balance tracking

**Source**: AlaselaInventory.csv structure and calculation logic

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| inventory_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique inventory record identifier |
| material_id | UUID | NO | - | FOREIGN KEY → materials, NOT NULL | Reference to material |
| summary_date | DATE | NO | - | NOT NULL | Date of inventory summary |
| opening_balance | DECIMAL(10,2) | NO | - | NOT NULL | Starting inventory for period |
| total_production | DECIMAL(10,2) | NO | 0 | CHECK (>= 0), NOT NULL | Total production for period |
| total_dispatched | DECIMAL(10,2) | NO | 0 | CHECK (>= 0), NOT NULL | Total dispatched for period |
| closing_balance | DECIMAL(10,2) | NO | - | CALCULATED, NOT NULL | Ending inventory for period |
| calculated_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Calculation timestamp |

**Balance Calculation**:
```sql
closing_balance = opening_balance + total_production - total_dispatched
```

**Business Rules**:
- No duplicate entries for same material and date (UNIQUE constraint)
- Balance equation must hold (enforced by database trigger)
- Opening balance for day N should equal closing balance from day N-1
- Production and dispatched quantities must be non-negative (except negative allowed for custom blends per business rules)
- Closing balance automatically calculated by trigger before insert/update

**Calculation Trigger**:
```sql
CREATE TRIGGER calculate_inventory_before_insert_or_update 
BEFORE INSERT OR UPDATE ON inventory_summary
FOR EACH ROW EXECUTE FUNCTION calculate_inventory_balance();
```

**Relationships**:
- References: materials (material_id)
- Aggregates from: production_daily, dispatch_transactions

**Indexes**:
- Primary Key: inventory_id
- Index: summary_date (for date-range queries)
- Index: material_id (for material-specific queries)
- Unique: (material_id, summary_date)

**Sample Query**:
```sql
-- Get current inventory for all materials
SELECT m.material_name, i.closing_balance, i.summary_date
FROM inventory_summary i
JOIN materials m ON i.material_id = m.material_id
WHERE i.summary_date = (
    SELECT MAX(summary_date) FROM inventory_summary WHERE material_id = i.material_id
)
ORDER BY m.material_name;
```

---

## Resource Tables

### 5. equipment

**Purpose**: Master data for facility equipment

**Source**: AlaselaEquipment.csv rows 2-10

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| equipment_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique equipment identifier |
| equipment_type | VARCHAR(50) | NO | - | NOT NULL | Equipment category/type |
| equipment_name | VARCHAR(100) | NO | - | NOT NULL | Equipment name/identifier |
| location | VARCHAR(100) | YES | 'Al-asela LD' | - | Site location |
| unit_count | INTEGER | NO | 1 | CHECK (>= 0), NOT NULL | Number of units available |
| is_active | BOOLEAN | NO | TRUE | NOT NULL | Active status flag |
| created_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record last update timestamp |

**Equipment Types** (from source data):
- Static Crusher
- Mobile Screen
- Excavator
- Front Loader
- Bulldozer
- Dumper
- Grader
- Dyna
- Winch

**Business Rules**:
- No duplicate equipment (type, name, location) combinations
- Unit count of 0 indicates equipment type exists but none currently available
- Inactive equipment (is_active = FALSE) should not appear in attendance tracking

**Relationships**:
- Referenced by: equipment_attendance

**Indexes**:
- Primary Key: equipment_id
- Unique: (equipment_type, equipment_name, location)

**Sample Data**:
```sql
INSERT INTO equipment (equipment_type, equipment_name, location, unit_count)
VALUES ('Static Crusher', 'Static Crusher No-1', 'Al-asela LD', 1);
```

---

### 6. equipment_attendance

**Purpose**: Daily tracking of equipment operational status

**Source**: AlaselaEquipment.csv daily columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| attendance_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique attendance record identifier |
| equipment_id | UUID | NO | - | FOREIGN KEY → equipment, NOT NULL | Reference to equipment |
| attendance_date | DATE | NO | - | NOT NULL | Date of attendance record |
| units_operational | INTEGER | NO | - | CHECK (>= 0), NOT NULL | Number of units in operation |
| hours_operated | DECIMAL(5,2) | YES | NULL | CHECK (>= 0 AND <= 24) | Total operational hours |
| shift | VARCHAR(10) | YES | NULL | CHECK (in list) | Shift designation |
| recorded_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |

**Valid Shifts**:
- `Day` - Day shift
- `Night` - Night shift
- `D&N` - Combined shifts

**Business Rules**:
- No duplicate attendance records for same equipment and date
- Units operational cannot exceed equipment.unit_count
- Hours operated cannot exceed 24 hours per day
- Hours operated should be NULL if not tracked

**Relationships**:
- References: equipment (equipment_id)

**Indexes**:
- Primary Key: attendance_id
- Index: attendance_date (for date-range queries)
- Unique: (equipment_id, attendance_date)

**Sample Query**:
```sql
-- Equipment utilization for a date
SELECT e.equipment_name, 
       ea.units_operational, 
       e.unit_count,
       ROUND((ea.units_operational::DECIMAL / e.unit_count * 100), 2) as utilization_pct
FROM equipment_attendance ea
JOIN equipment e ON ea.equipment_id = e.equipment_id
WHERE ea.attendance_date = '2025-07-01';
```

---

### 7. manpower_roles

**Purpose**: Define workforce role categories

**Source**: AlaselaMaster.csv Manpower section roles

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| role_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique role identifier |
| role_code | VARCHAR(20) | NO | - | UNIQUE, NOT NULL | Short role code |
| role_description | VARCHAR(100) | NO | - | NOT NULL | Full role description |
| created_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |

**Standard Roles** (from source):
- EQP-DRV: Equipment Driver
- CRU-OP: Crusher Operator
- MAINT: Maintenance Worker
- SALES: Sales Representative
- OTHER: Other Personnel

**Business Rules**:
- Role codes must be unique
- Inactive roles should be soft-deleted (add is_active column if needed)

**Relationships**:
- Referenced by: manpower_attendance

**Indexes**:
- Primary Key: role_id
- Unique: role_code

---

### 8. manpower_attendance

**Purpose**: Daily workforce attendance tracking

**Source**: AlaselaMaster.csv Manpower section (rows 26-30)

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| attendance_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique attendance record identifier |
| role_id | UUID | NO | - | FOREIGN KEY → manpower_roles, NOT NULL | Reference to role |
| attendance_date | DATE | NO | - | NOT NULL | Date of attendance |
| headcount | INTEGER | NO | - | CHECK (>= 0), NOT NULL | Number of personnel |
| shift | VARCHAR(10) | NO | - | CHECK (in list), NOT NULL | Shift designation |
| recorded_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |

**Valid Shifts**:
- `Day`
- `Night`
- `D&N` (Day and Night combined)

**Business Rules**:
- No duplicate records for same role, date, and shift
- Headcount must be non-negative (0 indicates no personnel present)

**Relationships**:
- References: manpower_roles (role_id)

**Indexes**:
- Primary Key: attendance_id
- Index: attendance_date
- Unique: (role_id, attendance_date, shift)

---

## Supporting Tables

### 9. material_aliases

**Purpose**: Map material name variations to canonical material records

**Source**: Naming variations observed across CSV files

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| alias_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique alias identifier |
| material_id | UUID | NO | - | FOREIGN KEY → materials, NOT NULL | Reference to canonical material |
| alias_name | VARCHAR(100) | NO | - | NOT NULL | Alternative material name |
| source_system | VARCHAR(50) | YES | NULL | - | Origin of alias (e.g., 'excel', 'legacy_system') |
| created_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |

**Example Mappings**:
- "Sand", "sand", "Sand " → material_code: FINE-SAND
- "Subbase", "Sub-base", "sub-base" → material_code: BASE-SUBBASE
- "3/4\"", "Aggregate 3/4\"" → material_code: AGG-3/4

**Business Rules**:
- No duplicate aliases for same material
- Alias lookup should be case-insensitive in application layer
- Trimming of whitespace recommended in application layer

**Relationships**:
- References: materials (material_id)

**Indexes**:
- Primary Key: alias_id
- Unique: (material_id, alias_name)

---

### 10. operational_metrics

**Purpose**: Track operational KPIs and metrics

**Source**: AlaselaMaster.csv Operation section (rows 31-32)

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| metric_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique metric identifier |
| metric_date | DATE | NO | - | NOT NULL | Date of metric |
| metric_type | VARCHAR(50) | NO | - | NOT NULL | Type of metric |
| metric_value | DECIMAL(10,2) | NO | - | NOT NULL | Metric value |
| unit_of_measure | VARCHAR(20) | YES | NULL | - | Unit (e.g., 'Number', 'Ton') |
| operation_code | VARCHAR(20) | YES | NULL | - | Operation code identifier |
| recorded_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Record creation timestamp |

**Metric Types**:
- `Accepted Trucks (Count)` - Number of trucks accepted
- `Accepted Trucks (Tonnage)` - Total tonnage accepted
- Custom metrics as needed

**Business Rules**:
- Metric types should be standardized across system
- Value interpretation depends on metric type and unit

**Indexes**:
- Primary Key: metric_id
- Index: metric_date
- Index: metric_type

---

### 11. system_audit_log

**Purpose**: Complete audit trail for all data modifications

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| audit_id | UUID | NO | uuid_generate_v4() | PRIMARY KEY | Unique audit record identifier |
| table_name | VARCHAR(50) | NO | - | NOT NULL | Name of table modified |
| operation | VARCHAR(20) | NO | - | CHECK (in list), NOT NULL | Type of operation |
| record_id | UUID | NO | - | NOT NULL | ID of record modified |
| old_values | JSONB | YES | NULL | - | Record values before change |
| new_values | JSONB | YES | NULL | - | Record values after change |
| changed_by | UUID | YES | NULL | - | User who made change |
| changed_at | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | - | Timestamp of change |

**Valid Operations**:
- `INSERT` - New record created
- `UPDATE` - Existing record modified
- `DELETE` - Record deleted

**Business Rules**:
- Audit records should never be deleted (append-only table)
- For INSERT: old_values is NULL
- For DELETE: new_values is NULL
- For UPDATE: both old_values and new_values are populated

**Indexes**:
- Primary Key: audit_id
- Index: table_name (for table-specific audits)
- Index: changed_at (for time-based queries)

---

## Views

### v_current_inventory

**Purpose**: Current stock levels for all active materials

```sql
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
```

**Usage**:
```sql
SELECT * FROM v_current_inventory ORDER BY material_name;
```

---

### v_daily_production_summary

**Purpose**: Aggregated daily production metrics

```sql
CREATE OR REPLACE VIEW v_daily_production_summary AS
SELECT 
    production_date,
    COUNT(DISTINCT material_id) as materials_produced,
    SUM(quantity_tons) as total_production_tons,
    shift
FROM production_daily
GROUP BY production_date, shift
ORDER BY production_date DESC;
```

---

### v_daily_dispatch_summary

**Purpose**: Aggregated daily dispatch metrics

```sql
CREATE OR REPLACE VIEW v_daily_dispatch_summary AS
SELECT 
    dispatch_date,
    COUNT(DISTINCT material_id) as materials_dispatched,
    SUM(net_weight_tons) as total_dispatched_tons,
    SUM(trip_count) as total_trips
FROM dispatch_transactions
GROUP BY dispatch_date
ORDER BY dispatch_date DESC;
```

---

### v_equipment_utilization

**Purpose**: Equipment utilization analysis

```sql
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
```

---

## Data Types Reference

### UUID
- **Size**: 16 bytes
- **Format**: 8-4-4-4-12 hexadecimal digits (e.g., 550e8400-e29b-41d4-a716-446655440000)
- **Generation**: uuid_generate_v4() function
- **Purpose**: Primary keys to avoid integer collisions and improve distribution

### DECIMAL(10,2)
- **Precision**: 10 digits total
- **Scale**: 2 decimal places
- **Range**: -99999999.99 to 99999999.99
- **Purpose**: Precise numerical values (quantities, weights)

### VARCHAR(n)
- **Max Length**: n characters
- **Storage**: Variable-length string
- **Purpose**: Text fields with maximum length constraints

### DATE
- **Format**: YYYY-MM-DD
- **Range**: 4713 BC to 5874897 AD
- **Purpose**: Date without time component

### TIMESTAMP WITH TIME ZONE
- **Format**: YYYY-MM-DD HH:MI:SS+TZ
- **Purpose**: Precise timestamps with timezone information
- **Behavior**: Automatically converts to database timezone

### BOOLEAN
- **Values**: TRUE, FALSE, NULL
- **Storage**: 1 byte
- **Purpose**: Binary flag values

### JSONB
- **Format**: Binary JSON storage
- **Purpose**: Flexible semi-structured data (e.g., blend_components)
- **Advantage**: Efficient querying and indexing

---

## Constraints Summary

### Primary Keys
All tables use UUID primary keys for global uniqueness and better distribution

### Foreign Keys
- **materials** → production_daily, dispatch_transactions, inventory_summary, material_aliases
- **equipment** → equipment_attendance
- **manpower_roles** → manpower_attendance

### Unique Constraints
- materials.material_code
- material_aliases(material_id, alias_name)
- equipment(equipment_type, equipment_name, location)
- equipment_attendance(equipment_id, attendance_date)
- inventory_summary(material_id, summary_date)
- production_daily(material_id, production_date, shift)
- manpower_roles.role_code
- manpower_attendance(role_id, attendance_date, shift)

### Check Constraints
- Quantities >= 0 (except where noted)
- Hours operated <= 24
- Shift values in valid list
- Category values in valid list
- Operation values in valid list
- Inventory balance equation
- Weight consistency for dispatches
- Custom blend logic

### Not Null Constraints
Applied to all key fields and required business data

---

## Maintenance Notes

### Indexes
Review and optimize indexes based on query patterns after initial deployment

### Partitioning
Consider partitioning large tables (production_daily, dispatch_transactions) by date range for performance

### Archiving
Implement archiving strategy for audit logs and old transactional data

### Backup
Daily full backups recommended
Transaction log backups every 15 minutes for point-in-time recovery

---

**Document Status**: Complete  
**Last Review**: 2025-10-07  
**Next Review**: After initial deployment
