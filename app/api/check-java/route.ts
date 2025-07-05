import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function GET() {
  try {
    await execAsync("java -version");
    return NextResponse.json({ installed: true });
  } catch {
    return NextResponse.json({ installed: false });
  }
}
