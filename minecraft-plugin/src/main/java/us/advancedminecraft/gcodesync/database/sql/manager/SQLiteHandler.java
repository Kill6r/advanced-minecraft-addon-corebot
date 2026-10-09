package us.advancedminecraft.gcodesync.database.sql.manager;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.EnumMap;
import java.util.Map;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.database.DataStorage;
import us.advancedminecraft.gcodesync.database.sql.SQLDatabase;

public final class SQLiteHandler implements SQLDatabase {
    private final Map<DataStorage, String> config = new EnumMap<>(DataStorage.class);
    private String jdbcUrl;
    private boolean enabled;

    @Override
    public void add(DataStorage key, String value) {
        config.put(key, value);
    }

    @Override
    public boolean init() {
        try {
            Class.forName("org.sqlite.JDBC");
            String fileName = config.getOrDefault(DataStorage.DATABASE, "database");
            if (!fileName.endsWith(".db")) {
                fileName += ".db";
            }

            File dataFile = new File(GCodeSyncAPI.getInstance().getMain().getDataFolder(), fileName);
            File parent = dataFile.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }

            this.jdbcUrl = "jdbc:sqlite:" + dataFile.getAbsolutePath();
            try (Connection ignored = DriverManager.getConnection(jdbcUrl)) {
                this.enabled = true;
                GCodeSyncAPI.logger("Connected to SQLite.");
            }
            return true;
        } catch (Exception exception) {
            GCodeSyncAPI.getInstance().getMain().getLogger().log(java.util.logging.Level.SEVERE,
                    "Could not initialize SQLite.", exception);
            this.enabled = false;
            return false;
        }
    }

    @Override
    public void execute(String statement) {
        if (!enabled || statement == null || statement.trim().isEmpty()) {
            return;
        }
        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(statement)) {
            preparedStatement.executeUpdate();
        } catch (SQLException exception) {
            GCodeSyncAPI.getInstance().getMain().getLogger().log(java.util.logging.Level.WARNING,
                    "SQLite statement failed.", exception);
        }
    }

    @Override
    public Connection getConnection() throws SQLException {
        if (!enabled || jdbcUrl == null) {
            throw new SQLException("SQLite is not available.");
        }
        return DriverManager.getConnection(jdbcUrl);
    }

    @Override
    public void close() {
        enabled = false;
    }
}
