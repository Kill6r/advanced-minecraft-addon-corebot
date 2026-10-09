# Advanced Minecraft Addon CoreBot

This repository contains the two parts of the Advanced Minecraft account synchronization system:

- `minecraft-plugin/`: Spigot plugin written in Java.
- `corebot-addon/`: CoreBot addon written in JavaScript.

## What was fixed

### Minecraft plugin

- Rebuilt as a clean Maven project instead of a decompiled/shaded JAR tree.
- Registered `/sync` and `/gcode` correctly.
- Removed invalid `CommandSender -> Player` casts.
- Replaced broken String comparisons and the always-true sync condition with explicit synchronization states.
- Made MongoDB code claiming atomic to prevent two players from claiming the same code.
- Reworked SQL queries to use prepared statements for user-controlled values.
- Added proper MongoDB/MySQL/SQLite connection shutdown.
- Fixed MongoDB client/database initialization.
- Added MySQL and SQLite JDBC dependencies.
- Replaced Vault-only permission checks with Bukkit permissions.
- Added a working `/gcode reload` command.
- Unified plugin versioning at `1.0.1`.
- Removed real-looking database credentials from the distributed configuration.

### CoreBot addon

- Removed embedded credentials/API key values from source.
- Moved license validation endpoint/API key into configuration.
- License failure now actually stops the addon from loading.
- Fixed synchronization-code collision checking.
- Fixed the synchronized-account boolean condition.
- Parameterized LiteBans lookups and the LuckPerms UUID lookup.
- Fixed LuckPerms rank lookup so it queries the requested UUID instead of returning the first database row.
- Releases test MySQL pool connections instead of leaking them.
- Optional LiteBans/LuckPerms connection failure no longer kills the entire bot process.

## Required shared storage

For the Java plugin and CoreBot addon to synchronize the same accounts, both must point to the same synchronization database.

The current CoreBot addon implementation uses **MongoDB** for synchronization, so the Minecraft plugin should also use:

```yaml
Storage: MongoDB
```

Set matching MongoDB database/collection values in both configurations.

## Build the Minecraft plugin

Requirements:

- Java 8+
- Maven 3.8+

From `minecraft-plugin/`:

```bash
mvn clean package
```

The shaded plugin JAR will be produced under:

```text
minecraft-plugin/target/AdvancedMinecraft-1.0.1.jar
```

## Configuration safety

Do not commit production MongoDB URIs, SQL passwords, bot tokens, license API keys, or private keys. The checked-in configuration uses placeholders intentionally.
