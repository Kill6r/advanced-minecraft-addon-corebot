package us.advancedminecraft.gcodesync.command;

import java.util.Collections;
import java.util.List;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.PluginCommand;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;
import us.advancedminecraft.gcodesync.GCodeSync;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.database.DataHandler.ClaimResult;
import us.advancedminecraft.gcodesync.database.DataHandler.ClaimStatus;

public final class SyncCommand implements CommandExecutor, TabCompleter {
    public SyncCommand(GCodeSync main) {
        PluginCommand command = main.getCommand("sync");
        if (command == null) {
            throw new IllegalStateException("Command 'sync' is missing from plugin.yml");
        }
        command.setExecutor(this);
        command.setTabCompleter(this);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(GCodeSyncAPI.getLang("Language.sync.player_only"));
            return true;
        }

        if (args.length != 1) {
            sender.sendMessage(GCodeSyncAPI.getLang("Language.sync.usage"));
            return true;
        }

        Player player = (Player) sender;
        ClaimResult result = GCodeSyncAPI.getInstance().getDataH().claimCode(args[0], player);
        String code = args[0];
        String tag = result.getDiscordTag();

        if (result.getStatus() == ClaimStatus.SUCCESS) {
            sender.sendMessage(replace(GCodeSyncAPI.getLang("Language.sync.success"), player, code, tag));
            return true;
        }
        if (result.getStatus() == ClaimStatus.ALREADY_SYNCED) {
            sender.sendMessage(replace(GCodeSyncAPI.getLang("Language.sync.minecraft_already_synced"), player, code, tag));
            return true;
        }
        if (result.getStatus() == ClaimStatus.CODE_ALREADY_USED) {
            sender.sendMessage(replace(GCodeSyncAPI.getLang("Language.sync.code_already_used"), player, code, tag));
            return true;
        }
        if (result.getStatus() == ClaimStatus.DATABASE_ERROR) {
            sender.sendMessage(replace(GCodeSyncAPI.getLang("Language.sync.database_error"), player, code, tag));
            return true;
        }

        sender.sendMessage(replace(GCodeSyncAPI.getLang("Language.sync.invalid"), player, code, tag));
        return true;
    }

    private String replace(String message, Player player, String code, String discordTag) {
        return message
                .replace("<code>", code)
                .replace("<player_name>", player.getName())
                .replace("<discord_tag>", discordTag == null ? "unknown" : discordTag);
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        return Collections.emptyList();
    }
}
