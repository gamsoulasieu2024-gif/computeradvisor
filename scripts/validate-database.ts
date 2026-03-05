/**
 * Database validation script
 * Checks for missing fields, invalid data, etc.
 *
 * Usage:
 *   npx ts-node scripts/validate-database.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import cpus from "../data/catalog/cpus.json";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import gpus from "../data/catalog/gpus.json";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateGpu(gpu: any, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!gpu.id) errors.push(`GPU ${index}: Missing id`);
  if (!gpu.name) errors.push(`GPU ${index}: Missing name`);
  if (!gpu.specs) errors.push(`GPU ${index}: Missing specs`);

  if (gpu.specs) {
    if (!gpu.specs.vram_gb) errors.push(`GPU ${index} (${gpu.name}): Missing VRAM`);
    if (!gpu.specs.tdp_w)
      warnings.push(`GPU ${index} (${gpu.name}): Missing TDP`);
    if (!gpu.specs.tier)
      warnings.push(`GPU ${index} (${gpu.name}): Missing tier rating`);
    if (!gpu.specs.price_usd)
      warnings.push(`GPU ${index} (${gpu.name}): Missing price`);

    if (
      gpu.specs.tier &&
      (gpu.specs.tier < 1 || gpu.specs.tier > 10)
    ) {
      errors.push(
        `GPU ${index} (${gpu.name}): Invalid tier ${gpu.specs.tier} (must be 1-10)`
      );
    }

    if (gpu.specs.vram_gb && gpu.specs.vram_gb > 128) {
      warnings.push(
        `GPU ${index} (${gpu.name}): Suspiciously high VRAM: ${gpu.specs.vram_gb}GB`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateCpu(cpu: any, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cpu.id) errors.push(`CPU ${index}: Missing id`);
  if (!cpu.name) errors.push(`CPU ${index}: Missing name`);
  if (!cpu.specs) errors.push(`CPU ${index}: Missing specs`);

  if (cpu.specs) {
    if (!cpu.specs.cores)
      warnings.push(`CPU ${index} (${cpu.name}): Missing core count`);
    if (!cpu.specs.threads)
      warnings.push(`CPU ${index} (${cpu.name}): Missing thread count`);
    if (!cpu.specs.tdp_w)
      warnings.push(`CPU ${index} (${cpu.name}): Missing TDP`);
    if (!cpu.specs.tier)
      warnings.push(`CPU ${index} (${cpu.name}): Missing tier rating`);
    if (!cpu.specs.price_usd)
      warnings.push(`CPU ${index} (${cpu.name}): Missing price`);

    if (
      cpu.specs.tier &&
      (cpu.specs.tier < 1 || cpu.specs.tier > 10)
    ) {
      errors.push(
        `CPU ${index} (${cpu.name}): Invalid tier ${cpu.specs.tier} (must be 1-10)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateDatabase() {
  // eslint-disable-next-line no-console
  console.log("🔍 Validating database...\n");

  let totalErrors = 0;
  let totalWarnings = 0;

  // GPUs
  // eslint-disable-next-line no-console
  console.log(`Validating ${gpus.length} GPUs...`);
  (gpus as any[]).forEach((gpu, i) => {
    const result = validateGpu(gpu, i);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    result.errors.forEach((err) => console.error(`❌ ${err}`));
    result.warnings.forEach((warn) => console.warn(`⚠️  ${warn}`));
  });

  // CPUs
  // eslint-disable-next-line no-console
  console.log(`\nValidating ${cpus.length} CPUs...`);
  (cpus as any[]).forEach((cpu, i) => {
    const result = validateCpu(cpu, i);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    result.errors.forEach((err) => console.error(`❌ ${err}`));
    result.warnings.forEach((warn) => console.warn(`⚠️  ${warn}`));
  });

  // eslint-disable-next-line no-console
  console.log("\n📊 Validation Summary:");
  // eslint-disable-next-line no-console
  console.log(`  Total Errors: ${totalErrors}`);
  // eslint-disable-next-line no-console
  console.log(`  Total Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    // eslint-disable-next-line no-console
    console.error("\n❌ Database validation FAILED");
    process.exit(1);
  } else {
    // eslint-disable-next-line no-console
    console.log("\n✅ Database validation PASSED");
  }
}

validateDatabase();

