package core;

import java.io.Closeable;
import java.io.IOException;
import java.sql.Connection;

import inputoutput.conn.DBConnector;
import inputoutput.conn.DBType;
import inputoutput.conn.Connector;
import inputoutput.conn.FileConnector;

public class WorkerTask implements Closeable {

  private final int taskId;
  private Connector connector;

  private WorkerTask(int id, Connector connector) {
    this.taskId = id;
    this.connector = connector;
  }

  public int getTaskId() { return taskId; }

  public Connector getConnector() { return this.connector; }

  public static WorkerTask makeWorkerTaskForCSVFile(String dbName, String path, String name,
                                                    String separator) {
    FileConnector fc = null;
    try {
      fc = new FileConnector(dbName, path, name, separator);
    } catch (IOException e) {
      e.printStackTrace();
    }
    int id = computeTaskId(path, name);
    return new WorkerTask(id, fc);
  }

  public static WorkerTask makeWorkerTaskForDB(String dbName, DBType dbType, String connIP,
                                               String port, String sourceName,
                                               String tableName,
                                               String username,
                                               String password) {
	// Retrieve existing pool connection or create a new one if necessary
    Connection c = DBConnector.getOrCreateConnector(dbName, dbType, connIP, port, sourceName,
    		  tableName, username, password);
      
    DBConnector dbc = new DBConnector(c, dbName, dbType, connIP, port, sourceName,
      			tableName, username, password);
    
    int id = computeTaskId(sourceName, tableName);
    return new WorkerTask(id, dbc);
  }
  
  public WorkerTask(Connector c) {
	  this.taskId = -666;
	  this.connector = c;
  }
  
  public static WorkerTask makeWorkerTaskForBenchmarking(Connector c) {
	  
	  return new WorkerTask(c);
  }

  private static int computeTaskId(String path, String name) {
    String c = path.concat(name);
    return c.hashCode();
  }

  @Override
  public void close() throws IOException {
    connector.close();
  }

  @Override
  public String toString() {
    String sourceName = connector.getSourceName();
    return taskId + " - " + sourceName;
  }

}
