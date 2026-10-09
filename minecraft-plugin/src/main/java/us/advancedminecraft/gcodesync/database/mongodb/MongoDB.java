package us.advancedminecraft.gcodesync.database.mongodb;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import us.advancedminecraft.gcodesync.database.DataStorage;

public interface MongoDB {
    void add(DataStorage key, String value);
    boolean init();
    MongoDatabase getDatabase();
    MongoCollection<Document> getCollection();
    void close();
}
