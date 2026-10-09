package us.advancedminecraft.gcodesync.database.mongodb.manager;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import java.util.EnumMap;
import java.util.Map;
import org.bson.Document;
import us.advancedminecraft.gcodesync.api.GCodeSyncAPI;
import us.advancedminecraft.gcodesync.database.DataStorage;
import us.advancedminecraft.gcodesync.database.mongodb.MongoDB;

public final class MongoHandler implements MongoDB {
    private final Map<DataStorage, String> config = new EnumMap<>(DataStorage.class);
    private MongoClient mongoClient;
    private MongoDatabase mongoDatabase;
    private MongoCollection<Document> mongoCollection;

    @Override
    public void add(DataStorage key, String value) {
        config.put(key, value);
    }

    @Override
    public boolean init() {
        if (!config.containsKey(DataStorage.URL)
                || !config.containsKey(DataStorage.DATABASE)
                || !config.containsKey(DataStorage.COLLECTION)) {
            GCodeSyncAPI.logger("MongoDB configuration requires URL, database and collection.");
            return false;
        }

        try {
            this.mongoClient = MongoClients.create(new ConnectionString(config.get(DataStorage.URL)));
            this.mongoDatabase = mongoClient.getDatabase(config.get(DataStorage.DATABASE));
            this.mongoCollection = mongoDatabase.getCollection(config.get(DataStorage.COLLECTION));
            mongoDatabase.runCommand(new Document("ping", 1));
            GCodeSyncAPI.logger("Connected to MongoDB (" + config.get(DataStorage.DATABASE) + "/" +
                    config.get(DataStorage.COLLECTION) + ").");
            return true;
        } catch (Exception exception) {
            GCodeSyncAPI.getInstance().getMain().getLogger().log(java.util.logging.Level.SEVERE,
                    "Could not connect to MongoDB.", exception);
            close();
            return false;
        }
    }

    @Override
    public MongoDatabase getDatabase() {
        return mongoDatabase;
    }

    @Override
    public MongoCollection<Document> getCollection() {
        return mongoCollection;
    }

    @Override
    public void close() {
        if (mongoClient != null) {
            mongoClient.close();
            mongoClient = null;
        }
        mongoDatabase = null;
        mongoCollection = null;
    }
}
