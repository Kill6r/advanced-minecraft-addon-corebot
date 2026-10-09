package us.advancedminecraft.gcodesync.handler.command.information;

import java.util.Collections;
import java.util.List;
import org.bukkit.command.CommandSender;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.handler.command.SubCommand;

public final class HelpCommand implements SubCommand {
    @Override
    public String permission() {
        return "gcode.command.help";
    }

    @Override
    public void onCommand(CommandSender sender, String[] args) {
        if (sender.hasPermission("gcode.command.reload")) {
            sender.sendMessage(GCodeSyncAPI.getLang("Admin.Help"));
        } else {
            sender.sendMessage(GCodeSyncAPI.getLang("Command.Help"));
        }
    }

    @Override
    public List<String> getTabCompletions(CommandSender sender, String[] args) {
        return Collections.emptyList();
    }
}
