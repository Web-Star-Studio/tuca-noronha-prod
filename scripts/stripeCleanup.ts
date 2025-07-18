#!/usr/bin/env tsx
/**
 * Script to validate and clean invalid Stripe price IDs
 * Usage: bunx tsx scripts/stripeCleanup.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { internal } from "../convex/_generated/api";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function validateStripePriceIds() {
  console.log("🚀 Starting Stripe price ID validation and cleanup...\n");

  const assetTypes = ["activity", "event", "restaurant", "accommodation", "vehicle"] as const;
  
  for (const assetType of assetTypes) {
    console.log(`\n📦 Validating ${assetType} assets...`);
    console.log("━".repeat(50));
    
    try {
      // First run in dry-run mode to see what would be cleaned
      console.log(`\n🔍 Running validation in DRY RUN mode for ${assetType}...`);
      const dryRunResult = await client.action(internal.domains.stripe.backfill.validateAndCleanStripePriceIds, {
        assetType,
        dryRun: true,
        limit: 1000,
      });

      console.log(`\n📊 Dry run results for ${assetType}:`);
      console.log(`   Total assets: ${dryRunResult.total}`);
      console.log(`   Checked: ${dryRunResult.checked}`);
      console.log(`   Invalid: ${dryRunResult.invalid}`);
      console.log(`   Would clean: ${dryRunResult.invalid}`);
      
      if (dryRunResult.errors.length > 0) {
        console.log(`\n⚠️  Errors found:`);
        dryRunResult.errors.forEach(error => {
          console.log(`   - ${error.assetName}: ${error.error}`);
        });
      }

      // If there are invalid IDs, ask for confirmation to clean
      if (dryRunResult.invalid > 0) {
        console.log(`\n❓ Found ${dryRunResult.invalid} invalid Stripe price IDs for ${assetType}.`);
        console.log(`   Would you like to clean them? (This will remove the invalid Stripe references)`);
        console.log(`   The assets will need to be re-synced with Stripe using the backfill script.`);
        
        // In a real script, you would prompt for user confirmation here
        // For now, we'll just show what would happen
        console.log(`\n💡 To clean these invalid IDs, run:`);
        console.log(`   bunx tsx scripts/stripeCleanup.ts --clean --type=${assetType}`);
      }
      
    } catch (error) {
      console.error(`\n❌ Error validating ${assetType}:`, error);
    }
  }
  
  console.log("\n✅ Validation complete!");
}

async function cleanInvalidPriceIds(assetType: string) {
  console.log(`\n🧹 Cleaning invalid Stripe price IDs for ${assetType}...`);
  
  try {
    const result = await client.action(internal.domains.stripe.backfill.validateAndCleanStripePriceIds, {
      assetType: assetType as any,
      dryRun: false,
      limit: 1000,
    });

    console.log(`\n✅ Cleanup results for ${assetType}:`);
    console.log(`   Total assets: ${result.total}`);
    console.log(`   Checked: ${result.checked}`);
    console.log(`   Invalid found: ${result.invalid}`);
    console.log(`   Cleaned: ${result.cleaned}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors during cleanup:`);
      result.errors.forEach(error => {
        console.log(`   - ${error.assetName}: ${error.error}`);
      });
    }
    
    if (result.cleaned > 0) {
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Run the backfill script to re-create Stripe products for cleaned assets:`);
      console.log(`      bunx tsx scripts/stripeBackfill.ts --type=${assetType}`);
      console.log(`   2. Verify the assets have valid Stripe info after backfill`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error cleaning ${assetType}:`, error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes("--clean");
  const typeArg = args.find(arg => arg.startsWith("--type="));
  const assetType = typeArg ? typeArg.split("=")[1] : null;
  
  if (shouldClean && assetType) {
    // Clean specific asset type
    await cleanInvalidPriceIds(assetType);
  } else if (shouldClean && !assetType) {
    console.error("❌ Please specify asset type with --type=<activity|event|restaurant|accommodation|vehicle>");
    process.exit(1);
  } else {
    // Default: validate all asset types
    await validateStripePriceIds();
  }
}

main().catch(console.error); 