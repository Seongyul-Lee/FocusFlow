const fs = require('fs');
const path = require('path');

const oldTasksPath = path.join(__dirname, 'tasks.old.json');
const newTasksPath = path.join(__dirname, 'tasks.json');

// Read both files
const oldData = JSON.parse(fs.readFileSync(oldTasksPath, 'utf8'));
const newData = JSON.parse(fs.readFileSync(newTasksPath, 'utf8'));

// Extract tasks 12-19 from old file
const oldTasks = oldData.master.tasks.filter(task => {
  const id = parseInt(task.id);
  return id >= 12 && id <= 19;
});

console.log(`Found ${oldTasks.length} tasks (12-19) in old file`);
oldTasks.forEach(task => {
  console.log(`  Task ${task.id}: ${task.title} (${task.status})`);
});

// Merge: old tasks (12-19) + new tasks (20-32)
const mergedTasks = [...oldTasks, ...newData.master.tasks];

// Sort by id
mergedTasks.sort((a, b) => parseInt(a.id) - parseInt(b.id));

// Update new data
newData.master.tasks = mergedTasks;

// Write merged result
fs.writeFileSync(newTasksPath, JSON.stringify(newData, null, 2), 'utf8');

console.log(`\nMerged ${mergedTasks.length} total tasks into tasks.json`);
console.log(`Tasks 12-19: ${oldTasks.length} (restored from git)`);
console.log(`Tasks 20-32: ${newData.master.tasks.length - oldTasks.length} (new from PRD)`);
