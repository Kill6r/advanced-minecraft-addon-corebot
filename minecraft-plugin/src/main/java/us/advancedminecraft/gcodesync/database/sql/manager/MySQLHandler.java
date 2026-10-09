package us.advancedminecraft.gcodesync.database.sql.manager;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.EnumMap;
import java.util.Map;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.database.DataStorage;
import us.advancedminecraft.gcodesync.database.sql.SQLDatabase;

public final class MySQLHandler implements SQLDatabase {
    private final Map<DataStorage, String> config = new EnumMap<>(DataStorage.class);
    private HikariDataSource dataSource;

    @Override
    public void add(DataStorage key, String value) {
        config.put(key, value);
    }

    @Override
    public boolean init() {
        if (!hasRequiredConfig()) {
            return false;
        }

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");

            int maximumPoolSize = intValue(DataStorage.MAXIMUM_POOL_SIZE, 10);
            int minimumIdle = Math.min(intValue(DataStorage.MINIMUM_IDLE, 2), maximumPoolSize);
            long connectionTimeout = Math.max(intValue(DataStorage.CONNECTION_TIMEOUT, 5000), 250L);

            HikariConfig hikari = new HikariConfig();
            hikari.setPoolName("AdvancedMinecraft-Hikari");
            hikari.setJdbcUrl("jdbc:mysql://" + config.get(DataStorage.HOST) + ":" +
                    config.getOrDefault(DataStorage.PORT, "3306") + "/" + config.get(DataStorage.DATABASE) +
                    "?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8");
            hikari.setDriverClassName("com.mysql.cj.jdbc.Driver");
            hikari.setUsername(config.get(DataStorage.USERNAME));
            hikari.setPassword(config.get(DataStorage.PASSWORD));
            hikari.setMinimumIdle(minimumIdle);
            hikari.setMaximumPoolSize(maximumPoolSize);
            hikari.setConnectionTimeout(connectionTimeout);

            this.dataSource = new HikariDataSource(hikari);
            try (Connection ignored = dataSource.getConnection()) {
                GCodeSyncAPI.logger("Connected to MySQL.");
            }
            return true;
        } catch (Exception exception) {
            GCodeSyncAPI.getInstance().getMain().getLogger().log(java.util.logging.Level.SEVERE,
                    "Could not connect to MySQL.", exception);
            close();
            return false;
        }
    }

    @Override
    public void execute(String statement) {
        if (dataSource == null || statement == null || statement.trim().isEmpty()) {
            return;
        }
        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(statement)) {
            preparedStatement.executeUpdate();
        } catch (SQLException exception) {
            GCodeSyncAPI.getInstance().getMain().getLogger().log(java.util.logging.Level.WARNING,
                    "SQL statement failed.", exception);
        }
    }

    @Override
    public Connection getConnection() throws SQLException {
        if (dataSource == null || dataSource.isClosed()) {
            throw new SQLException("MySQL datasource is not available.");
        }
        return dataSource.getConnection();
    }

    @Override
    public void close() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }

    private boolean hasRequiredConfig() {
        return config.containsKey(DataStorage.HOST)
                && config.containsKey(DataStorage.DATABASE)
                && config.containsKey(DataStorage.USERNAME)
                && config.containsKey(DataStorage.PASSWORD);
    }

    private int intValue(DataStorage key, int fallback) {
        try {
            return Integer.parseInt(config.getOrDefault(key, String.valueOf(fallback)));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }
}
