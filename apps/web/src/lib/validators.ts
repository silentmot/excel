// =============================================================================
// Alasela Operations - Zod Validation Schemas
// =============================================================================
// GZANSP Compliant: Type-safe validation without 'any' types
// Source: D:\excel\src\types\schema.ts
// =============================================================================

import { z } from 'zod';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const MaterialCategorySchema = z.enum([
  'AGGREGATE',
  'FINE_MATERIAL',
  'BASE_MATERIAL',
  'SPECIALTY',
  'CUSTOM_BLEND',
]);

export const UnitOfMeasureSchema = z.enum(['Ton', 'Load']);

export const ShiftSchema = z.enum(['Day', 'Night', 'D&N']);

export const AuditOperationSchema = z.enum(['INSERT', 'UPDATE', 'DELETE']);

// =============================================================================
// CORE OBJECT SCHEMAS
// =============================================================================

export const BlendComponentsSchema = z.object({
  base_materials: z.array(z.string()),
  aggregate_sizes: z.array(z.string()),
  blend_note: z.string(),
});

// Material Schema
export const MaterialSchema = z.object({
  material_id: z.string().uuid(),
  material_code: z.string().min(1).max(50),
  material_name: z.string().min(1).max(100),
  category: MaterialCategorySchema,
  size_mm: z.number().positive().nullable(),
  unit_of_measure: UnitOfMeasureSchema,
  is_active: z.boolean(),
  is_custom_blend: z.boolean(),
  blend_components: BlendComponentsSchema.nullable(),
  created_at: z.date(),
  updated_at: z.date(),
}).refine(
  (data) => {
    if (data.is_custom_blend) {
      return data.blend_components !== null;
    }
    return data.blend_components === null;
  },
  {
    message: 'blend_components must be provided for custom blends and null otherwise',
    path: ['blend_components'],
  }
);

export const CreateMaterialSchema = MaterialSchema.omit({
  material_id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();

// Production Daily Schema
export const ProductionDailySchema = z.object({
  production_id: z.string().uuid(),
  material_id: z.string().uuid(),
  production_date: z.date(),
  quantity_tons: z.number().nonnegative(),
  shift: ShiftSchema,
  operation_code: z.string().default('CRU-PRO'),
  recorded_at: z.date(),
  recorded_by: z.string().uuid().nullable(),
});

export const CreateProductionDailySchema = ProductionDailySchema.omit({
  production_id: true,
  recorded_at: true,
});

export const UpdateProductionDailySchema = CreateProductionDailySchema.partial();

// Dispatch Transaction Schema
export const DispatchTransactionSchema = z.object({
  dispatch_id: z.string().uuid(),
  material_id: z.string().uuid(),
  dispatch_date: z.date(),
  trip_count: z.number().int().positive().default(1),
  net_weight_tons: z.number().nonnegative(),
  weight_entrance: z.number().positive().nullable(),
  weight_exit: z.number().positive().nullable(),
  operation_code: z.string().default('CRU-DIS'),
  recorded_at: z.date(),
  recorded_by: z.string().uuid().nullable(),
}).refine(
  (data) => {
    if (data.weight_entrance !== null && data.weight_exit !== null) {
      const calculatedWeight = data.weight_entrance - data.weight_exit;
      return Math.abs(calculatedWeight - data.net_weight_tons) < 0.01;
    }
    return true;
  },
  {
    message: 'net_weight_tons must equal weight_entrance - weight_exit when both are provided',
    path: ['net_weight_tons'],
  }
);

export const CreateDispatchTransactionSchema = DispatchTransactionSchema.omit({
  dispatch_id: true,
  recorded_at: true,
});

export const UpdateDispatchTransactionSchema = CreateDispatchTransactionSchema.partial();

// Inventory Summary Schema
export const InventorySummarySchema = z.object({
  inventory_id: z.string().uuid(),
  material_id: z.string().uuid(),
  summary_date: z.date(),
  opening_balance: z.number(),
  total_production: z.number().nonnegative(),
  total_dispatched: z.number().nonnegative(),
  closing_balance: z.number(),
  calculated_at: z.date(),
}).refine(
  (data) => {
    const calculated = data.opening_balance + data.total_production - data.total_dispatched;
    return Math.abs(calculated - data.closing_balance) < 0.01;
  },
  {
    message: 'closing_balance must equal opening_balance + total_production - total_dispatched',
    path: ['closing_balance'],
  }
);

export const CreateInventorySummarySchema = InventorySummarySchema.omit({
  inventory_id: true,
  closing_balance: true,
  calculated_at: true,
});

// Equipment Schema
export const EquipmentSchema = z.object({
  equipment_id: z.string().uuid(),
  equipment_type: z.string().min(1).max(50),
  equipment_name: z.string().min(1).max(100),
  location: z.string().max(100).default('Al-asela LD'),
  unit_count: z.number().int().nonnegative(),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateEquipmentSchema = EquipmentSchema.omit({
  equipment_id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateEquipmentSchema = CreateEquipmentSchema.partial();

// Equipment Attendance Schema
export const EquipmentAttendanceSchema = z.object({
  attendance_id: z.string().uuid(),
  equipment_id: z.string().uuid(),
  attendance_date: z.date(),
  units_operational: z.number().int().nonnegative(),
  hours_operated: z.number().min(0).max(24).nullable(),
  shift: ShiftSchema.nullable(),
  recorded_at: z.date(),
});

export const CreateEquipmentAttendanceSchema = EquipmentAttendanceSchema.omit({
  attendance_id: true,
  recorded_at: true,
});

// Manpower Role Schema
export const ManpowerRoleSchema = z.object({
  role_id: z.string().uuid(),
  role_code: z.string().min(1).max(20),
  role_description: z.string().min(1).max(100),
  created_at: z.date(),
});

export const CreateManpowerRoleSchema = ManpowerRoleSchema.omit({
  role_id: true,
  created_at: true,
});

// Manpower Attendance Schema
export const ManpowerAttendanceSchema = z.object({
  attendance_id: z.string().uuid(),
  role_id: z.string().uuid(),
  attendance_date: z.date(),
  headcount: z.number().int().nonnegative(),
  shift: ShiftSchema,
  recorded_at: z.date(),
});

export const CreateManpowerAttendanceSchema = ManpowerAttendanceSchema.omit({
  attendance_id: true,
  recorded_at: true,
});

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const DateRangeFilterSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'startDate must be before or equal to endDate',
    path: ['endDate'],
  }
);

export const MaterialFilterSchema = z.object({
  category: MaterialCategorySchema.optional(),
  isActive: z.boolean().optional(),
  isCustomBlend: z.boolean().optional(),
});

export const ProductionFilterSchema = DateRangeFilterSchema.extend({
  materialId: z.string().uuid().optional(),
  shift: ShiftSchema.optional(),
});

export const DispatchFilterSchema = DateRangeFilterSchema.extend({
  materialId: z.string().uuid().optional(),
});

export const InventoryFilterSchema = z.object({
  materialId: z.string().uuid().optional(),
  asOfDate: z.date().optional(),
});

// =============================================================================
// REQUEST BODY SCHEMAS FOR API ENDPOINTS
// =============================================================================

export const ProductionBulkCreateSchema = z.object({
  records: z.array(CreateProductionDailySchema).min(1).max(100),
});

export const DispatchBulkCreateSchema = z.object({
  records: z.array(CreateDispatchTransactionSchema).min(1).max(100),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

export function formatValidationErrors(errors: z.ZodIssue[]): Array<{ field: string; message: string }> {
  return errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }));
}
