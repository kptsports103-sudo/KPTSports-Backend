/**
 * Migration Script: Populate playerId and diplomaYear for existing results
 * 
 * Run: node migrate-results-data.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
const Result = require('./src/models/result.model');
const GroupResult = require('./src/models/groupResult.model');

// MongoDB connection string (uses cloud URI if available)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kptwebsite103:kptwebsite103@kpt.syjmrn1.mongodb.net/';

// Helper function to normalize names
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function migrateResults() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fetch players data from API (uses backend port from env or default 4000)
    const API_PORT = process.env.API_PORT || 4000;
    const playersRes = await axios.get('http://localhost:' + API_PORT + '/api/v1/home/players');
    const playersGrouped = playersRes.data || {};
    
    // Build player lookup by name (normalized)
    const playersByName = {};
    Object.keys(playersGrouped).forEach(year => {
      playersGrouped[year].forEach(player => {
        const nameKey = normalizeName(player.name);
        playersByName[nameKey] = {
          id: player.id || player.playerId,
          diplomaYear: player.diplomaYear || 2
        };
      });
    });

    console.log('Loaded ' + Object.keys(playersByName).length + ' players');

    // Migrate individual results
    const results = await Result.find({});
    console.log('Found ' + results.length + ' individual results');
    
    let updatedCount = 0;
    for (const result of results) {
      let needsUpdate = false;
      
      if (!result.playerId) {
        const nameKey = normalizeName(result.name);
        const player = playersByName[nameKey];
        if (player) {
          result.playerId = player.id;
          needsUpdate = true;
          console.log('  Matched: ' + result.name + ' -> ID: ' + player.id);
        } else {
          console.log('  No match for: ' + result.name);
        }
      }
      
      if (!result.diplomaYear) {
        const nameKey = normalizeName(result.name);
        const player = playersByName[nameKey];
        if (player) {
          result.diplomaYear = player.diplomaYear;
          needsUpdate = true;
          console.log('  Set diplomaYear for ' + result.name + ': ' + player.diplomaYear);
        }
      }
      
      if (needsUpdate) {
        await result.save();
        updatedCount++;
      }
    }
    
    console.log('Updated ' + updatedCount + ' individual results');

    // Migrate group results
    const groupResults = await GroupResult.find({});
    console.log('Found ' + groupResults.length + ' group results');
    
    updatedCount = 0;
    for (const group of groupResults) {
      let needsUpdate = false;
      
      if (!group.memberIds || group.memberIds.length === 0) {
        const memberIds = [];
        for (const memberName of group.members) {
          const nameKey = normalizeName(memberName);
          const player = playersByName[nameKey];
          if (player) {
            memberIds.push(player.id);
            console.log('  Matched member: ' + memberName + ' -> ID: ' + player.id);
          } else {
            console.log('  No match for member: ' + memberName);
          }
        }
        
        if (memberIds.length > 0) {
          group.memberIds = memberIds;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await group.save();
        updatedCount++;
      }
    }
    
    console.log('Updated ' + updatedCount + ' group results');
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateResults();
