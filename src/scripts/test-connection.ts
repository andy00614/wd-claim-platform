import postgres from "postgres";

async function testConnection() {
  try {
    console.log("Testing Supabase connection...");

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL not found in environment variables");
      return;
    }

    console.log(
      "Using DATABASE_URL:",
      process.env.DATABASE_URL.replace(/:([^:@]{8})[^:@]*@/, ":$1***@"),
    );

    const client = postgres(process.env.DATABASE_URL, { prepare: false });

    const result = await client`SELECT 1 as test`;

    console.log("✅ Connection successful!");
    console.log("Result:", result);

    await client.end();
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testConnection();
