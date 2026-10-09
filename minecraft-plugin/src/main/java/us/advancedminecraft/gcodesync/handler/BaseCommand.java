package us.advancedminecraft.gcodesync.handler;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.PluginCommand;
import org.bukkit.command.TabCompleter;
import org.bukkit.util.StringUtil;
import us.advancedminecraft.gcodesync.GCodeSync;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.handler.command.SubCommand;
import us.advancedminecraft.gcodesync.handler.command.admin.ReloadCommand;
import us.advancedminecraft.gcodesync.handler.command.information.HelpCommand;

public final class BaseCommand implements CommandExecutor, TabCompleter {
    private final Map<String, SubCommand> subCommands = new LinkedHashMap<>();

    public BaseCommand(GCodeSync main) {
        PluginCommand command = main.getCommand("gcode");
        if (command == null) {
            throw new IllegalStateException("Command 'gcode' is missing from plugin.yml");
        }

        subCommands.put("help", new HelpCommand());
        subCommands.put("reload", new ReloadCommand());
        command.setExecutor(this);
        command.setTabCompleter(this);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (args.length == 0) {
            subCommands.get("help").onCommand(sender, args);
            return true;
        }

        SubCommand subCommand = subCommands.get(args[0].toLowerCase(Locale.ROOT));
        if (subCommand == null) {
            sender.sendMessage(GCodeSyncAPI.getLang("Command.error.syntax"));
            return true;
        }

        String permission = subCommand.permission();
        if (permission != null && !permission.isEmpty() && !sender.hasPermission(permission)) {
            sender.sendMessage(GCodeSyncAPI.getLang("Command.error.permission"));
            return true;
        }

        subCommand.onCommand(sender, args);
        return true;
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        List<String> allowed = new ArrayList<>();
        for (Map.Entry<String, SubCommand> entry : subCommands.entrySet()) {
            String permission = entry.getValue().permission();
            if (permission == null || permission.isEmpty() || sender.hasPermission(permission)) {
                allowed.add(entry.getKey());
            }
        }

        List<String> completions = new ArrayList<>();
        if (args.length == 1) {
            StringUtil.copyPartialMatches(args[0], allowed, completions);
        } else if (args.length > 1) {
            SubCommand subCommand = subCommands.get(args[0].toLowerCase(Locale.ROOT));
            if (subCommand != null && allowed.contains(args[0].toLowerCase(Locale.ROOT))) {
                StringUtil.copyPartialMatches(args[args.length - 1],
                        subCommand.getTabCompletions(sender, args), completions);
            }
        }
        Collections.sort(completions);
        return completions;
    }
}
