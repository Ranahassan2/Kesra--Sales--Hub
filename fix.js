const fs = require('fs');
const path = require('path');
function walkSync(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        filelist = walkSync(path.join(dir, file), filelist);
      }
    }
    else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
}

let files = walkSync(path.join(__dirname, 'src'), []);
files.push(path.join(__dirname, 'prisma/seed.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const enums = {
    Role: ['ADMIN', 'HEAD_OF_SALES', 'TELE_SALES', 'SALES'],
    LeadStatus: ['NEW', 'CONTACTED', 'NO_ANSWER', 'NEEDS_FOLLOWUP', 'INTERESTED', 'NOT_INTERESTED', 'HOT', 'GOLD', 'MEETING_SCHEDULED', 'TRANSFERRED_TO_SALES', 'CLOSED_WON', 'CLOSED_LOST'],
    LeadTier: ['LEAD', 'HOT', 'GOLD'],
    MeetingStatus: ['SCHEDULED', 'DONE', 'POSTPONED', 'CANCELLED'],
    LeadSource: ['EXCEL_UPLOAD', 'MANUAL'],
    ActivityType: ['STATUS_CHANGE', 'FOLLOWUP_CREATED', 'FOLLOWUP_COMPLETED', 'MEETING_SCHEDULED', 'MEETING_UPDATED', 'TRANSFERRED', 'NOTE', 'LEAD_CREATED', 'LEAD_ASSIGNED']
  };

  for (const [enumName, values] of Object.entries(enums)) {
    values.forEach(val => {
      let regex = new RegExp('\\.\\s*' + val + '\\b', 'g');
      if (regex.test(content)) {
        content = content.replace(regex, enumName + '.' + val);
        changed = true;
      }
    });
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
