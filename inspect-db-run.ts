import * as dotenv from 'dotenv';
dotenv.config();

async function inspect() {
    try {
        const { getDatabaseSchema } = await import('./src/lib/db-introspection');
        const schema = await getDatabaseSchema();
        console.log(JSON.stringify(schema, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

inspect();
