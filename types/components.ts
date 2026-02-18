/**
 * PC Build Advisor - Component type definitions
 */

// ============ Base Types ============

export type FormFactor = "ATX" | "Micro-ATX" | "Mini-ITX" | "E-ATX";

export type MemoryType = "DDR4" | "DDR5";

export type PcieVersion = "3.0" | "4.0" | "5.0";

// ============ CPU ============

export interface CPU {
  id: string;
  name: string;
  manufacturer: "Intel" | "AMD";
  price_usd?: number;
  specs: {
    brand: "Intel" | "AMD";
    socket: string;
    cores: number;
    threads: number;
    base_clock_ghz: number;
    boost_clock_ghz?: number;
    tdp_w: number;
    max_mem_speed_mhz: number;
    memory_type: MemoryType;
    pcie_version: PcieVersion;
    has_igpu: boolean;
    tier: number; // 1-10, higher = better performance
  };
}

// ============ GPU ============

export type PowerConnector = "8-pin" | "12-pin" | "16-pin" | "6-pin";

export interface GPU {
  id: string;
  name: string;
  manufacturer: "NVIDIA" | "AMD";
  price_usd?: number;
  specs: {
    brand: "NVIDIA" | "AMD";
    length_mm: number;
    thickness_slots: number;
    tdp_w: number;
    power_connectors: PowerConnector[];
    pcie_version: PcieVersion;
    vram_gb: number;
    tier: number; // 1-10
  };
}

// ============ Motherboard ============

export interface Motherboard {
  id: string;
  name: string;
  manufacturer: string;
  price_usd?: number;
  specs: {
    socket: string;
    chipset: string;
    form_factor: FormFactor;
    memory_type: MemoryType;
    ram_slots: number;
    max_ram_gb: number;
    m2_slots: number;
    sata_ports: number;
    pcie_version: PcieVersion;
    has_bios_flashback: boolean;
  };
}

// ============ RAM ============

export interface RAM {
  id: string;
  name: string;
  manufacturer: string;
  price_usd?: number;
  specs: {
    memory_type: MemoryType;
    capacity_gb: number;
    speed_mhz: number;
    modules: number; // number of sticks
    latency: string; // e.g. "CL36"
    voltage_v?: number;
  };
}

// ============ Storage ============

export type StorageInterface = "NVMe" | "SATA";

export type StorageFormFactor = "M.2 2280" | "2.5\" SATA" | "3.5\" SATA";

export interface Storage {
  id: string;
  name: string;
  manufacturer: string;
  price_usd?: number;
  specs: {
    interface: StorageInterface;
    form_factor: StorageFormFactor;
    capacity_gb: number;
    read_speed_mb_s?: number;
    write_speed_mb_s?: number;
    tbw?: number; // Total Bytes Written endurance
  };
}

// ============ PSU ============

export type PsuEfficiency = "80+ Bronze" | "80+ Silver" | "80+ Gold" | "80+ Platinum" | "80+ Titanium";

export interface PSU {
  id: string;
  name: string;
  manufacturer: string;
  price_usd?: number;
  specs: {
    wattage_w: number;
    efficiency: PsuEfficiency;
    form_factor: "ATX" | "SFX" | "SFX-L";
    modular: "Non-modular" | "Semi-modular" | "Fully modular";
    atx_version?: "2.x" | "3.0"; // ATX 3.0 has 12VHPWR
    pcie_5_ready: boolean;
  };
}

// ============ Cooler ============

export type CoolerType = "Air" | "AIO";

export interface Cooler {
  id: string;
  name: string;
  manufacturer: string;
  price_usd?: number;
  specs: {
    type: CoolerType;
    tdp_rating_w?: number; // for air coolers
    radiator_size_mm?: number; // for AIO: 120, 240, 280, 360
    fan_size_mm?: number;
    height_mm?: number; // for air coolers - RAM clearance
    sockets: string[]; // compatible sockets
  };
}

// ============ Case ============

export interface Case {
  id: string;
  name: string;
  manufacturer: string;
  price_usd?: number;
  specs: {
    form_factor: FormFactor;
    max_gpu_length_mm: number;
    max_cooler_height_mm: number;
    max_psu_length_mm?: number;
    drive_bays_2_5: number;
    drive_bays_3_5: number;
    expansion_slots: number;
    supports_radiator_mm?: number[]; // e.g. [240, 360]
    max_psu_form_factor: "ATX" | "SFX" | "SFX-L";
  };
}

// ============ Union Types ============

export type PCComponent = CPU | GPU | Motherboard | RAM | Storage | PSU | Cooler | Case;
