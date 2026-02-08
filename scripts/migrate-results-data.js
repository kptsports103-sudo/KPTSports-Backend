/**
 * ⚠️ LOCAL-ONLY MIGRATION SCRIPT
 *
 * Purpose:
 *  - One-time migration to clean data for new schema
 *  - Generate playerId for all players
 *  - Backfill firstParticipationYear and baseDiplomaYear
 *  - Ensure all results have playerId and diplomaYear
 *  - Populate memberIds and member diplomaYears in group results
 *
 * How to run:
 *  - Start backend locally
 *  - Run: node scripts/migrate-results-data.js
 *
 * ❌ DO NOT:
 *  - Import this file anywhere
 *  - Run during deployment
 *  - Run on Vercel / serverless
 *
 * ✅ This script is for MANUAL execution only.
 */

const mongoose = require('mongoose');
const Player = require('../src/models/player.model');
const Result = require('../src/models/result.model');
const GroupResult = require('../src/models/groupResult.model');

// MongoDB connection string (uses cloud URI if available)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kptwebsite103:kptwebsite103@kpt.syjmrn1.mongodb.net/';

// Helper function to normalize names
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Generate unique playerId
function generatePlayerId() {
  return 'P' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

async function runMigration() {
  try {
    console.log('🔄 Starting migration...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ==========================================
    // STEP 1: Update Players - Add firstParticipationYear and baseDiplomaYear
    // ==========================================
    console.log('\n📋 STEP 1: Updating Players...');
    
    const players = await Player.find({});
    let updatedPlayers = 0;
    
    for (const player of players) {
      let needsUpdate = false;
      
      // Generate playerId if missing
      if (!player.playerId) {
        player.playerId = generatePlayerId();
        needsUpdate = true;
        console.log(`   🎯 Generated playerId for: ${player.name}`);
      }
      
      // Set firstParticipationYear if missing
      if (!player.firstParticipationYear) {
        // Use the 'year' field (participation year) as firstParticipationYear
        if (player.year) {
          player.firstParticipationYear = Number(player.year);
          needsUpdate = true;
        }
      }
      
      // Set baseDiplomaYear if missing
      if (!player.baseDiplomaYear) {
        // Convert diplomaYear to number (it might be string)
        if (player.diplomaYear) {
          const dy = Number(player.diplomaYear);
          if (dy >= 1 && dy <= 3) {
            player.baseDiplomaYear = dy;
            needsUpdate = true;
          }
        }
        
        // If still missing, calculate from year
        if (!player.baseDiplomaYear && player.year) {
          // Assume 1st year if we can't determine
          player.baseDiplomaYear = 1;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await player.save();
        updatedPlayers++;
        console.log(`   ✅ Updated player: ${player.name} (${player.playerId})`);
      }
    }
    
    console.log(`   📊 Players updated: ${updatedPlayers}/${players.length}`);

    // ==========================================
    // STEP 2: Create player lookup map
    // ==========================================
    console.log('\n📋 STEP 2: Building player lookup...');
    
    const playerMap = {};
    for (const player of players) {
      if (player.playerId) {
        // Map by playerId
        playerMap[player.playerId] = player;
        // Also map by normalized name for legacy matching
        playerMap[normalizeName(player.name)] = player;
      }
    }
    
    console.log(`   📊 Built lookup with ${Object.keys(playerMap).length} entries`);

    // ==========================================
    // STEP 3: Migrate Individual Results
    // ==========================================
    console.log('\n📋 STEP 3: Migrating Individual Results...');
    
    // Find results missing playerId or diplomaYear
    const results = await Result.find({
      $or: [
        { playerId: { $exists: false } },
        { playerId: null },
        { playerId: '' },
        { diplomaYear: { $exists: false } },
        { diplomaYear: null },
        { diplomaYear: '' }
      ]
    });
    
    console.log(`   Found ${results.length} results needing migration`);
    
    let updatedResults = 0;
    for (const result of results) {
      let needsUpdate = false;
      
      // Try to find player by existing playerId first
      let player = result.playerId ? playerMap[result.playerId] : null;
      
      // If no playerId or not found, try by name
      if (!player && result.name) {
        player = playerMap[normalizeName(result.name)];
      }
      
      if (player) {
        // Set playerId
        if (!result.playerId) {
          result.playerId = player.playerId;
          needsUpdate = true;
        }
        
        // Set name (denormalized)
        if (result.name !== player.name) {
          result.name = player.name;
          needsUpdate = true;
        }
        
        // Set diplomaYear using the formula:
        // diplomaYear = baseDiplomaYear + (resultYear - baseYear)
        if (!result.diplomaYear && player.baseDiplomaYear && player.firstParticipationYear) {
          const resultYear = Number(result.year);
          if (!isNaN(resultYear)) {
            const calculatedYear = player.baseDiplomaYear + (resultYear - player.firstParticipationYear);
            if (calculatedYear >= 1 && calculatedYear <= 3) {
              result.diplomaYear = calculatedYear;
              needsUpdate = true;
            }
          }
        }
        
        // If still missing, default to player's baseDiplomaYear
        if (!result.diplomaYear && player.baseDiplomaYear) {
          result.diplomaYear = player.baseDiplomaYear;
          needsUpdate = true;
        }
      } else {
        console.log(`   ⚠️  No player found for result: ${result.name || 'unknown'}`);
      }
      
      if (needsUpdate) {
        await result.save();
        updatedResults++;
        console.log(`   ✅ Updated result: ${result.name} (${result.year}) - diplomaYear: ${result.diplomaYear}`);
      }
    }
    
    console.log(`   📊 Results updated: ${updatedResults}`);

    // ==========================================
    // STEP 4: Migrate Group Results
    // ==========================================
    console.log('\n📋 STEP 4: Migrating Group Results...');
    
    // Find group results that need member migration
    const groupResults = await GroupResult.find({
      $or: [
        { 'members': { $exists: false } },
        { 'members': null },
        { 'members': { $size: 0 } },
        { 'memberIds': { $exists: false } },
        { 'memberIds': null },
        { 'memberIds': { $size: 0 } }
      ]
    });
    
    // Also find group results with legacy string array format
    const legacyGroups = await GroupResult.find({
      members: { $type: 'array' }
    }).where('members.0').exists('$type', 'string');
    
    console.log(`   Found ${groupResults.length + legacyGroups.length} group results needing migration`);
    
    let updatedGroups = 0;
    
    // Process groups with missing members
    for (const group of groupResults) {
      const newMembers = [];
      let needsUpdate = false;
      
      if (group.memberIds && group.memberIds.length > 0) {
        // Build members array from memberIds
        for (const memberId of group.memberIds) {
          const player = playerMap[memberId];
          if (player) {
            newMembers.push({
              playerId: player.playerId,
              name: player.name,
              diplomaYear: player.baseDiplomaYear || 1
            });
          }
        }
        
        if (newMembers.length > 0) {
          group.members = newMembers;
          needsUpdate = true;
          console.log(`   ✅ Updated group: ${group.teamName} with ${newMembers.length} members`);
        }
      }
      
      if (needsUpdate) {
        await group.save();
        updatedGroups++;
      }
    }
    
    // Process legacy groups with string members array
    for (const group of legacyGroups) {
      const newMembers = [];
      let needsUpdate = false;
      
      if (Array.isArray(group.members) && group.members.length > 0) {
        // Check if first element is string (legacy format)
        if (typeof group.members[0] === 'string') {
          for (const memberName of group.members) {
            const player = playerMap[normalizeName(memberName)];
            if (player) {
              // Calculate diplomaYear for this member
              let memberDiplomaYear = player.baseDiplomaYear || 1;
              if (player.firstParticipationYear) {
                const resultYear = Number(group.year);
                if (!isNaN(resultYear)) {
                  const calculated = player.baseDiplomaYear + (resultYear - player.firstParticipationYear);
                  if (calculated >= 1 && calculated <= 3) {
                    memberDiplomaYear = calculated;
                  }
                }
              }
              
              newMembers.push({
                playerId: player.playerId,
                name: player.name,
                diplomaYear: memberDiplomaYear
              });
            } else {
              console.log(`   ⚠️  No player found for group member: ${memberName}`);
              // Keep legacy name as fallback
              newMembers.push({
                playerId: null,
                name: memberName,
                diplomaYear: 1 // Default
              });
            }
          }
          
          if (newMembers.length > 0) {
            group.members = newMembers;
            // Also update memberIds
            group.memberIds = newMembers.filter(m => m.playerId).map(m => m.playerId);
            needsUpdate = true;
            console.log(`   ✅ Migrated legacy group: ${group.teamName} with ${newMembers.length} members`);
          }
        }
      }
      
      if (needsUpdate) {
        await group.save();
        updatedGroups++;
      }
    }
    
    console.log(`   📊 Group results updated: ${updatedGroups}`);

    // ==========================================
    // STEP 5: Final Summary
    // ==========================================
    console.log('\n🎉 Migration complete!');
    console.log(`   Players updated: ${updatedPlayers}`);
    console.log(`   Results updated: ${updatedResults}`);
    console.log(`   Group results updated: ${updatedGroups}`);
    
    // Verify counts
    const finalPlayers = await Player.countDocuments();
    const finalResults = await Result.countDocuments();
    const finalGroups = await GroupResult.countDocuments();
    
    console.log('\n📊 Final database state:');
    console.log(`   Players: ${finalPlayers}`);
    console.log(`   Results: ${finalResults}`);
    console.log(`   Group Results: ${finalGroups}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
