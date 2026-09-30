const fs = require('fs');
const path = require('path');

const prismaFile = path.join(__dirname, 'prisma/schema.prisma');
let schema = fs.readFileSync(prismaFile, 'utf8');

schema = schema.replace(/provider = "postgresql"/, 'provider = "sqlite"');

schema = schema.replace(/role\s+Role/g, 'role String');
schema = schema.replace(/currentStage\s+Role/g, 'currentStage String');
schema = schema.replace(/status\s+LeadStatus/g, 'status String');
schema = schema.replace(/tier\s+LeadTier/g, 'tier String');
schema = schema.replace(/source\s+LeadSource/g, 'source String');
schema = schema.replace(/status\s+MeetingStatus/g, 'status String');
schema = schema.replace(/type\s+ActivityType/g, 'type String');

schema = schema.replace(/@default\(NEW\)/g, '@default("NEW")');
schema = schema.replace(/@default\(LEAD\)/g, '@default("LEAD")');
schema = schema.replace(/@default\(MANUAL\)/g, '@default("MANUAL")');
schema = schema.replace(/@default\(TELE_SALES\)/g, '@default("TELE_SALES")');
schema = schema.replace(/@default\(SCHEDULED\)/g, '@default("SCHEDULED")');

schema = schema.replace(/enum Role \{[\s\S]*?\}/, '');
schema = schema.replace(/enum LeadStatus \{[\s\S]*?\}/, '');
schema = schema.replace(/enum LeadTier \{[\s\S]*?\}/, '');
schema = schema.replace(/enum MeetingStatus \{[\s\S]*?\}/, '');
schema = schema.replace(/enum LeadSource \{[\s\S]*?\}/, '');
schema = schema.replace(/enum ActivityType \{[\s\S]*?\}/, '');

fs.writeFileSync(prismaFile, schema);

const enumsTs = `export enum Role {
  ADMIN = "ADMIN",
  HEAD_OF_SALES = "HEAD_OF_SALES",
  TELE_SALES = "TELE_SALES",
  SALES = "SALES"
}
export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  NO_ANSWER = "NO_ANSWER",
  NEEDS_FOLLOWUP = "NEEDS_FOLLOWUP",
  INTERESTED = "INTERESTED",
  NOT_INTERESTED = "NOT_INTERESTED",
  HOT = "HOT",
  GOLD = "GOLD",
  MEETING_SCHEDULED = "MEETING_SCHEDULED",
  TRANSFERRED_TO_SALES = "TRANSFERRED_TO_SALES",
  CLOSED_WON = "CLOSED_WON",
  CLOSED_LOST = "CLOSED_LOST"
}
export enum LeadTier {
  LEAD = "LEAD",
  HOT = "HOT",
  GOLD = "GOLD"
}
export enum MeetingStatus {
  SCHEDULED = "SCHEDULED",
  DONE = "DONE",
  POSTPONED = "POSTPONED",
  CANCELLED = "CANCELLED"
}
export enum LeadSource {
  EXCEL_UPLOAD = "EXCEL_UPLOAD",
  MANUAL = "MANUAL"
}
export enum ActivityType {
  STATUS_CHANGE = "STATUS_CHANGE",
  FOLLOWUP_CREATED = "FOLLOWUP_CREATED",
  FOLLOWUP_COMPLETED = "FOLLOWUP_COMPLETED",
  MEETING_SCHEDULED = "MEETING_SCHEDULED",
  MEETING_UPDATED = "MEETING_UPDATED",
  TRANSFERRED = "TRANSFERRED",
  NOTE = "NOTE",
  LEAD_CREATED = "LEAD_CREATED",
  LEAD_ASSIGNED = "LEAD_ASSIGNED"
}
`;
fs.writeFileSync(path.join(__dirname, 'src/lib/enums.ts'), enumsTs);

function walkSync(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
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
  if (content.includes('@prisma/client')) {
    const enums = ['Role', 'LeadStatus', 'LeadTier', 'MeetingStatus', 'LeadSource', 'ActivityType'];
    let usedEnums = enums.filter(e => content.includes(e));
    if (usedEnums.length > 0) {
      usedEnums.forEach(e => {
        let regex = new RegExp('\\b' + e + '\\b\\s*,?', 'g');
        content = content.replace(regex, '');
      });
      content = content.replace(/import\s*\{\s*\}\s*from\s*['"]@prisma\/client['"];?/g, '');
      
      let importPath = "@/lib/enums";
      if (file.includes('prisma/seed.ts')) {
        importPath = "../src/lib/enums";
      }
      content = 'import { ' + usedEnums.join(', ') + ' } from "' + importPath + '";\n' + content;
      fs.writeFileSync(file, content);
    }
  }
});
console.log('Migration to SQLite and Enums extraction completed.');
