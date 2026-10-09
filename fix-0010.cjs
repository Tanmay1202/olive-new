const fs = require('fs');
let content = fs.readFileSync('supabase/migrations/0010_support_paid_status_alias.sql', 'utf8');
content = content.replace(/^as \r?\nbegin/gm, 'as \nbegin');
content = content.replace(/^as \r?\ndeclare/gm, 'as \ndeclare');
content = content.replace(/^as body\r?\ndeclare/gm, 'as body\ndeclare');
content = content.replace(/^end;\r?\n;/gm, 'end;\n;');
content = content.replace(/^body;/gm, 'body;');
fs.writeFileSync('supabase/migrations/0010_support_paid_status_alias.sql', content, 'utf8');
