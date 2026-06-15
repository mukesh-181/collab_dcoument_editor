const fs = require('fs');

const files = [
  'src/features/dashboard/components/page/document-card.tsx',
  'src/features/dashboard/components/page/dashboard-header.tsx',
  'src/features/dashboard/components/layout/sidebar-content.tsx',
  'src/features/invites/components/invite-page.tsx',
  'src/features/invites/components/user-search-input.tsx',
  'src/features/inbox/components/inbox-item.tsx',
  'src/features/document/components/page/active-users-cluster.tsx',
  'src/features/document/components/page/document-members-popover.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Ensure import
  if (content.includes('<AvatarFallback') && !content.includes('getInitials')) {
     const importStatement = `import { getInitials } from "@/utils/string-utils";\n`;
     // Insert after last import
     const lines = content.split('\n');
     let lastImport = -1;
     for (let i = 0; i < lines.length; i++) {
       if (lines[i].startsWith('import ')) lastImport = i;
     }
     if (lastImport !== -1) {
       lines.splice(lastImport + 1, 0, importStatement);
     } else {
       lines.unshift(importStatement);
     }
     content = lines.join('\n');
  }

  // Common patterns to replace inside AvatarFallback
  // Pattern 1: {(user.name || user.email || "?").charAt(0).toUpperCase()}
  content = content.replace(/\{\((.*?)\.name \|\| (.*?)\.email \|\|.*?\)\.charAt\(0\)\.toUpperCase\(\)\}/g, '{getInitials($1.name, $2.email)}');
  
  // Pattern 2: {inviterName.charAt(0).toUpperCase()}
  // Wait, in inbox-item.tsx: {inviterName.charAt(0).toUpperCase()} -> we have inviterName and inviterEmail
  content = content.replace(/\{inviterName\.charAt\(0\)\.toUpperCase\(\)\}/g, '{getInitials(inviterName, inviterEmail)}');

  // Pattern 3: {user.name?.[0]?.toUpperCase()}
  content = content.replace(/\{(.*?)\.name\?\.\[0\]\?\.toUpperCase\(\) \|\| \'?.\'?\}/g, '{getInitials($1.name, $1.email)}');
  
  // Pattern 4: {member.user.name?.charAt(0).toUpperCase() || member.user.email?.charAt(0).toUpperCase() || "?"}
  content = content.replace(/\{(.*?)\.name\?\.charAt\(0\)\.toUpperCase\(\) \|\| (.*?)\.email\?\.charAt\(0\)\.toUpperCase\(\) \|\| "\?"\}/g, '{getInitials($1.name, $1.email)}');

  // Pattern 5: {(member.user.name || member.user.email || "?").charAt(0).toUpperCase()}
  content = content.replace(/\{\((.*?)\.name \|\| (.*?)\.email \|\|.*?\)\.charAt\(0\)\.toUpperCase\(\)\}/g, '{getInitials($1.name, $1.email)}');
  
  // Let's also do generic match for AvatarFallback contents
  // We'll replace the content manually if we missed any
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
}
