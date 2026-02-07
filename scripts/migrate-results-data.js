/**
 * ⚠️ LOCAL-ONLY MIGRATION SCRIPT
 *
 * Purpose:
 *  - One-time migration to populate:
 *    - playerId
 *    - diplomaYear
 *    - memberIds (group results)
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
const axios = require('axios');
const Result = require('../src/models/result.model');
const GroupResult = require('../src/models/groupResult.model');

// MongoDB connection string (uses cloud URI if available)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kptwebsite103:kptwebsite103@kpt.syjmrn1.mongodb.net/';

// Helper function to normalize names
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper to get all players from frontend API
async function getAllPlayers() {
  try {
    const response = await axios.get('http://localhost:5173/api/players');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch players:', error.message);
    return [];
  }
}

// Helper to find player by name (fuzzy matching)
function findPlayerByName(players, targetName) {
  const normalizedTarget = normalizeName(targetName);
  
  // Exact match
  let match = players.find(p => normalizeName(p.name) === normalizedTarget);
  if (match) return match;
  
  // Partial match (target contains player name OR player name contains target)
  match = players.find(p => 
    normalizedTarget.includes(normalizeName(p.name)) || 
    normalizeName(p.name).includes(normalizedTarget)
  );
  if (match) return match;
  
  return null;
}

async function runMigration() {
  try {
    console.log('🔄 Starting migration...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all players for lookup
    const players = await getAllPlayers();
    console.log(`📋 Fetched ${players.length} players`);

    // Create player lookup map by normalized name
    const playerMap = {};
    players.forEach(p => {
      playerMap[normalizeName(p.name)] = p;
    });

    // Migrate individual results
    const results = await Result.find({ 
      $or: [
        { playerId: { $exists: false } },
        { playerId: null },
        { diplomaYear: { $exists: false } }
      ]
    });
    console.log(`🎯 Found ${results.length} individual results needing migration`);

    let updatedResults = 0;
    for (const result of results) {
      const player = findPlayerByName(players, result.name);
      
      if (player) {
        result.playerId = player.id;
        
        // Map event year to diploma year
        const resultYear = parseInt(result.year);
        if (!isNaN(resultYear)) {
          // Diploma years: 1, 2, 3 based on academic year
          // Academic year 2024-2025: 1st year students are 1st year
          // Simple logic: result year - admission year + 1
          if (player.admissionYear && resultYear >= player.admissionYear) {
            result.diplomaYear = resultYear - player.admissionYear + 1;
          }
        }
        
        // Ensure diplomaYear is valid (1, 2, or 3)
        if (!result.diplomaYear || result.diplomaYear < 1 || result.diplomaYear > 3) {
          result.diplomaYear = 2; // Default to 2nd year if can't determine
        }
        
        await result.save();
        updatedResults++;
        console.log(`   ✅ Updated: ${result.name} (${result.year}) -> playerId: ${player.id}, diplomaYear: ${result.diplomaYear}`);
      } else {
        console.log(`   ❌ No player found for: ${result.name}`);
      }
    }

    // Migrate group results - populate missing memberIds
    const groupResults = await GroupResult.find({
      $or: [
        { memberIds: { $exists: false } },
        { memberIds: null },
        { memberIds: { $size: 0 } }
      ]
    });
    console.log(`👥 Found ${groupResults.length} group results needing migration`);

    let updatedGroups = 0;
    for (const groupResult of groupResults) {
      const memberIds = [];
      
      for (const memberName of groupResult.members) {
        const player = findPlayerByName(players, memberName);
        if (player) {
          memberIds.push(player.id);
        } else {
          console.log(`   ❌ No player found for group member: ${memberName}`);
        }
      }
      
      if (memberIds.length > 0) {
        groupResult.memberIds = memberIds;
        await groupResult.save();
        updatedGroups++;
        console.log(`   ✅ Updated group: ${groupResult.event} with ${memberIds.length} members`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`   Individual results updated: ${updatedResults}`);
    console.log(`   Group results updated: ${updatedGroups}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
