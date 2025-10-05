
-- Dimension Tables
CREATE TABLE materials (
    material_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    size VARCHAR(50),
    category VARCHAR(50),
    description TEXT  -- Optional extended info
);

CREATE TABLE equipment (
    equipment_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL
);

CREATE TABLE manpower_roles (
    role_id SERIAL PRIMARY KEY,
    modelcode VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'CRU-OP'
    name VARCHAR(100) NOT NULL         -- e.g., 'Crusher Operator'
);

CREATE TABLE operation_metrics (
    metric_id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,         -- e.g., 'SEG-OP'
    name VARCHAR(100) NOT NULL,        -- e.g., 'Accepted Trucks'
    unit VARCHAR(10) NOT NULL          -- e.g., 'Number', 'Ton'
);

-- Fact Tables (Daily Data)
CREATE TABLE daily_production (
    production_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    material_id INT REFERENCES materials(material_id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity >= 0),
    shift VARCHAR(10) DEFAULT 'D&N',
    unit VARCHAR(10) DEFAULT 'Ton',
    UNIQUE (date, material_id)  -- Prevent duplicates
);

CREATE TABLE daily_dispatched (
    dispatched_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    material_id INT REFERENCES materials(material_id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity >= 0),
    shift VARCHAR(10) DEFAULT 'D&N',
    unit VARCHAR(10) DEFAULT 'Ton',
    UNIQUE (date, material_id)
);

CREATE TABLE daily_equipment_usage (
    usage_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    equipment_id INT REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    hours DECIMAL(5,1) NOT NULL CHECK (hours >= 0),
    shift VARCHAR(10) DEFAULT 'D&N',
    unit VARCHAR(10) DEFAULT 'Hrs.',
    UNIQUE (date, equipment_id)
);

CREATE TABLE daily_manpower (
    manpower_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    role_id INT REFERENCES manpower_roles(role_id) ON DELETE CASCADE,
    count INT NOT NULL CHECK (count >= 0),
    shift VARCHAR(10) DEFAULT 'D&N',
    unit VARCHAR(10) DEFAULT 'Number',
    UNIQUE (date, role_id)
);

CREATE TABLE daily_operations (
    op_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    metric_id INT REFERENCES operation_metrics(metric_id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    shift VARCHAR(10) DEFAULT 'D&N',
    UNIQUE (date, metric_id)
);

-- Example View for Inventory (Computed)
CREATE VIEW material_inventory AS
SELECT
    date,
    material_id,
    SUM(quantity) OVER (PARTITION BY material_id ORDER BY date) AS cumulative_production,
    SUM(d.quantity) OVER (PARTITION BY material_id ORDER BY date) AS cumulative_dispatched,
    (SUM(quantity) OVER (PARTITION BY material_id ORDER BY date) - SUM(d.quantity) OVER (PARTITION BY material_id ORDER BY date)) AS current_inventory
FROM daily_production p
LEFT JOIN daily_dispatched d ON p.date = d.date AND p.material_id = d.material_id;
