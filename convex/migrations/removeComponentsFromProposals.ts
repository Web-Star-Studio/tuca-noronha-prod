import { internalMutation } from "../_generated/server";

/**
 * Temporary migration to remove components, inclusions, and exclusions fields
 * from existing packageProposals
 */
export const removeComponentsFields = internalMutation({
  handler: async (ctx) => {
    const proposals = await ctx.db.query("packageProposals").collect();
    
    let updated = 0;
    for (const proposal of proposals) {
      const doc = proposal as any;
      
      // Check if document has the old fields
      if (doc.components !== undefined || doc.inclusions !== undefined || doc.exclusions !== undefined) {
        // Create update object without those fields
        const cleanDoc: any = {};
        
        // Copy all fields except the ones we want to remove
        for (const [key, value] of Object.entries(doc)) {
          if (key !== 'components' && key !== 'inclusions' && key !== 'exclusions' && key !== '_id' && key !== '_creationTime') {
            cleanDoc[key] = value;
          }
        }
        
        // Use replace to update the document
        await ctx.db.replace(proposal._id, cleanDoc);
        updated++;
      }
    }
    
    console.log(`Migration complete. Updated ${updated} proposals.`);
    return { success: true, updatedCount: updated };
  },
});
