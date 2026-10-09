package us.advancedminecraft.gcodesync.manager;

import us.advancedminecraft.gcodesync.GCodeSync;
import us.advancedminecraft.gcodesync.command.SyncCommand;
import us.advancedminecraft.gcodesync.handler.BaseCommand;

public final class InitializerManager {
    public InitializerManager(GCodeSync main) {
        new BaseCommand(main);
        new SyncCommand(main);
    }
}
