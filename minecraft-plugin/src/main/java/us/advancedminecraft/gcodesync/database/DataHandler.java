package us.advancedminecraft.gcodesync.database;

import com.mongodb.client.FindOneAndUpdateOptions;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.Updates;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Locale;
import java.util.UUID;
import java.util.logging.Level;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bukkit.entity.Player;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.database.mongodb.MongoDB;
import us.advancedminecraft.gcodesync.database.mongodb.manager.MongoHandler;
import us.advancedminecraft.gcodesync.database.sql.SQLDatabase;
import us.advancedminecraft.gcodesync.database.sql.manager.MySQLHandler;
import us.advancedminecraft.gcodesync.database.sql.manager.SQLiteHandler;

public final class DataHandler {
    public enum ClaimStatus {
        SUCCESS,
        INVALID_CODE,
        ALREADY_SYNCED,
        CODE_ALREADY_USED,
        DATABASE_ERROR
    }

    public static final class ClaimResult {
        private final ClaimStatus status;
        private final String discordTag;

        private ClaimResult(ClaimStatus status, String discordTag) {
            this.status = status;
            this.discordTag = discordTag == null ? "unknown" : discordTag;
        }

        public ClaimStatus getStatus() {
            return status;
        }

        public String getDiscordTag() {
            return discordTag;
        }
    }

    private final GCodeSyncAPI api;
    private final String storageType;
    private final String table;
    private final String codeColumn;
    private SQLDatabase sqlDatabase;
    private MongoDB mongoDatabase;

    public DataHandler(GCodeSyncAPI api) {
        this.api = api;
        this.storageType = value(api.getConf().getString("Storage"), "MongoDB").trim();
        this.table = validIdentifier(api.getConf().getString("Option.SQLDatabase.table"), "GCodeSync_code");
        this.codeColumn = validIdentifier(api.getConf().getString("Option.SQLDatabase.column"), "code");
        initialize();
    }

    private void initialize() {
        if (storageType.equalsIgnoreCase("MongoDB")) {
            MongoHandler handler = new MongoHandler();
            handler.add(DataStorage.URL, api.getConf().getString("Option.MongoDatabase.connect"));
            handler.add(DataStorage.DATABASE, api.getConf().getString("Option.MongoDatabase.database"));
            handler.add(DataStorage.COLLECTION, api.getConf().getString("Option.MongoDatabase.collection"));
            if (!handler.init()) {
                throw new IllegalStateException("MongoDB initialization failed.");
            }
            this.mongoDatabase = handler;
            return;
        }

        if (storageType.equalsIgnoreCase("MySQL")) {
            MySQLHandler handler = new MySQLHandler();
            handler.add(DataStorage.HOST, api.getConf().getString("SQLDatabase.address"));
            handler.add(DataStorage.PORT, String.valueOf(api.getConf().getInt("SQLDatabase.port", 3306)));
            handler.add(DataStorage.DATABASE, api.getConf().getString("SQLDatabase.database"));
            handler.add(DataStorage.USERNAME, api.getConf().getString("SQLDatabase.username"));
            handler.add(DataStorage.PASSWORD, api.getConf().getString("SQLDatabase.password"));
            handler.add(DataStorage.MINIMUM_IDLE, String.valueOf(api.getConf().getInt("SQLDatabase.pool-settings.minimum-idle", 2)));
            handler.add(DataStorage.MAXIMUM_POOL_SIZE, String.valueOf(api.getConf().getInt("SQLDatabase.pool-settings.maximum-pool-size", 10)));
            handler.add(DataStorage.CONNECTION_TIMEOUT, String.valueOf(api.getConf().getLong("SQLDatabase.pool-settings.connection-timeout", 5000L)));
            if (!handler.init()) {
                throw new IllegalStateException("MySQL initialization failed.");
            }
            this.sqlDatabase = handler;
            ensureSqlSchema(false);
            return;
        }

        if (storageType.equalsIgnoreCase("SQLite")) {
            SQLiteHandler handler = new SQLiteHandler();
            handler.add(DataStorage.DATABASE, value(api.getConf().getString("SQLDatabase.sqlite-file"), "database"));
            if (!handler.init()) {
                throw new IllegalStateException("SQLite initialization failed.");
            }
            this.sqlDatabase = handler;
            ensureSqlSchema(true);
            return;
        }

        throw new IllegalArgumentException("Unknown Storage type: " + storageType + ". Use MongoDB, MySQL or SQLite.");
    }

    private void ensureSqlSchema(boolean sqlite) {
        String idDefinition = sqlite
                ? "ID INTEGER PRIMARY KEY AUTOINCREMENT"
                : "ID INT PRIMARY KEY AUTO_INCREMENT";
        String ddl = "CREATE TABLE IF NOT EXISTS `" + table + "` ("
                + idDefinition + ", "
                + "`" + codeColumn + "` VARCHAR(96), "
                + "`nickname` VARCHAR(80), "
                + "`nick` VARCHAR(80), "
                + "`discord_tag` VARCHAR(100), "
                + "`discord_id` VARCHAR(32), "
                + "`guild_id` VARCHAR(32), "
                + "`uuid` VARCHAR(36), "
                + "`verified` VARCHAR(10) DEFAULT 'false'"
                + ")";
        sqlDatabase.execute(ddl);
    }

    public ClaimResult claimCode(String rawCode, Player player) {
        if (player == null || rawCode == null || rawCode.trim().isEmpty()) {
            return new ClaimResult(ClaimStatus.INVALID_CODE, null);
        }

        String code = rawCode.trim();
        try {
            if (mongoDatabase != null) {
                return claimMongo(code, player);
            }
            if (sqlDatabase != null) {
                return claimSql(code, player);
            }
        } catch (Exception exception) {
            api.getMain().getLogger().log(Level.WARNING,
                    "Could not synchronize player " + player.getName() + ".", exception);
            return new ClaimResult(ClaimStatus.DATABASE_ERROR, null);
        }
        return new ClaimResult(ClaimStatus.DATABASE_ERROR, null);
    }

