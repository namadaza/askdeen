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
  chatById: (chatId: string, userId: string) => ({
    pk: `CHAT#${userId}`,
    sk: `CHAT#${chatId}`,
  }),
  chatsByUserId: (userId: string) => ({
    pk: `CHAT#${userId}`,
    sk: `CHAT#`,
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
  userId: string,
  dbClientParam?: DynamoDBClientParam,
): Promise<TableAskDeenChat | undefined> => {
  const params: GetCommandInput = {
    TableName: tableName,
    Key: TableAskDeenAccessPatterns.chatById(chatId, userId),
  };

  try {
    const response = await (dbClientParam ?? dbClient).get(params);
    return response.Item as TableAskDeenChat | undefined;
  } catch (error) {
    return undefined;
  }
};

export const getChatsByUserId = async (
  userId: string,
  dbClientParam?: DynamoDBClientParam,
): Promise<TableAskDeenChat[]> => {
  const params: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk,:sk)",
    ExpressionAttributeValues: {
      ":pk": TableAskDeenAccessPatterns.chatsByUserId(userId).pk,
      ":sk": TableAskDeenAccessPatterns.chatsByUserId(userId).sk,
    },
    ScanIndexForward: false,
  };
  const response = await (dbClientParam ?? dbClient).query(params);

  return response.Items as TableAskDeenChat[];
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
