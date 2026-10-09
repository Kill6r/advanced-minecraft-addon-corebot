package us.advancedminecraft.gcodesync.api;

import java.util.logging.Level;
import org.bukkit.Bukkit;
import us.advancedminecraft.gcodesync.GCodeSync;
import us.advancedminecraft.gcodesync.configuration.FileBuilder;
import us.advancedminecraft.gcodesync.database.DataHandler;
import us.advancedminecraft.gcodesync.manager.InitializerManager;
import us.advancedminecraft.gcodesync.util.Colorize;

public final class GCodeSyncAPI {
    private static GCodeSyncAPI instance;

    private final GCodeSync main;
    private final FileBuilder conf;
    private final FileBuilder lang;
    private DataHandler dataHandler;
    private final InitializerManager initializerManager;

    public GCodeSyncAPI(GCodeSync main) {
        this.main = main;
        instance = this;
        this.conf = new FileBuilder(main, "config.yml");
        this.lang = new FileBuilder(main, "lang.yml");
        this.dataHandler = new DataHandler(this);
        this.initializerManager = new InitializerManager(main);
    }

    public static GCodeSyncAPI getInstance() {
        return instance;
    }

    public static void debug(String message) {
        GCodeSyncAPI api = getInstance();
        if (api == null || !api.getConf().getBoolean("debug")) {
            return;
        }
        Bukkit.getConsoleSender().sendMessage("[AdvancedMinecraft] §b[DEBUG] §r" + message);
    }

    public static void logger(String message) {
        GCodeSyncAPI api = getInstance();
        if (api != null) {
            api.getMain().getLogger().log(Level.INFO, message);
        }
    }

    public static String getLang(String path) {
        GCodeSyncAPI api = getInstance();
        if (api == null) {
            return path;
        }

        String value = api.getLang().getString(path);
        if (value == null) {
            return Colorize.set("&cMissing language key: " + path);
        }

        String prefix = api.getLang().getString("prefix");
        if (prefix == null) {
            prefix = "";
        }
        return Colorize.set(value.replace("<prefix>", prefix));
    }

    public synchronized void reload() {
        this.conf.reload();
        this.lang.reload();

        DataHandler replacement = new DataHandler(this);
        DataHandler previous = this.dataHandler;
        this.dataHandler = replacement;
        if (previous != null) {
            previous.close();
        }
    }

    public void shutdown() {
        if (this.dataHandler != null) {
            this.dataHandler.close();
        }
    }

    public FileBuilder getConf() {
        return conf;
    }

    public FileBuilder getLang() {
        return lang;
    }

    public DataHandler getDataH() {
        return dataHandler;
    }

    public InitializerManager getInitializerManager() {
        return initializerManager;
    }

    public GCodeSync getMain() {
        return main;
    }
}
