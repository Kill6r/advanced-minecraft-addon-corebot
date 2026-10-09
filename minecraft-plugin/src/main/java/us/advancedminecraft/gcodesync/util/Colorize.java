package us.advancedminecraft.gcodesync.util;

import org.bukkit.ChatColor;

public final class Colorize {
    private Colorize() {
    }

    public static String set(String value) {
        if (value == null) {
            return "";
        }
        return ChatColor.translateAlternateColorCodes('&', value);
    }
}
