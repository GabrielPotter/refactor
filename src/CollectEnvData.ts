import os from "os";

type CpuSummary = {
    model: string;
    speedMhz: number;
    times: {
        user: number;
        nice: number;
        sys: number;
        idle: number;
        irq: number;
    };
};

type NetworkInterfaceSummary = {
    name: string;
    address: string;
    family: string;
    mac: string;
    internal: boolean;
    netmask: string;
    cidr: string | null;
};

type MemoryUsageSnapshot = {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
};

export type EnvSnapshot = {
    timestamp: string;
    hostname: string;
    arch: string;
    platform: string;
    release: string;
    type: string;
    systemUptimeSeconds: number;
    loadAverages: number[];
    totalMemoryBytes: number;
    freeMemoryBytes: number;
    usedMemoryBytes: number;
    memoryUsage: MemoryUsageSnapshot;
    cpuCount: number;
    cpus: CpuSummary[];
    processInfo: {
        pid: number;
        nodeVersion: string;
        uptimeSeconds: number;
        cwd: string;
        argv: string[];
        execPath: string;
        versions: NodeJS.ProcessVersions;
    };
    userInfo: {
        username: string;
        homedir: string;
        shell: string;
    };
    networkInterfaces: NetworkInterfaceSummary[];
    envSummary: {
        totalVariables: number;
        keysSample: string[];
    };
};

const mapCpuInfo = (): CpuSummary[] => {
    const cores = os.cpus();
    return cores.map((core) => ({
        model: core.model,
        speedMhz: core.speed,
        times: {
            user: core.times.user,
            nice: core.times.nice,
            sys: core.times.sys,
            idle: core.times.idle,
            irq: core.times.irq,
        },
    }));
};

const mapNetworkInterfaces = (): NetworkInterfaceSummary[] => {
    const interfaces = os.networkInterfaces();
    const flattened: NetworkInterfaceSummary[] = [];
    for (const [name, entries] of Object.entries(interfaces)) {
        if (!entries) {
            continue;
        }
        for (const entry of entries) {
            flattened.push({
                name,
                address: entry.address,
                family: entry.family,
                mac: entry.mac,
                internal: entry.internal,
                netmask: entry.netmask,
                cidr: entry.cidr ?? null,
            });
        }
    }
    return flattened;
};

const collectProcessMemoryUsage = (): MemoryUsageSnapshot => {
    const { rss, heapTotal, heapUsed, external, arrayBuffers } = process.memoryUsage();
    return { rss, heapTotal, heapUsed, external, arrayBuffers };
};

export class CollectEnvData {
    private static instance: CollectEnvData | null = null;

    private constructor() {
        // Intentionally empty - singleton pattern.
    }

    public static getInstance(): CollectEnvData {
        if (CollectEnvData.instance === null) {
            CollectEnvData.instance = new CollectEnvData();
        }

        return CollectEnvData.instance;
    }

    public collect(): EnvSnapshot {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();

        let username = "";
        let homedir = "";
        let shell = "";
        try {
            const { username: sysUsername, homedir: sysHomedir, shell: sysShell } = os.userInfo();
            username = sysUsername;
            homedir = sysHomedir;
            shell = sysShell ?? "";
        } catch {
            username = process.env.USER ?? "";
            homedir = process.env.HOME ?? "";
            shell = process.env.SHELL ?? "";
        }

        const envKeys = Object.keys(process.env);

        return {
            timestamp: new Date().toISOString(),
            hostname: os.hostname(),
            arch: os.arch(),
            platform: os.platform(),
            release: os.release(),
            type: os.type(),
            systemUptimeSeconds: os.uptime(),
            loadAverages: os.loadavg(),
            totalMemoryBytes: totalMemory,
            freeMemoryBytes: freeMemory,
            usedMemoryBytes: totalMemory - freeMemory,
            memoryUsage: collectProcessMemoryUsage(),
            cpuCount: os.cpus().length,
            cpus: mapCpuInfo(),
            processInfo: {
                pid: process.pid,
                nodeVersion: process.version,
                uptimeSeconds: process.uptime(),
                cwd: process.cwd(),
                argv: process.argv,
                execPath: process.execPath,
                versions: { ...process.versions },
            },
            userInfo: {
                username,
                homedir,
                shell,
            },
            networkInterfaces: mapNetworkInterfaces(),
            envSummary: {
                totalVariables: envKeys.length,
                keysSample: envKeys.slice(0, 20),
            },
        };
    }
}

export const collectEnvData = () => CollectEnvData.getInstance().collect();
