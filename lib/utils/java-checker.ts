export async function checkJavaInstallation(): Promise<boolean> {
  try {
    const res = await fetch("/api/check-java");
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.installed;
  } catch {
    return false;
  }
}