    private ClaimResult claimMongo(String code, Player player) {
        MongoCollection<Document> collection = mongoDatabase.getCollection();
        String uuid = player.getUniqueId().toString();
        String nickname = player.getName().toLowerCase(Locale.ROOT);

        Bson verified = Filters.or(Filters.eq("verified", true), Filters.eq("verified", "true"));
        Document existingPlayer = collection.find(Filters.and(
                verified,
                Filters.or(Filters.eq("uuid", uuid), Filters.eq("nickname", nickname))
        )).first();
        if (existingPlayer != null) {
            return new ClaimResult(ClaimStatus.ALREADY_SYNCED, string(existingPlayer.get("discord_tag")));
        }

        Bson unverified = Filters.or(
                Filters.eq("verified", false),
                Filters.eq("verified", "false"),
                Filters.exists("verified", false)
        );
        Bson unclaimedUuid = Filters.or(
                Filters.eq("uuid", "none"),
                Filters.eq("uuid", null),
                Filters.exists("uuid", false)
        );

        Document claimed = collection.findOneAndUpdate(
                Filters.and(Filters.eq("code", code), unverified, unclaimedUuid),
                Updates.combine(
                        Updates.set("uuid", uuid),
                        Updates.set("nick", player.getName()),
                        Updates.set("nickname", nickname),
                        Updates.set("verified", true)
                ),
                new FindOneAndUpdateOptions().returnDocument(ReturnDocument.AFTER)
        );

        if (claimed != null) {
            GCodeSyncAPI.debug("Claimed code " + code + " for " + player.getName());
            return new ClaimResult(ClaimStatus.SUCCESS, string(claimed.get("discord_tag")));
        }

        Document byCode = collection.find(Filters.eq("code", code)).first();
        if (byCode == null) {
            return new ClaimResult(ClaimStatus.INVALID_CODE, null);
        }
        return new ClaimResult(ClaimStatus.CODE_ALREADY_USED, string(byCode.get("discord_tag")));
    }

    private ClaimResult claimSql(String code, Player player) throws SQLException {
        String uuid = player.getUniqueId().toString();
        String nickname = player.getName().toLowerCase(Locale.ROOT);

        try (Connection connection = sqlDatabase.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String existingSql = "SELECT `discord_tag` FROM `" + table
                        + "` WHERE LOWER(COALESCE(`verified`, 'false')) = 'true'"
                        + " AND (`uuid` = ? OR LOWER(COALESCE(`nickname`, '')) = ?) LIMIT 1";
                try (PreparedStatement statement = connection.prepareStatement(existingSql)) {
                    statement.setString(1, uuid);
                    statement.setString(2, nickname);
                    try (ResultSet result = statement.executeQuery()) {
                        if (result.next()) {
                            connection.rollback();
                            return new ClaimResult(ClaimStatus.ALREADY_SYNCED, result.getString("discord_tag"));
                        }
                    }
                }

                String findCodeSql = "SELECT `discord_tag`, `verified`, `uuid` FROM `" + table
                        + "` WHERE `" + codeColumn + "` = ? LIMIT 1";
                String discordTag;
                try (PreparedStatement statement = connection.prepareStatement(findCodeSql)) {
                    statement.setString(1, code);
                    try (ResultSet result = statement.executeQuery()) {
                        if (!result.next()) {
                            connection.rollback();
                            return new ClaimResult(ClaimStatus.INVALID_CODE, null);
                        }
                        discordTag = result.getString("discord_tag");
                        boolean isVerified = Boolean.parseBoolean(result.getString("verified"));
                        String storedUuid = result.getString("uuid");
                        boolean hasUuid = storedUuid != null && !storedUuid.trim().isEmpty()
                                && !storedUuid.equalsIgnoreCase("none");
                        if (isVerified || hasUuid) {
                            connection.rollback();
                            return new ClaimResult(ClaimStatus.CODE_ALREADY_USED, discordTag);
                        }
                    }
                }

                String updateSql = "UPDATE `" + table + "` SET `verified` = 'true', `uuid` = ?, `nick` = ?,"
                        + " `nickname` = ? WHERE `" + codeColumn + "` = ?"
                        + " AND LOWER(COALESCE(`verified`, 'false')) <> 'true'";
                try (PreparedStatement statement = connection.prepareStatement(updateSql)) {
                    statement.setString(1, uuid);
                    statement.setString(2, player.getName());
                    statement.setString(3, nickname);
                    statement.setString(4, code);
                    if (statement.executeUpdate() != 1) {
                        connection.rollback();
                        return new ClaimResult(ClaimStatus.CODE_ALREADY_USED, discordTag);
                    }
                }

                connection.commit();
                return new ClaimResult(ClaimStatus.SUCCESS, discordTag);
            } catch (SQLException exception) {
                connection.rollback();
                throw exception;
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    public void close() {
        if (sqlDatabase != null) {
            sqlDatabase.close();
            sqlDatabase = null;
        }
        if (mongoDatabase != null) {
            mongoDatabase.close();
            mongoDatabase = null;
        }
    }

    private static String validIdentifier(String value, String fallback) {
        String candidate = value(value, fallback);
        if (!candidate.matches("[A-Za-z0-9_]+")) {
            throw new IllegalArgumentException("Unsafe SQL identifier in config: " + candidate);
        }
        return candidate;
    }

    private static String value(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }

    private static String string(Object value) {
        return value == null ? "unknown" : String.valueOf(value);
    }
}
