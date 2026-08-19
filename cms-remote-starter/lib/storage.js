"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const FILE_MODE = 0o640;

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function safeName(value, fallback = "snapshot") {
    return String(value || fallback)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 56) || fallback;
}

function stamp() {
    return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function parseJsonLine(line) {
    try {
        return JSON.parse(line);
    } catch {
        return null;
    }
}

class WxmFileStore {
    constructor({ dataDir, publicDir }) {
        this.dataDir = path.resolve(dataDir);
        this.publicDir = path.resolve(publicDir);
        this.paths = {
            currentFile: path.join(this.dataDir, "current", "wxm-cms.json"),
            revisionDir: path.join(this.dataDir, "revisions"),
            analyticsDir: path.join(this.dataDir, "analytics"),
            auditDir: path.join(this.dataDir, "audit"),
            auditFile: path.join(this.dataDir, "audit", "admin.ndjson"),
            manifestFile: path.join(this.dataDir, "storage-manifest.json"),
            snapshotDir: path.join(this.dataDir, "snapshots"),
            backupDir: path.join(this.dataDir, "backups"),
            uploadDir: path.join(this.publicDir, "uploads")
        };
        this.ensure();
    }

    ensure() {
        [
            path.dirname(this.paths.currentFile),
            this.paths.revisionDir,
            this.paths.analyticsDir,
            this.paths.auditDir,
            this.paths.snapshotDir,
            this.paths.backupDir,
            this.paths.uploadDir
        ].forEach(dir => fs.mkdirSync(dir, { recursive: true }));
    }

    writeAtomic(file, content) {
        const target = path.resolve(file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temp, content, { mode: FILE_MODE });
        fs.renameSync(temp, target);
    }

    appendJsonl(file, entries) {
        const rows = Array.isArray(entries) ? entries : [entries];
        if (!rows.length) return;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const body = rows.map(entry => JSON.stringify(entry)).join("\n") + "\n";
        fs.appendFileSync(file, body, { mode: FILE_MODE });
    }

    tailJsonl(file, limit = 80) {
        if (!fs.existsSync(file)) return [];
        return fs.readFileSync(file, "utf8")
            .split("\n")
            .filter(Boolean)
            .slice(-Math.max(1, Math.min(Number(limit) || 80, 500)))
            .reverse()
            .map(parseJsonLine)
            .filter(Boolean);
    }

    listFiles(dir, predicate = () => true, limit = 200) {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir)
            .filter(predicate)
            .sort()
            .reverse()
            .slice(0, limit);
    }

    listRevisions(limit = 80) {
        return this.listFiles(
            this.paths.revisionDir,
            name => /^wxm-cms-\d{8}T\d{6}Z-[a-f0-9]{12}\.json$/.test(name),
            limit
        );
    }

    listAnalyticsFiles(limit = 30) {
        return this.listFiles(this.paths.analyticsDir, name => name.endsWith(".ndjson"), limit).reverse();
    }

    listSnapshots(limit = 40) {
        return this.listFiles(this.paths.snapshotDir, name => /^snapshot-\d{8}T\d{6}Z-[a-z0-9-]+\.json$/.test(name), limit)
            .map(name => {
                const file = path.join(this.paths.snapshotDir, name);
                const stat = fs.statSync(file);
                return {
                    file: name,
                    bytes: stat.size,
                    createdAt: stat.mtime.toISOString(),
                    sha256: sha256(fs.readFileSync(file)).slice(0, 16)
                };
            });
    }

    todayAnalyticsFile(now = new Date()) {
        return path.join(this.paths.analyticsDir, `${now.toISOString().slice(0, 10)}.ndjson`);
    }

    fileInfo(file) {
        if (!fs.existsSync(file)) return { exists: false, bytes: 0, sha256: "", updatedAt: "" };
        const body = fs.readFileSync(file);
        const stat = fs.statSync(file);
        return {
            exists: true,
            bytes: stat.size,
            sha256: sha256(body).slice(0, 16),
            updatedAt: stat.mtime.toISOString()
        };
    }

    dirInfo(dir, predicate = () => true) {
        if (!fs.existsSync(dir)) return { exists: false, files: 0, bytes: 0, updatedAt: "" };
        let files = 0;
        let bytes = 0;
        let latest = 0;
        const walk = current => {
            fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
                const full = path.join(current, entry.name);
                if (entry.isDirectory()) return walk(full);
                if (!predicate(entry.name, full)) return;
                const stat = fs.statSync(full);
                files += 1;
                bytes += stat.size;
                latest = Math.max(latest, stat.mtimeMs);
            });
        };
        walk(dir);
        return {
            exists: true,
            files,
            bytes,
            updatedAt: latest ? new Date(latest).toISOString() : ""
        };
    }

    overview(extra = {}) {
        return {
            schemaVersion: 1,
            mode: "local-file-store",
            updatedAt: new Date().toISOString(),
            dataDirHash: sha256(this.dataDir).slice(0, 16),
            currentCms: this.fileInfo(this.paths.currentFile),
            revisions: this.dirInfo(this.paths.revisionDir, name => name.endsWith(".json")),
            analytics: this.dirInfo(this.paths.analyticsDir, name => name.endsWith(".ndjson")),
            audit: this.fileInfo(this.paths.auditFile),
            snapshots: this.dirInfo(this.paths.snapshotDir, name => name.endsWith(".json")),
            uploads: this.dirInfo(this.paths.uploadDir, name => /\.(png|jpe?g|webp)$/i.test(name)),
            retention: {
                revisionsListed: 80,
                analyticsLookbackDays: 30,
                snapshotsListed: 40
            },
            ...extra
        };
    }

    persistManifest(extra = {}) {
        const manifest = this.overview(extra);
        this.writeAtomic(this.paths.manifestFile, JSON.stringify(manifest, null, 2));
        return manifest;
    }

    storageHealth() {
        const checks = [];
        const push = (name, ok, value = "") => checks.push({ name, ok: Boolean(ok), value });
        push("data_dir_ready", fs.existsSync(this.dataDir), "local-file-store");
        push("current_cms", fs.existsSync(this.paths.currentFile), fs.existsSync(this.paths.currentFile) ? "published" : "missing");
        push("revision_index", fs.existsSync(this.paths.revisionDir), `${this.listRevisions().length} revisions`);
        push("analytics_index", fs.existsSync(this.paths.analyticsDir), `${this.listAnalyticsFiles(500).length} files`);
        push("audit_log", fs.existsSync(this.paths.auditFile), fs.existsSync(this.paths.auditFile) ? "available" : "empty");
        push("manifest", fs.existsSync(this.paths.manifestFile), fs.existsSync(this.paths.manifestFile) ? "available" : "not generated");

        const testFile = path.join(this.dataDir, `.write-test-${process.pid}`);
        try {
            fs.writeFileSync(testFile, "ok", { mode: FILE_MODE });
            fs.unlinkSync(testFile);
            push("write_access", true, "ok");
        } catch {
            push("write_access", false, "failed");
        }

        return {
            ok: checks.every(check => check.ok || ["current_cms", "audit_log", "manifest"].includes(check.name)),
            checks
        };
    }

    createSnapshot({ label = "manual", reason = "", analyticsSummary = null } = {}) {
        const snapshotName = `snapshot-${stamp()}-${safeName(label)}.json`;
        const file = path.join(this.paths.snapshotDir, snapshotName);
        let currentCms = null;
        if (fs.existsSync(this.paths.currentFile)) {
            try {
                currentCms = JSON.parse(fs.readFileSync(this.paths.currentFile, "utf8"));
            } catch {
                currentCms = null;
            }
        }
        const payload = {
            schemaVersion: 1,
            createdAt: new Date().toISOString(),
            label: safeName(label),
            reason: String(reason || "").slice(0, 220),
            manifest: this.overview(),
            currentCms,
            analyticsSummary
        };
        this.writeAtomic(file, JSON.stringify(payload, null, 2));
        this.persistManifest({ lastSnapshot: snapshotName });
        return {
            file: snapshotName,
            bytes: fs.statSync(file).size,
            sha256: sha256(fs.readFileSync(file)).slice(0, 16),
            createdAt: new Date().toISOString()
        };
    }
}

module.exports = { WxmFileStore };
