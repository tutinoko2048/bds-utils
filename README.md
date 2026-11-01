# bds-utils

A collection of CLI tools for managing Bedrock Dedicated Server (BDS).

## 🛠️ Tools

### bds-utils

A utility management tool for Bedrock Dedicated Server.

**Features:**
- 🚀 Server Updater - Update or switch the version of Bedrock Dedicated Server ([details](#bds-updater))
- 📦 Addon Manager - Enable/disable addons for worlds
- 🌏 World Settings Editor - Edit world settings and experimental features (custom experiment keys supported)
- 📜 Script Permissions Editor - Edit allowed script modules in `config/default/permissions.json`
- 🔄 Level.dat Restorer - Restore level.dat file from level.dat_old

**Installation:**

Via npm (requires Node.js 22.12.0 or later):
```bash
npm install -g @bds-utils/cli
```

Or download the executable directly:
https://github.com/tutinoko2048/bds-utils/releases

**Usage:**
```bash
bds-utils
```

With specifying the server path:
```bash
bds-utils -c <path-to-server>
```

---

### bds-updater

A CLI tool for updating Bedrock Dedicated Server.

**Features:**
- Check for the latest BDS version
- Download and install the latest version
- Switch between versions

**Installation:**

Via npm (requires Node.js 22.12.0 or later):
```bash
npm install -g bds-updater
```

Or download the executable directly: https://github.com/tutinoko2048/bds-utils/releases/latest

Or using bun:
```bash
bunx bds-updater
```

**Usage:**

Via installed package:
```bash
bds-updater
```

Or you can run directly with using bunx as shown above.

---

## 📋 License

Licensed under the MIT License.
