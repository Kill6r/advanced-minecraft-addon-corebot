package us.advancedminecraft.gcodesync.handler.command.admin;

import java.util.Collections;
import java.util.List;
import org.bukkit.command.CommandSender;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.handler.command.SubCommand;

public final class ReloadCommand implements SubCommand {
    @Override
    public String permission() {
        return "gcode.command.reload";
    }

    @Override
    public void onCommand(CommandSender sender, String[] args) {
        try {
            GCodeSyncAPI.getInstance().reload();
            sender.sendMessage(GCodeSyncAPI.getLang("Command.reload"));
        } catch (Exception exception) {
            sender.sendMessage(GCodeSyncAPI.getLang("Command.error.reload"));
            GCodeSyncAPI.getInstance().getMain().getLogger().log(java.util.logging.Level.SEVERE,
                    "Plugin reload failed.", exception);
        }
    }

    @Override
    public List<String> getTabCompletions(CommandSender sender, String[] args) {
        return Collections.emptyList();
    }
}
