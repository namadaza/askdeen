import { Message } from "ai";
import {
  DeleteCommandInput,
  DynamoDBDocument,
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dbClient, TableRequiredSchema } from "./table";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const tableName = "stage-askdeen-askDeen";

// SCHEMA
export const TableAskDeenAccessPatterns = {
  userById: (userId: string) => ({
    pk: `USER#${userId}`,
    sk: `USER#${userId}`,
  }),
  chatById: (chatId: string, userId?: string) => ({
    pk: `CHAT#${chatId}`,
    sk: `CHAT#${userId || ""}`,
  }),
  chatsByUserId: (userId: string) => ({
    pk: `CHAT#`,
    sk: `CHAT#${userId}`,
  }),
};

export interface TableAskDeenUser extends TableRequiredSchema {
  id: string;
  image: string;
  name: string;
  email: string;
}

export interface TableAskDeenChat extends TableRequiredSchema {
  id: string;
  title: string;
  userId: string;
  path: string;
  messages: Message[];
  sharePath?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

export type TableAskDeen = TableAskDeenUser | TableAskDeenChat;

type DynamoDBClientParam = DynamoDBDocument;

// FUNCTIONS
export const getUserById = async (
  userId: string,
  dbClientParam?: DynamoDBClientParam,
): Promise<TableAskDeenUser> => {
  const params: GetCommandInput = {
    TableName: tableName,
    Key: TableAskDeenAccessPatterns.userById(userId),
  };
  const response = await (dbClientParam ?? dbClient).get(params);

  return response.Item as TableAskDeenUser;
};

export const getChatById = async (
  chatId: string,
  userId?: string,
  dbClientParam?: DynamoDBClientParam,
): Promise<TableAskDeenChat | undefined> => {
  if (!userId) {
    const params: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": TableAskDeenAccessPatterns.chatById(chatId).pk,
      },
    };

    try {
      const response = await (dbClientParam ?? dbClient).query(params);
      return response.Items?.[0] as TableAskDeenChat | undefined;
    } catch (error) {
      console.error("getChatById error", error);
      return undefined;
    }
  }

  const params: GetCommandInput = {
    TableName: tableName,
    Key: TableAskDeenAccessPatterns.chatById(chatId, userId),
  };

  try {
    const response = await (dbClientParam ?? dbClient).get(params);
    return response.Item as TableAskDeenChat | undefined;
  } catch (error) {
    console.error("getChatById error", error);
    return undefined;
  }
};

export const getChatsByUserId = async (
  userId: string,
  dbClientParam?: DynamoDBClientParam,
): Promise<TableAskDeenChat[]> => {
  const params: QueryCommandInput = {
    ExpressionAttributeNames: { "#kn0": "GSI1PK" },
    ExpressionAttributeValues: {
      ":kv0": TableAskDeenAccessPatterns.chatsByUserId(userId).sk,
    },
    IndexName: "GSI1",
    KeyConditionExpression: "#kn0 = :kv0",
    ScanIndexForward: false,
    TableName: tableName,
  };

  try {
    const response = await (dbClientParam ?? dbClient).query(params);
    return response.Items as TableAskDeenChat[];
  } catch (error) {
    console.error("getChatsByUserId error", error);
    return [];
  }
};

export const deleteChatById = async (
  chatId: string,
  userId: string,
  dbClientParam?: DynamoDBClientParam,
): Promise<DocumentClient.DeleteItemOutput> => {
  const params: DeleteCommandInput = {
    TableName: tableName,
    Key: TableAskDeenAccessPatterns.chatById(chatId, userId),
  };
  const response = await (dbClientParam ?? dbClient).delete(params);

  return response;
};

export const deleteChatsByUserId = async (
  userId: string,
  dbClientParam?: DynamoDBClientParam,
): Promise<void> => {
  const db = dbClientParam ?? dbClient;
  const chats = await getChatsByUserId(userId, db);
  await Promise.all(chats.map((chat) => deleteChatById(chat.id, userId, db)));
};

export const putChat = async (
  chat: TableAskDeenChat,
  dbClientParam?: DynamoDBClientParam,
): Promise<TableAskDeenChat> => {
  const params: PutCommandInput = {
    TableName: tableName,
    Item: chat,
  };
  await (dbClientParam ?? dbClient).put(params);

  return chat;
};
