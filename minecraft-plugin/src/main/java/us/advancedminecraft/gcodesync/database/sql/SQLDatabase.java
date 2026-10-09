package us.advancedminecraft.gcodesync.database.sql;

import java.sql.Connection;
import java.sql.SQLException;
import us.advancedminecraft.gcodesync.database.DataStorage;

public interface SQLDatabase {
    void add(DataStorage key, String value);
    boolean init();
    void execute(String statement);
    Connection getConnection() throws SQLException;
    void close();
}
