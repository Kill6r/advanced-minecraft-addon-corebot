package us.advancedminecraft.gcodesync;

import java.util.logging.Level;
import org.bukkit.plugin.java.JavaPlugin;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;

public final class GCodeSync extends JavaPlugin {
    private GCodeSyncAPI api;

    @Override
    public void onEnable() {
        try {
            this.api = new GCodeSyncAPI(this);
            getLogger().info("AdvancedMinecraft v" + getDescription().getVersion() + " enabled.");
        } catch (Exception exception) {
            getLogger().log(Level.SEVERE, "AdvancedMinecraft could not start safely.", exception);
            getServer().getPluginManager().disablePlugin(this);
        }
    }

    @Override
    public void onDisable() {
        if (this.api != null) {
            this.api.shutdown();
        }
    }
}
