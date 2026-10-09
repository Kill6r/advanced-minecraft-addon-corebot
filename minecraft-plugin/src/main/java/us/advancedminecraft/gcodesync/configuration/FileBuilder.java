package us.advancedminecraft.gcodesync.configuration;

import java.io.File;
import java.io.IOException;
import java.util.logging.Level;
import org.bukkit.ChatColor;
import org.bukkit.configuration.InvalidConfigurationException;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.plugin.Plugin;

public class FileBuilder extends YamlConfiguration {
    private final Plugin plugin;
    private final File file;

    public FileBuilder(Plugin plugin, String fileName) {
        this.plugin = plugin;
        String normalized = fileName.endsWith(".yml") ? fileName : fileName + ".yml";
        this.file = new File(plugin.getDataFolder(), normalized);
        loadInitial();
    }

    public FileBuilder(Plugin plugin, String folderName, String fileName) {
        this.plugin = plugin;
        String normalized = fileName.endsWith(".yml") ? fileName : fileName + ".yml";
        this.file = new File(new File(plugin.getDataFolder(), folderName), normalized);
        loadInitial();
    }

    private void loadInitial() {
        try {
            File parent = file.getParentFile();
            if (parent != null && !parent.exists() && !parent.mkdirs()) {
                plugin.getLogger().warning("Could not create directory " + parent);
            }

            if (!file.exists()) {
                String resourcePath = plugin.getDataFolder().toPath().relativize(file.toPath()).toString().replace(File.separatorChar, '/');
                if (plugin.getResource(resourcePath) != null) {
                    plugin.saveResource(resourcePath, false);
                } else if (!file.createNewFile()) {
                    plugin.getLogger().warning("Could not create " + file.getName());
                }
            }
            load(file);
        } catch (IOException | InvalidConfigurationException exception) {
            plugin.getLogger().log(Level.SEVERE, "Could not load " + file.getName(), exception);
        }
    }

    public String getString(String path, boolean translateColors) {
        String value = getString(path);
        if (value == null) {
            value = "path not found: " + path;
        }
        return translateColors ? ChatColor.translateAlternateColorCodes('&', value) : value;
    }

    public void save() {
        try {
            save(file);
        } catch (IOException exception) {
            plugin.getLogger().log(Level.SEVERE, "Could not save " + file.getName(), exception);
        }
    }

    public void reload() {
        try {
            load(file);
        } catch (IOException | InvalidConfigurationException exception) {
            plugin.getLogger().log(Level.SEVERE, "Could not reload " + file.getName(), exception);
        }
    }
}
