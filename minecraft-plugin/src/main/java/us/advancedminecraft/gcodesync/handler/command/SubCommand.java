package us.advancedminecraft.gcodesync.handler.command;

import java.util.List;
import org.bukkit.command.CommandSender;

public interface SubCommand {
    String permission();
    void onCommand(CommandSender sender, String[] args);
    List<String> getTabCompletions(CommandSender sender, String[] args);
}
