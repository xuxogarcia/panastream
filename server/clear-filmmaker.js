// Script to clear a specific filmmaker and all associated data
// Usage: node clear-filmmaker.js <slug>
const db = require('./config/database');
const slug = process.argv[2];

if (!slug) {
    console.error('Usage: node clear-filmmaker.js <filmmaker-slug>');
    process.exit(1);
}

db.serialize(() => {
    db.get('SELECT id, name FROM filmmakers WHERE slug = ?', [slug], (err, filmmaker) => {
        if (err) {
            console.error('Error:', err);
            process.exit(1);
        }
        
        if (!filmmaker) {
            console.log(`Filmmaker with slug "${slug}" not found.`);
            process.exit(0);
        }
        
        console.log(`Found filmmaker: ${filmmaker.name} (${filmmaker.id})`);
        console.log('Deleting associated data...');
        
        const filmmakerId = filmmaker.id;
        
        // Delete in order: media (has foreign keys), microsite, then filmmaker
        db.run('DELETE FROM media WHERE filmmaker_id = ?', [filmmakerId], function(err) {
            if (err) {
                console.error('Error deleting media:', err);
            } else {
                console.log(`Deleted ${this.changes} media items`);
            }
            
            db.run('DELETE FROM microsites WHERE filmmaker_id = ?', [filmmakerId], function(err) {
                if (err) {
                    console.error('Error deleting microsite:', err);
                } else {
                    console.log(`Deleted ${this.changes} microsite(s)`);
                }
                
                db.run('DELETE FROM filmmakers WHERE id = ?', [filmmakerId], function(err) {
                    if (err) {
                        console.error('Error deleting filmmaker:', err);
                        process.exit(1);
                    } else {
                        console.log(`Deleted filmmaker: ${filmmaker.name}`);
                        console.log('Cleanup complete!');
                        process.exit(0);
                    }
                });
            });
        });
    });
});

