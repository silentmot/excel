# Excel Data Analysis Report

## Comprehensive Data Structure Analysis and Database Design

---

## **Project Overview**

### **Objective**

Analyze the Excel spreadsheets
` docs/csv/AlaselaMaster.csv`
` docs/csv/AlaselaDispatched.csv`
` docs/csv/AlaselaEquipment.csv`
` docs/csv/AlaselaInventory.csv`

to understand data structure, identify patterns, and design a proper database schema for construction & demolition recycling facility operations management.

### **Current State Assessment**

The spreadsheet contains unstructured daily input logs that require transformation into a relational database system supporting both static dashboards (Excel & Power BI) and normalized data tables.

---

## **Data Source Information**

| **Property**       | **Details**                                   |
| ------------------ | --------------------------------------------- |
| **Site Scope**     | construction & demolition recycling facility          |
| **Data Type**      | Daily operational logs and reports            |
| **Current Format** | Unstructured Excel workbook                   |
| **Target Format**  | Relational database + Dashboard-ready exports |

---

## **CSV Data Flow Architecture**

### **Input Sources and Derived Outputs**

```mermaid
graph TB
    subgraph "Daily Input Sources"
        M[AlasselaMaster.csv<br/>PRIMARY INPUT<br/>Daily Operations Data]
        D[AlaselaDispatched.csv<br/>SUPPLEMENTARY INPUT<br/>Daily Dispatch Records]
    end

    subgraph "Derived Reports"
        P[AlaselaProduction.csv<br/>DERIVED OUTPUT<br/>Production Metrics]
        I[AlaselaInventory.csv<br/>DERIVED OUTPUT<br/>Stock Levels]
    end

    subgraph "Supporting Data"
        E[AlaselaEquipment.csv<br/>Attendance DATA<br/>Resource Tracking]
    end

    M -->|Feeds Production Data| P
    M -->|Feeds Initial Inventory| I
    D -->|Affects Stock Levels| I
    M -.->|References| E

    style M fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    style D fill:#2196F3,stroke:#1565C0,stroke-width:3px,color:#fff
    style P fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    style I fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    style E fill:#9E9E9E,stroke:#424242,stroke-width:2px,color:#fff
```

### **Data Relationship Summary**

| **File** | **Type** | **Function** | **Data Source** |
|----------|----------|--------------|-----------------|
| **AlasselaMaster.csv** | Primary Input | Daily operations staging | Manual daily entry |
| **AlaselaDispatched.csv** | Supplementary Input | Material outflow tracking | Manual daily entry |
| **AlaselaProduction.csv** | Derived Output | Production reporting | Calculated from Master |
| **AlaselaInventory.csv** | Derived Output | Stock management | Master (inflow) + Dispatched (outflow) |
| **AlaselaEquipment.csv** | Attendance Data | Equipment Operations Hours | Referenced by Master |

### **Data Flow Logic**

1. **Master → Production**: Production metrics are calculated from Master's processing records
2. **Master → Inventory**: New materials and processed stock are added from Master
3. **Dispatched → Inventory**: Outbound materials reduce inventory levels
4. **Master ↔ Equipment**: Master operations reference equipment availability

---

## **Sheet Structure Analysis**

### **1. Master File Sheet**

**Status**: `Unintelligent staging source` - requires restructuring

#### **Current Issues**

- ❌ **Description Column**: Does not contain descriptions; represents primary material types
- ❌ **Type Column**: Misleading label; contains operations/actions rather than types
- ❌ **Sub-Type Column**: Inconsistent data (equipment/operations/manpower)
- ❌ **Production Rows**: Different formulas creating data inconsistency

#### **Data Flow Purpose**

```mermaid
graph LR
    A[Master File Daily Input] --> B[Production Report]
    A --> C[Inventory Report]
    A --> D[Dispatched Report]
    A --> E[Equipment Numbers]
```

### **2. Dispatched Report Sheet**

**Purpose**: Material transaction documentation

| **Function**     | **Records**                |
| ---------------- | -------------------------- |
| Material Outflow | Dispatched quantities      |
| Transaction Log  | Material volume tracking   |
| Delivery Records | Distribution documentation |

### **3. Number of Equipment Sheet**

**Purpose**: Resource attendance tracking

| **Function**         | **Records**                  |
| -------------------- | ---------------------------- |
| Equipment Status     | Daily equipment availability |
| Workforce Attendance | Personnel tracking           |


### **4. Production Report Sheet**

