import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkHardware() {
  const start = Date.now();
  let ramTotal = 0, ramUsed = 0, ramFree = 0;
  let cpuUsage = 0;
  let diskFree = 0, diskTotal = 0;

  try {
    // Windows RAM info via wmic
    const { stdout: ramOut } = await execAsync(
      `wmic ComputerSystem get TotalPhysicalMemory /value && wmic OS get FreePhysicalMemory /value`,
      { timeout: 5000 }
    );
    const totalMatch = ramOut.match(/TotalPhysicalMemory=(\d+)/);
    const freeMatch = ramOut.match(/FreePhysicalMemory=(\d+)/);
    if (totalMatch) ramTotal = Math.round(parseInt(totalMatch[1], 10) / (1024 * 1024));
    if (freeMatch) {
      ramFree = Math.round(parseInt(freeMatch[1], 10) / 1024);
      ramUsed = ramTotal - ramFree;
    }
  } catch (e) {
    // Fallback: try powershell
    try {
      const { stdout } = await execAsync(
        `powershell -Command "(Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1MB"`,
        { timeout: 5000 }
      );
      ramTotal = Math.round(parseFloat(stdout.trim()));
    } catch (e2) {}
  }

  try {
    // Windows CPU usage
    const { stdout: cpuOut } = await execAsync(
      `wmic cpu get loadpercentage /value`,
      { timeout: 5000 }
    );
    const cpuMatch = cpuOut.match(/LoadPercentage=(\d+)/);
    if (cpuMatch) cpuUsage = parseInt(cpuMatch[1], 10);
  } catch (e) {
    try {
      const { stdout } = await execAsync(
        `powershell -Command "(Get-Counter '\\Processor(_Total)\\% Processor Time').CounterSamples.CookedValue"`,
        { timeout: 5000 }
      );
      cpuUsage = Math.round(parseFloat(stdout.trim()));
    } catch (e2) {}
  }

  try {
    // Windows disk free on C:
    const { stdout: diskOut } = await execAsync(
      `wmic logicaldisk where "DeviceID='C:'" get FreeSpace,Size /value`,
      { timeout: 5000 }
    );
    const freeMatch = diskOut.match(/FreeSpace=(\d+)/);
    const sizeMatch = diskOut.match(/Size=(\d+)/);
    if (freeMatch) diskFree = Math.round(parseInt(freeMatch[1], 10) / (1024 * 1024 * 1024));
    if (sizeMatch) diskTotal = Math.round(parseInt(sizeMatch[1], 10) / (1024 * 1024 * 1024));
  } catch (e) {
    try {
      const { stdout } = await execAsync(
        `powershell -Command "(Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\").FreeSpace / 1GB"`,
        { timeout: 5000 }
      );
      diskFree = Math.round(parseFloat(stdout.trim()));
    } catch (e2) {}
  }

  const ramPercent = ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0;
  const diskPercent = diskTotal > 0 ? Math.round(((diskTotal - diskFree) / diskTotal) * 100) : 0;

  // Determine hardware profile and recommended workers
  let profile = 'low_end';
  let recommendedWorkers = 1;
  if (ramTotal >= 16 && cpuUsage < 50) {
    profile = 'high_end';
    recommendedWorkers = 4;
  } else if (ramTotal >= 8 && cpuUsage < 70) {
    profile = 'medium';
    recommendedWorkers = 2;
  }

  const status = ramPercent < 85 && cpuUsage < 90 && diskPercent < 90 ? 'PASS' : 'FAIL';

  return {
    status,
    profile,
    recommended_workers: recommendedWorkers,
    ram: {
      total_mb: ramTotal,
      used_mb: ramUsed,
      free_mb: ramFree,
      percent_used: ramPercent
    },
    cpu: {
      percent_used: cpuUsage
    },
    disk: {
      total_gb: diskTotal,
      free_gb: diskFree,
      percent_used: diskPercent
    },
    latency_ms: Date.now() - start
  };
}

export { checkHardware };
