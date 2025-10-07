// =============================================================================
// Alasela Operations Database - TypeScript Schema Definitions
// =============================================================================
// Generated from: D:\excel\database\schema.sql
// Database: PostgreSQL 14+
// GZANSP Compliant: No 'any' types used
// =============================================================================

// =============================================================================
// ENUMS - Database constraint values
// =============================================================================

export enum MaterialCategory {
  AGGREGATE = 'AGGREGATE',
  FINE_MATERIAL = 'FINE_MATERIAL',
  BASE_MATERIAL = 'BASE_MATERIAL',
  SPECIALTY = 'SPECIALTY',
  CUSTOM_BLEND = 'CUSTOM_BLEND',
}

export enum UnitOfMeasure {
  TON = 'Ton',
  LOAD = 'Load',
}

export enum Shift {
  DAY = 'Day',
  NIGHT = 'Night',
  DAY_AND_NIGHT = 'D&N',
}

export enum AuditOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

// =============================================================================
// BASE TYPES
// =============================================================================

export interface Material {
  material_id: string;
  material_code: string;
  material_name: string;
  category: MaterialCategory;
  size_mm: number | null;
  unit_of_measure: UnitOfMeasure;
  is_active: boolean;
  is_custom_blend: boolean;
  blend_components: BlendComponents | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlendComponents {
  base_materials: string[];
  aggregate_sizes: string[];
  blend_note: string;
}

export interface MaterialAlias {
  alias_id: string;
  material_id: string;
  alias_name: string;
  source_system: string | null;
  created_at: Date;
}

export interface ProductionDaily {
  production_id: string;
  material_id: string;
  production_date: Date;
  quantity_tons: number;
  shift: Shift;
  operation_code: string;
  recorded_at: Date;
  recorded_by: string | null;
}

export interface DispatchTransaction {
  dispatch_id: string;
  material_id: string;
  dispatch_date: Date;
  trip_count: number;
  net_weight_tons: number;
  weight_entrance: number | null;
  weight_exit: number | null;
  operation_code: string;
  recorded_at: Date;
  recorded_by: string | null;
}

export interface InventorySummary {
  inventory_id: string;
  material_id: string;
  summary_date: Date;
  opening_balance: number;
  total_production: number;
  total_dispatched: number;
  closing_balance: number;
  calculated_at: Date;
}

export interface Equipment {
  equipment_id: string;
  equipment_type: string;
  equipment_name: string;
  location: string;
  unit_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EquipmentAttendance {
  attendance_id: string;
  equipment_id: string;
  attendance_date: Date;
  units_operational: number;
  hours_operated: number | null;
  shift: Shift | null;
  recorded_at: Date;
}

export interface ManpowerRole {
  role_id: string;
  role_code: string;
  role_description: string;
  created_at: Date;
}

export interface ManpowerAttendance {
  attendance_id: string;
  role_id: string;
  attendance_date: Date;
  headcount: number;
  shift: Shift;
  recorded_at: Date;
}

export interface OperationalMetric {
  metric_id: string;
  metric_date: Date;
  metric_type: string;
  metric_value: number;
  unit_of_measure: string | null;
  operation_code: string | null;
  recorded_at: Date;
}

export interface SystemAuditLog {
  audit_id: string;
  table_name: string;
  operation: AuditOperation;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: Date;
}

// =============================================================================
// VIEW TYPES
// =============================================================================

export interface CurrentInventoryView {
  material_code: string;
  material_name: string;
  category: MaterialCategory;
  current_stock: number;
  unit_of_measure: UnitOfMeasure;
  last_updated: Date;
}

export interface DailyProductionSummaryView {
  production_date: Date;
  materials_produced: number;
  total_production_tons: number;
  shift: Shift;
}

export interface DailyDispatchSummaryView {
  dispatch_date: Date;
  materials_dispatched: number;
  total_dispatched_tons: number;
  total_trips: number;
}

export interface EquipmentUtilizationView {
  equipment_type: string;
  equipment_name: string;
  attendance_date: Date;
  total_units: number;
  units_operational: number;
  hours_operated: number | null;
  utilization_percentage: number;
}

// =============================================================================
// INPUT/CREATE TYPES (Omit auto-generated fields)
// =============================================================================

export type CreateMaterial = Omit<Material, 'material_id' | 'created_at' | 'updated_at'>;

export type CreateProductionDaily = Omit<ProductionDaily, 'production_id' | 'recorded_at'>;

export type CreateDispatchTransaction = Omit<DispatchTransaction, 'dispatch_id' | 'recorded_at'>;

export type CreateInventorySummary = Omit<InventorySummary, 'inventory_id' | 'closing_balance' | 'calculated_at'>;

export type CreateEquipment = Omit<Equipment, 'equipment_id' | 'created_at' | 'updated_at'>;

export type CreateEquipmentAttendance = Omit<EquipmentAttendance, 'attendance_id' | 'recorded_at'>;

export type CreateManpowerRole = Omit<ManpowerRole, 'role_id' | 'created_at'>;

export type CreateManpowerAttendance = Omit<ManpowerAttendance, 'attendance_id' | 'recorded_at'>;

// =============================================================================
// UPDATE TYPES (Partial of create types)
// =============================================================================

export type UpdateMaterial = Partial<CreateMaterial>;

export type UpdateProductionDaily = Partial<CreateProductionDaily>;

export type UpdateDispatchTransaction = Partial<CreateDispatchTransaction>;

export type UpdateEquipment = Partial<CreateEquipment>;

// =============================================================================
// RESPONSE TYPES WITH RELATIONS
// =============================================================================

export interface MaterialWithAliases extends Material {
  aliases: MaterialAlias[];
}

export interface ProductionDailyWithMaterial extends ProductionDaily {
  material: Material;
}

export interface DispatchTransactionWithMaterial extends DispatchTransaction {
  material: Material;
}

export interface InventorySummaryWithMaterial extends InventorySummary {
  material: Material;
}

export interface EquipmentAttendanceWithEquipment extends EquipmentAttendance {
  equipment: Equipment;
}

export interface ManpowerAttendanceWithRole extends ManpowerAttendance {
  role: ManpowerRole;
}

// =============================================================================
// PAGINATION & FILTER TYPES
// =============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface MaterialFilter {
  category?: MaterialCategory;
  isActive?: boolean;
  isCustomBlend?: boolean;
}

export interface ProductionFilter extends DateRangeFilter {
  materialId?: string;
  shift?: Shift;
}

export interface DispatchFilter extends DateRangeFilter {
  materialId?: string;
}

export interface InventoryFilter {
  materialId?: string;
  asOfDate?: Date;
}

// =============================================================================
// API RESPONSE WRAPPERS
// =============================================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// =============================================================================
// VALIDATION ERROR TYPES
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    validationErrors: ValidationError[];
  };
}

// =============================================================================
// DASHBOARD SUMMARY TYPES
// =============================================================================

export interface DashboardSummary {
  date: Date;
  production: {
    totalTons: number;
    materialsProduced: number;
    topMaterial: {
      name: string;
      quantity: number;
    };
  };
  dispatch: {
    totalTons: number;
    totalTrips: number;
    materialsDispatched: number;
  };
  inventory: {
    totalStock: number;
    lowStockMaterials: Array<{
      name: string;
      currentStock: number;
    }>;
  };
  equipment: {
    totalEquipment: number;
    operational: number;
    utilizationRate: number;
  };
}
