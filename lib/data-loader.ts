import { z } from "zod";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";

// ============ Zod Schemas ============

const formFactorSchema = z.enum(["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"]);
const memoryTypeSchema = z.enum(["DDR4", "DDR5"]);
const pcieVersionSchema = z.enum(["3.0", "4.0", "5.0"]);
const powerConnectorSchema = z.enum(["8-pin", "12-pin", "16-pin", "6-pin"]);
const storageInterfaceSchema = z.enum(["NVMe", "SATA"]);
const storageFormFactorSchema = z.enum(["M.2 2280", "2.5\" SATA", "3.5\" SATA"]);
const psuEfficiencySchema = z.enum([
  "80+ Bronze",
  "80+ Silver",
  "80+ Gold",
  "80+ Platinum",
  "80+ Titanium",
]);
const coolerTypeSchema = z.enum(["Air", "AIO"]);
const psuFormFactorSchema = z.enum(["ATX", "SFX", "SFX-L"]);

const cpuSpecsSchema = z.object({
  brand: z.enum(["Intel", "AMD"]),
  socket: z.string(),
  cores: z.number().int().positive(),
  threads: z.number().int().positive(),
  base_clock_ghz: z.number().positive(),
  boost_clock_ghz: z.number().positive().optional(),
  tdp_w: z.number().nonnegative(),
  max_mem_speed_mhz: z.number().positive(),
  memory_type: memoryTypeSchema,
  pcie_version: pcieVersionSchema,
  has_igpu: z.boolean(),
  tier: z.number().int().min(1).max(10),
});

const cpuSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.enum(["Intel", "AMD"]),
  price_usd: z.number().positive().optional(),
  specs: cpuSpecsSchema,
});

const gpuSpecsSchema = z.object({
  brand: z.enum(["NVIDIA", "AMD"]),
  length_mm: z.number().positive(),
  thickness_slots: z.number().positive(),
  tdp_w: z.number().nonnegative(),
  power_connectors: z.array(z.union([powerConnectorSchema, z.string()])),
  pcie_version: pcieVersionSchema,
  vram_gb: z.number().positive(),
  tier: z.number().int().min(1).max(10),
  peak_power_w: z.number().positive().optional(),
});

const gpuSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.enum(["NVIDIA", "AMD"]),
  price_usd: z.number().positive().optional(),
  specs: gpuSpecsSchema,
});

const motherboardHeadersSchema = z.object({
  fan_4pin: z.number().int().min(0),
  fan_3pin: z.number().int().min(0).optional(),
  rgb_12v: z.number().int().min(0).optional(),
  argb_5v: z.number().int().min(0),
  usb2_internal: z.number().int().min(0),
  usb3_internal: z.number().int().min(0),
  usb_c_internal: z.number().int().min(0),
});

const motherboardSpecsSchema = z.object({
  socket: z.string(),
  chipset: z.string(),
  form_factor: formFactorSchema,
  memory_type: memoryTypeSchema,
  ram_slots: z.number().int().min(1).max(8),
  max_ram_gb: z.number().positive(),
  m2_slots: z.number().int().min(0),
  sata_ports: z.number().int().min(0),
  pcie_version: pcieVersionSchema,
  has_bios_flashback: z.boolean(),
  headers: motherboardHeadersSchema.optional(),
});

const motherboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  price_usd: z.number().positive().optional(),
  specs: motherboardSpecsSchema,
});

const ramSpecsSchema = z.object({
  memory_type: memoryTypeSchema,
  capacity_gb: z.number().positive(),
  speed_mhz: z.number().positive(),
  modules: z.number().int().min(1).max(4),
  latency: z.string(),
  voltage_v: z.number().positive().optional(),
});

const ramSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  price_usd: z.number().positive().optional(),
  specs: ramSpecsSchema,
});

const storageSpecsSchema = z.object({
  interface: storageInterfaceSchema,
  form_factor: storageFormFactorSchema,
  capacity_gb: z.number().positive(),
  read_speed_mb_s: z.number().positive().optional(),
  write_speed_mb_s: z.number().positive().optional(),
  tbw: z.number().positive().optional(),
});

const storageSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  price_usd: z.number().positive().optional(),
  specs: storageSpecsSchema,
});

const psuConnectorsSchema = z.object({
  pin_24_main: z.number().int().min(0),
  pin_8_cpu: z.number().int().min(0),
  pin_8_pcie: z.number().int().min(0),
  pin_6_pcie: z.number().int().min(0).optional(),
  pin_16_12vhpwr: z.number().int().min(0).optional(),
  sata: z.number().int().min(0),
  molex: z.number().int().min(0).optional(),
});

const psuSpecsSchema = z.object({
  wattage_w: z.number().positive(),
  efficiency: psuEfficiencySchema,
  form_factor: psuFormFactorSchema,
  modular: z.enum(["Non-modular", "Semi-modular", "Fully modular"]),
  atx_version: z.enum(["2.x", "3.0"]).optional(),
  atx_standard: z.enum(["ATX2.x", "ATX3.0", "ATX3.1"]).optional(),
  pcie_5_ready: z.boolean(),
  length_mm: z.number().positive().optional(),
  connectors: psuConnectorsSchema.optional(),
});

const psuSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  price_usd: z.number().positive().optional(),
  specs: psuSpecsSchema,
});

const coolerSpecsSchema = z.object({
  type: coolerTypeSchema,
  tdp_rating_w: z.number().positive().optional(),
  radiator_size_mm: z.number().positive().optional(),
  fan_size_mm: z.number().positive().optional(),
  height_mm: z.number().positive().optional(),
  sockets: z.array(z.string()),
  radiator_fan_thickness_mm: z.number().positive().optional(),
  fan_count: z.number().int().min(0).optional(),
  rgb_type: z.enum(["none", "12v_rgb", "5v_argb"]).optional(),
});

const coolerSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  price_usd: z.number().positive().optional(),
  specs: coolerSpecsSchema,
});

const caseFrontPanelSchema = z.object({
  usb_a: z.number().int().min(0).optional(),
  usb_c: z.number().int().min(0).optional(),
  audio_jack: z.boolean(),
});

const caseSpecsSchema = z.object({
  form_factor: formFactorSchema,
  max_gpu_length_mm: z.number().positive(),
  max_cooler_height_mm: z.number().positive(),
  max_psu_length_mm: z.number().positive().optional(),
  drive_bays_2_5: z.number().int().min(0),
  drive_bays_3_5: z.number().int().min(0),
  expansion_slots: z.number().int().min(1),
  supports_radiator_mm: z.array(z.number()).optional(),
  max_psu_form_factor: z.enum(["ATX", "SFX", "SFX-L"]),
  max_gpu_thickness_slots: z.number().int().min(1).optional(),
  max_radiator_thickness_mm: z.number().positive().optional(),
  front_panel: caseFrontPanelSchema.optional(),
  preinstalled_fans: z.number().int().min(0).optional(),
  max_fans: z.number().int().min(0).optional(),
});

const caseSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  price_usd: z.number().positive().optional(),
  specs: caseSpecsSchema,
});

// ============ Validation Helpers ============

export class DataValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly details?: z.ZodError["issues"]
  ) {
    super(message);
    this.name = "DataValidationError";
  }
}

function validateArray<T>(
  data: unknown,
  schema: z.ZodType<T>,
  path: string
): T[] {
  const arraySchema = z.array(schema);
  const result = arraySchema.safeParse(data);

  if (!result.success) {
    throw new DataValidationError(
      `Invalid data in ${path}: ${result.error.message}`,
      path,
      result.error.issues
    );
  }

  return result.data;
}

// ============ Data Loading (Server-side) ============

/**
 * Load and validate CPUs from seed data.
 * Use with require/import or fetch - for Next.js, consider loading from public or server.
 */
export async function loadCPUs(): Promise<CPU[]> {
  try {
    const data = await import("@/data/seed/cpus.json");
    return validateArray(data.default, cpuSchema, "cpus.json") as CPU[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load CPUs: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export async function loadGPUs(): Promise<GPU[]> {
  try {
    const data = await import("@/data/seed/gpus.json");
    return validateArray(data.default, gpuSchema, "gpus.json") as GPU[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load GPUs: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export async function loadMotherboards(): Promise<Motherboard[]> {
  try {
    const data = await import("@/data/seed/motherboards.json");
    return validateArray(data.default, motherboardSchema, "motherboards.json") as Motherboard[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load motherboards: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export async function loadRAM(): Promise<RAM[]> {
  try {
    const data = await import("@/data/seed/ram.json");
    return validateArray(data.default, ramSchema, "ram.json") as RAM[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load RAM: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export async function loadStorage(): Promise<Storage[]> {
  try {
    const data = await import("@/data/seed/storage.json");
    return validateArray(data.default, storageSchema, "storage.json") as Storage[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load storage: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export async function loadPSUs(): Promise<PSU[]> {
  try {
    const data = await import("@/data/seed/psus.json");
    return validateArray(data.default, psuSchema, "psus.json") as PSU[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load PSUs: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export async function loadCoolers(): Promise<Cooler[]> {
  try {
    const data = await import("@/data/seed/coolers.json");
    return validateArray(data.default, coolerSchema, "coolers.json") as Cooler[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load coolers: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export async function loadCases(): Promise<Case[]> {
  try {
    const data = await import("@/data/seed/cases.json");
    return validateArray(data.default, caseSchema, "cases.json") as Case[];
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    throw new Error(`Failed to load cases: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

/**
 * Load all component data at once.
 */
export async function loadAllComponents(): Promise<{
  cpus: CPU[];
  gpus: GPU[];
  motherboards: Motherboard[];
  ram: RAM[];
  storage: Storage[];
  psus: PSU[];
  coolers: Cooler[];
  cases: Case[];
}> {
  const [cpus, gpus, motherboards, ram, storage, psus, coolers, cases] =
    await Promise.all([
      loadCPUs(),
      loadGPUs(),
      loadMotherboards(),
      loadRAM(),
      loadStorage(),
      loadPSUs(),
      loadCoolers(),
      loadCases(),
    ]);

  return {
    cpus,
    gpus,
    motherboards,
    ram,
    storage,
    psus,
    coolers,
    cases,
  };
}