**Purpose**: Daily crusher output data

| **Function**        | **Records**                 |
| ------------------- | --------------------------- |
| Daily Production    | Crusher output quantities   |
| Material Processing | Production by material type |
| Operational Metrics | Performance indicators      |

### **5. Inventory Report Sheet**

**Purpose**: Material stock management

| **Function**        | **Records**              |
| ------------------- | ------------------------ |
| Available Materials | Current stock levels     |
| Produced Materials  | New production inventory |
| Recycled Materials  | Reprocessed stock        |

---

## **Material Classification System**

### **Aggregate Material Types**

The current naming convention shows size variations of the same base material:

#### **Aggregate Sizes**

| **Size Designation** | **Measurement** | **Usage**          |
| -------------------- | --------------- | ------------------ |
| Aggregate 3/4        | 3/4 inch        | Standard aggregate |
| Zero 3/16            | 3/16 inch       | Fine aggregate     |
| Micro 1/16           | 1/16 inch       | Micro aggregate    |

#### **Distinct Material Types**

- **Aggregate** (various sizes)
- **Subbase** (foundation material)
- **Sand** (fine material)
- **[Other materials to be identified]**

>Need to standardize material taxonomy for database normalization. and reanalyze material types.

---

## **Database Design Requirements**

### **Step 0: Foundation Analysis**

#### **Primary Objectives**

1. **Extract Daily Input Patterns**: Understand how Master File data flows
2. **Identify Data Relationships**: Map connections between sheets
3. **Standardize Material Classification**: Create consistent material taxonomy
4. **Design Relational Schema**: Establish normalized database structure

#### **Target Outputs**

1. **Clean Master Sheet**: Dashboard-ready static export
2. **Normalized Data Tables**: Proper relational structure
3. **Data Integration Logic**: Automated flow between systems

---

## **Analysis Methodology**

### **Phase 1: Data Discovery**

- [ ] **Sheet Content Analysis**: Define columns and sample rows for each sheet
- [ ] **Data Type Identification**: Categorize field types and formats
- [ ] **Relationship Mapping**: Identify data dependencies
- [ ] **Quality Assessment**: Document data inconsistencies

### **Phase 2: Schema Design**

- [ ] **Entity Identification**: Define core business entities
- [ ] **Relationship Definition**: Establish entity relationships
- [ ] **Normalization Process**: Apply database normalization rules
- [ ] **Constraint Specification**: Define data validation rules

### **Phase 3: Implementation Planning**

- [ ] **Migration Strategy**: Plan data transformation approach
- [ ] **Dashboard Requirements**: Specify reporting needs
- [ ] **Integration Points**: Define system interfaces
- [ ] **Validation Framework**: Establish data quality checks

---

## **Data Quality Issues Identified**

### **Critical Problems**

| **Issue**                       | **Impact**             | **Priority** |
| ------------------------------- | ---------------------- | ------------ |
| Inconsistent column semantics   | Data misinterpretation | HIGH         |
| Variable formula patterns       | Calculation errors     | HIGH         |
| Mixed data types in columns     | Processing failures    | HIGH         |
| Unclear material classification | Inventory confusion    | MEDIUM       |

### **Recommended Solutions**

1. **Column Renaming**: Align names with actual data content
2. **Data Type Standardization**: Enforce consistent formats
3. **Material Taxonomy**: Create standardized classification
4. **Formula Standardization**: Implement consistent calculations

---

## **Next Steps**

### **Immediate Actions Required**

1. **Access Excel File**: Open and examine ``docs/csv/**.csv``
2. **Sheet Documentation**: Record detailed structure for each sheet
3. **Sample Data Extraction**: Capture representative data samples
4. **Pattern Analysis**: Identify data flow patterns

### **Success Criteria**

- [ ] Complete understanding of current data structure
- [ ] Documented relationships between sheets
- [ ] Standardized material classification system
- [ ] Database schema design ready for implementation

---

## **Technical Specifications**

### **Tools and Technologies**

- **Analysis Tools**: Excel, Python pandas, SQL
- **Database Target**: Relational database (PostgreSQL/SQL Server)
- **Dashboard Platform**: Power BI, Excel pivot tables
- **Data Processing**: ETL pipeline for automation

### **Performance Requirements**

- **Daily Processing**: Automated data ingestion
- **Real-time Reporting**: Dashboard refresh capabilities
- **Data Integrity**: Validation and error handling
- **Scalability**: Support for multiple sites (future)

---
