import type { Build } from "@/types/build";
import type { CPU, Motherboard, RAM, Storage, PSU, GPU, Case } from "@/types/components";

export interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  warnings?: string[];
  tips?: string[];
  videoTimestamp?: string; // For future video integration
  dependencies?: string[]; // Step IDs that must be completed first
}

export interface ChecklistSection {
  title: string;
  steps: ChecklistStep[];
}

export interface AssemblyChecklist {
  sections: ChecklistSection[];
  totalEstimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

type SelectedParts = {
  cpu?: CPU;
  gpu?: GPU;
  motherboard?: Motherboard;
  ram?: RAM;
  storage: Storage[];
  psu?: PSU;
  cooler?: import("@/types/components").Cooler;
  case?: Case;
};

function getSelectedParts(build: Build): SelectedParts {
  const { components } = build;
  return {
    cpu: components.cpu,
    gpu: components.gpu,
    motherboard: components.motherboard,
    ram: components.ram,
    storage: components.storage ?? [],
    psu: components.psu,
    cooler: components.cooler,
    case: components.case,
  };
}

/**
 * Generate assembly checklist for a build
 */
export function generateAssemblyChecklist(build: Build): AssemblyChecklist {
  const selectedParts = getSelectedParts(build);
  const sections: ChecklistSection[] = [];

  // Section 1: Preparation
  sections.push({
    title: "Preparation",
    steps: [
      {
        id: "prep-workspace",
        title: "Prepare workspace",
        description:
          "Clear a large, clean workspace. Use anti-static mat if available. Have a magnetic screwdriver and zip ties ready.",
        estimatedMinutes: 5,
        difficulty: "easy",
        tips: [
          "Work on a non-carpeted surface to avoid static",
          "Have good lighting",
          "Keep component boxes nearby for reference",
        ],
      },
      {
        id: "prep-unbox",
        title: "Unbox and inventory all components",
        description:
          "Open all boxes and verify you have every component. Check motherboard manual for included accessories (screws, SATA cables, etc.).",
        estimatedMinutes: 10,
        difficulty: "easy",
        tips: [
          "Don't throw away boxes yet in case of returns",
          "Save motherboard manual - you'll need it",
          "Verify PSU cables are all present",
        ],
      },
      {
        id: "prep-manual",
        title: "Read motherboard and case manuals",
        description:
          "Skim motherboard manual for header locations and case manual for cable routing. Familiarize yourself with layout.",
        estimatedMinutes: 10,
        difficulty: "easy",
        tips: [
          "Look for I/O shield installation instructions",
          "Note where fan headers are located",
          "Check for any special installation notes",
        ],
      },
    ],
  });

  // Section 2: Motherboard Preparation
  const motherboardSteps: ChecklistStep[] = [];

  // Install CPU
  motherboardSteps.push({
    id: "mobo-cpu",
    title: "Install CPU on motherboard",
    description: generateCpuInstallDescription(selectedParts.cpu, selectedParts.motherboard),
    estimatedMinutes: 5,
    difficulty: "medium",
    warnings: [
      "DO NOT force CPU - it should drop in easily",
      "Match the gold triangle on CPU with triangle on socket",
      "Handle CPU by edges only, don't touch pins/pads",
    ],
    tips: [
      "Remove CPU from plastic case carefully",
      "Align notches on CPU with socket notches",
      "Close retention bracket gently but firmly",
    ],
  });

  // Install RAM
  motherboardSteps.push({
    id: "mobo-ram",
    title: "Install RAM",
    description: generateRamInstallDescription(selectedParts.ram, selectedParts.motherboard),
    estimatedMinutes: 3,
    difficulty: "easy",
    warnings: [
      "RAM only fits one way - match the notch",
      "Push firmly until clips snap on both sides",
    ],
    tips: [
      "Install in correct slots (check manual for dual-channel config)",
      "Usually slots 2 and 4 for 2 sticks",
      "Push down evenly on both ends until you hear two clicks",
    ],
  });

  // Install M.2 drives BEFORE cooler
  if (selectedParts.storage?.some((s) => s.specs.interface === "NVMe")) {
    motherboardSteps.push({
      id: "mobo-m2",
      title: "Install M.2 NVMe drives",
      description:
        "Remove M.2 heatsink if present, install M.2 drive at 30° angle, press down and secure with screw. Reattach heatsink.",
      estimatedMinutes: 5,
      difficulty: "medium",
      warnings: [
        "M.2 slots may be under PCIe slot covers",
        "Don't lose the tiny M.2 mounting screw",
      ],
      tips: [
        "Install M.2 drives NOW before GPU makes them hard to reach",
        "Some motherboards have multiple M.2 slots - check manual for best slot",
        "Apply thermal pad if motherboard has M.2 heatsink",
      ],
      dependencies: ["mobo-ram"],
    });
  }

  const coolerType = selectedParts.cooler?.specs?.type;

  // CPU Cooler
  if (coolerType === "Air") {
    motherboardSteps.push({
      id: "mobo-cooler",
      title: "Install CPU cooler",
      description:
        "Apply thermal paste (pea-sized dot in center), mount cooler backplate, install cooler, connect fan to CPU_FAN header.",
      estimatedMinutes: 10,
      difficulty: "medium",
      warnings: [
        "Don't overtighten screws - finger tight then 1/4 turn",
        "Make sure all mounting points are secure",
        "Cooler should not wiggle",
      ],
      tips: [
        "Remove plastic cover from cooler base",
        "Tighten screws in X pattern for even pressure",
        "Don't use too much thermal paste - less is more",
        "Connect CPU fan to CPU_FAN header, not SYS_FAN",
      ],
      dependencies: ["mobo-cpu", "mobo-m2"],
    });
  }

  sections.push({
    title: "Motherboard Assembly",
    steps: motherboardSteps,
  });

  // Section 3: Case Preparation
  const caseSteps: ChecklistStep[] = [];

  caseSteps.push({
    id: "case-unbox",
    title: "Prepare case",
    description:
      "Remove side panels, remove any packaging materials, identify cable routing holes.",
    estimatedMinutes: 5,
    difficulty: "easy",
    tips: [
      "Save case screws in a safe place",
      "Note locations of cable routing grommets",
      "Remove any plastic protective film",
    ],
  });

  caseSteps.push({
    id: "case-io-shield",
    title: "Install I/O shield",
    description:
      "Snap motherboard I/O shield into rectangular opening on back of case. Push from inside until it clicks into place.",
    estimatedMinutes: 2,
    difficulty: "easy",
    warnings: [
      "Install I/O shield BEFORE motherboard - can't do it after!",
      "Sharp edges - press carefully",
    ],
    tips: [
      "Orient correctly - match ports to motherboard layout",
      "Make sure all edges are fully seated",
      "This is the #1 most forgotten step!",
    ],
  });

  // PSU installation
  const psuModular = selectedParts.psu?.specs?.modular;
  caseSteps.push({
    id: "case-psu",
    title: "Install power supply",
    description: generatePsuInstallDescription(selectedParts.psu, selectedParts.case),
    estimatedMinutes:
      psuModular && psuModular !== "Fully modular" ? 15 : 8,
    difficulty:
      psuModular && psuModular !== "Fully modular" ? "medium" : "easy",
    warnings: [
      "Orient fan correctly (usually facing down if case has PSU vent)",
      "Secure with all 4 screws",
    ],
    tips: [
      psuModular && psuModular !== "Fully modular"
        ? "Route excess cables behind motherboard tray before installing motherboard"
        : "Only connect cables you need to reduce clutter",
      "Some cases prefer PSU installed last - check manual",
    ],
  });

  const formFactor = selectedParts.motherboard?.specs?.form_factor;
  caseSteps.push({
    id: "case-standoffs",
    title: "Install motherboard standoffs",
    description: `Install brass standoffs in case where motherboard screw holes will be. Typically ${
      formFactor === "ATX"
        ? "9 standoffs for ATX"
        : formFactor === "Micro-ATX"
          ? "6–7 standoffs for Micro-ATX"
          : "6 standoffs for Mini-ITX"
    }.`,
    estimatedMinutes: 5,
    difficulty: "easy",
    warnings: [
      "CRITICAL: Don't install standoffs where there's no motherboard hole",
      "Extra standoffs can short the motherboard",
    ],
    tips: [
      "Count motherboard screw holes and match standoff count",
      "Hand-tighten standoffs - don't need tools",
      "Most cases have standoffs pre-installed, just verify",
    ],
  });

  sections.push({
    title: "Case Preparation",
    steps: caseSteps,
  });

  // Section 4: Motherboard Installation
  const installSteps: ChecklistStep[] = [];

  installSteps.push({
    id: "install-mobo",
    title: "Install motherboard in case",
    description:
      "Carefully lower motherboard into case, align with I/O shield and standoffs. Secure with screws (don't overtighten).",
    estimatedMinutes: 10,
    difficulty: "medium",
    warnings: [
      "Align I/O shield ports with motherboard ports",
      "All standoffs should align with motherboard holes",
      "Don't force - motherboard should sit flat naturally",
    ],
    tips: [
      "Tighten screws in star pattern for even pressure",
      "Finger tight then 1/4 turn",
      "Make sure motherboard isn't touching case metal anywhere except standoffs",
    ],
    dependencies: ["case-io-shield", "case-standoffs"],
  });

  // AIO radiator (if applicable)
  if (coolerType === "AIO") {
    const radiatorSize = selectedParts.cooler?.specs?.radiator_size_mm
      ? `${selectedParts.cooler.specs.radiator_size_mm}mm`
      : "240mm";
    installSteps.push({
      id: "install-aio",
      title: "Install AIO radiator and pump",
      description: `Mount ${radiatorSize} radiator with fans to case (front or top mount). Install pump block on CPU with pre-applied thermal paste. Connect fans to motherboard, pump to AIO_PUMP or CPU_FAN header.`,
      estimatedMinutes: 20,
      difficulty: "hard",
      warnings: [
        "Pump should not be highest point in loop (can trap air)",
        "Make sure radiator fits before screwing everything in",
        "Don't kink tubes",
      ],
      tips: [
        "Front mount: cooler CPU temps, radiator exhausts into case",
        "Top mount: slightly warmer CPU temps, exhausts heat out of case",
        "Fans as intake: cooler but potentially louder",
        "Mount radiator with fans first, then install pump block",
        "Connect pump to AIO_PUMP header if available, otherwise CPU_FAN",
      ],
      dependencies: ["install-mobo"],
    });
  }

  installSteps.push({
    id: "install-storage-sata",
    title: "Install SATA drives (if any)",
    description:
      "Mount 2.5\" SSDs or 3.5\" HDDs in drive bays. Connect SATA data cable to motherboard and SATA power from PSU.",
    estimatedMinutes: 5,
    difficulty: "easy",
    tips: [
      "Route SATA cables behind motherboard tray if possible",
      "3.5\" drives may need mounting screws from case accessories",
    ],
  });

  installSteps.push({
    id: "install-gpu",
    title: "Install graphics card",
    description: generateGpuInstallDescription(selectedParts.gpu, selectedParts.case),
    estimatedMinutes: 5,
    difficulty: "medium",
    warnings: [
      "Remove PCIe slot covers from case before installing GPU",
      "Make sure GPU is fully seated in PCIe slot (you'll hear a click)",
      "Secure GPU with case screws - don't skip this!",
    ],
    tips: [
      "Install in top PCIe x16 slot (closest to CPU)",
      "Push evenly on both ends of GPU until retention clip clicks",
      "Connect PCIe power cables from PSU if GPU requires them",
      "Some heavy GPUs benefit from GPU support bracket",
    ],
    dependencies: coolerType === "AIO" ? ["install-mobo", "install-aio"] : ["install-mobo"],
  });

  sections.push({
    title: "Component Installation",
    steps: installSteps,
  });

  // Section 5: Cable Management
  const cableSteps: ChecklistStep[] = [];

  cableSteps.push({
    id: "cables-mobo-power",
    title: "Connect motherboard power",
    description:
      "Connect 24-pin ATX power to motherboard. Connect 4-pin or 8-pin CPU power to top-left of motherboard (often labeled CPU_PWR or EATX12V).",
    estimatedMinutes: 5,
    difficulty: "easy",
    warnings: [
      "DON'T FORGET 4/8-pin CPU power - common reason for no boot",
      "24-pin should click into place firmly",
      "CPU power is separate from GPU power",
    ],
    tips: [
      "Route 24-pin cable through right grommet",
      "Route CPU power behind motherboard tray and through top grommet",
      "Make sure connectors are fully seated",
    ],
    dependencies: ["install-mobo"],
  });

  if (selectedParts.gpu?.specs?.power_connectors?.length) {
    cableSteps.push({
      id: "cables-gpu-power",
      title: "Connect GPU power cables",
      description: `Connect required PCIe power cables to graphics card from PSU.`,
      estimatedMinutes: 3,
      difficulty: "easy",
      warnings: [
        "Use separate cables for each connector if possible (don't daisy-chain high-power GPUs)",
        "Push connectors in firmly until they click",
      ],
      dependencies: ["install-gpu"],
    });
  }

  cableSteps.push({
    id: "cables-front-panel",
    title: "Connect front panel headers",
    description:
      "Connect power button, reset button, power LED, HDD LED from case to motherboard headers. Consult motherboard manual for exact pinout.",
    estimatedMinutes: 10,
    difficulty: "medium",
    warnings: [
      "These tiny connectors are fiddly - be patient",
      "Power and reset buttons are not polarized, LEDs are (+/- matters)",
    ],
    tips: [
      "Use tweezers or needle-nose pliers for tiny connectors",
      "Headers usually in bottom-right of motherboard",
      "Most motherboards have polarity diagram printed on PCB",
      "Double-check orientation for LEDs (+ and - matter)",
    ],
    dependencies: ["install-mobo"],
  });

  cableSteps.push({
    id: "cables-usb-audio",
    title: "Connect USB and audio headers",
    description:
      "Connect front panel USB 3.0, USB 2.0, USB-C (if available), and HD audio from case to motherboard.",
    estimatedMinutes: 5,
    difficulty: "easy",
    warnings: [
      "USB 3.0 header is keyed - don't force it",
      "USB-C requires motherboard USB-C header (Type-E)",
    ],
    tips: [
      "USB headers are usually along bottom edge of motherboard",
      "Audio header labeled AAFP or HD_AUDIO",
      "If case has USB-C but motherboard doesn't, that port won't work",
    ],
    dependencies: ["install-mobo"],
  });

  if (selectedParts.cooler?.specs?.rgb_type && selectedParts.cooler.specs.rgb_type !== "none") {
    cableSteps.push({
      id: "cables-rgb",
      title: "Connect RGB/ARGB cables",
      description: `Connect RGB lighting cables to motherboard. ${
        selectedParts.cooler.specs.rgb_type === "5v_argb"
          ? "Use 3-pin 5V ARGB headers"
          : "Use 4-pin 12V RGB headers"
      }.`,
      estimatedMinutes: 5,
      difficulty: "medium",
      warnings: [
        "12V RGB and 5V ARGB are NOT compatible",
        "Connecting wrong type can damage LEDs",
        "Check component specs for voltage",
      ],
      tips: [
        "Most modern components use 5V ARGB (3-pin)",
        "Headers usually labeled RGB or ARGB on motherboard",
      ],
    });
  }

  sections.push({
    title: "Cable Connections",
    steps: cableSteps,
  });

  // Section 6: Final Steps
  sections.push({
    title: "Pre-Boot Checks",
    steps: [
      {
        id: "final-double-check",
        title: "Double-check all connections",
        description:
          "Verify 24-pin ATX, 4/8-pin CPU, GPU power (if needed), all front panel headers, all fans connected.",
        estimatedMinutes: 10,
        difficulty: "easy",
        warnings: [
          "This is your last chance to catch mistakes before powering on",
        ],
        tips: [
          "Wiggle all power connectors to ensure they're seated",
          "Verify CPU_FAN header has a fan connected",
          "Check that RAM is fully clicked in",
          "Make sure no screws or standoffs are loose in case",
        ],
      },
      {
        id: "final-tidy",
        title: "Basic cable management",
        description:
          "Use zip ties or velcro straps to bundle cables. Route cables behind motherboard tray when possible. Ensure cables don't block fans.",
        estimatedMinutes: 15,
        difficulty: "easy",
        tips: [
          "Don't need perfect cable management yet - just make sure airflow is clear",
          "Keep cables away from CPU cooler and GPU fans",
          "Can improve cable management later after confirming PC boots",
        ],
      },
      {
        id: "final-close-case",
        title: "Close case panel",
        description:
          "Reattach side panel(s). Don't fully tighten screws yet in case you need to get back in.",
        estimatedMinutes: 2,
        difficulty: "easy",
        tips: [
          "Leave screws slightly loose until you've tested boot",
          "Make sure no cables are caught in panel",
        ],
      },
      {
        id: "final-peripherals",
        title: "Connect monitor, keyboard, mouse",
        description:
          "Connect monitor to GPU (NOT motherboard). Connect keyboard and mouse to USB ports. Connect power cable to PSU and wall outlet.",
        estimatedMinutes: 5,
        difficulty: "easy",
        warnings: [
          "CRITICAL: Connect monitor to GPU ports, not motherboard (unless CPU has integrated graphics and you intend to use it)",
        ],
        tips: [
          "Don't turn on PSU switch yet",
          "DisplayPort or HDMI both work fine",
          "Verify monitor is on correct input",
        ],
      },
      {
        id: "final-first-boot",
        title: "First boot attempt",
        description:
          "Flip PSU switch to ON (I position). Press case power button. PC should POST (display BIOS screen or logo).",
        estimatedMinutes: 5,
        difficulty: "easy",
        warnings: [
          "If nothing happens: check PSU switch, check 24-pin and 8-pin CPU power",
          "If fans spin but no display: reseat RAM, check monitor cable in GPU",
        ],
        tips: [
          "First boot may take 30–60 seconds",
          "Fans may spin up loud then quiet down - this is normal",
          "If successful, you'll see motherboard logo or BIOS screen",
        ],
      },
    ],
  });

  // Calculate total time and difficulty
  const totalMinutes = sections.reduce(
    (sum, section) =>
      sum +
      section.steps.reduce((s, step) => s + step.estimatedMinutes, 0),
    0
  );

  const caseFormFactor = selectedParts.case?.specs?.form_factor;
  const overallDifficulty =
    caseFormFactor === "Mini-ITX" || coolerType === "AIO"
      ? "advanced"
      : caseFormFactor === "Micro-ATX"
        ? "intermediate"
        : "beginner";

  return {
    sections,
    totalEstimatedMinutes: totalMinutes,
    difficulty: overallDifficulty,
  };
}

/**
 * Generate CPU installation description
 */
function generateCpuInstallDescription(cpu?: CPU, motherboard?: Motherboard): string {
  const socket = cpu?.specs?.socket || motherboard?.specs?.socket || "LGA1700";

  if (socket.toUpperCase().startsWith("AM")) {
    return "AMD installation: Lift retention arm, align gold triangle on CPU with triangle on socket, gently place CPU (pins down), close retention arm.";
  }
  return "Intel installation: Lift retention bracket and metal cover, align notches on CPU with socket, gently drop CPU in (contacts down, no pins), close bracket and cover.";
}

/**
 * Generate RAM installation description
 */
function generateRamInstallDescription(ram?: RAM, motherboard?: Motherboard): string {
  const sticks = ram ? ram.specs.modules : 2;
  const slots = motherboard ? motherboard.specs.ram_slots : 4;

  if (sticks === 2 && slots === 4) {
    return "For dual-channel (2 sticks in 4 slots): Install RAM in slots 2 and 4 (usually labeled A2 and B2). Open clips, align notch, push down until clips snap closed on both sides.";
  }
  if (sticks === 2 && slots === 2) {
    return "Install both RAM sticks in the two available slots. Open clips, align notch, push down until clips snap closed on both sides.";
  }
  return "Install RAM according to motherboard manual for optimal dual/quad-channel configuration. Open clips, align notch, push down firmly until clips snap closed.";
}

/**
 * Generate PSU installation description
 */
function generatePsuInstallDescription(psu?: PSU, pcCase?: Case): string {
  const modular = psu?.specs?.modular;

  let desc =
    "Slide PSU into case PSU compartment. Fan usually faces DOWN (if case has PSU vent) or UP (if no vent). Secure with 4 screws.";

  if (modular === "Fully modular" || modular === "Semi-modular") {
    desc +=
      " Before installing the motherboard, connect only the cables you need: 24-pin ATX, 4/8-pin CPU, PCIe for GPU, SATA for drives.";
  }

  if (pcCase?.specs?.max_psu_length_mm && psu?.specs?.length_mm) {
    if (psu.specs.length_mm > pcCase.specs.max_psu_length_mm - 10) {
      desc += ` This is a tight fit (${psu.specs.length_mm}mm PSU, ${pcCase.specs.max_psu_length_mm}mm max). Check cable clearance.`;
    }
  }

  return desc;
}

/**
 * Generate GPU installation description
 */
function generateGpuInstallDescription(gpu?: GPU, pcCase?: Case): string {
  const length = gpu?.specs?.length_mm || 0;
  const maxLength = pcCase?.specs?.max_gpu_length_mm || 999;

  let desc =
    "Remove 2 PCIe slot covers from rear of case. Insert GPU into top PCIe x16 slot, push down until retention clip clicks. Secure GPU bracket to case with screws.";

  if (length && maxLength && length > maxLength - 20) {
    desc += ` This is a tight fit (${length}mm GPU, ${maxLength}mm max). Ensure no cables are blocking the GPU path.`;
  }

  return desc;
}

