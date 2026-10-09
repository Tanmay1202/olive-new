const fs = require('fs');
let content = fs.readFileSync('supabase/migrations/0010_support_paid_status_alias.sql');
if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
  content = content.slice(3);
  fs.writeFileSync('supabase/migrations/0010_support_paid_status_alias.sql', content);
}
