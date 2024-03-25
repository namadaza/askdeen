import { dbClient } from "./table";
const tableName = "stage-askdeen-askDeen";
// SCHEMA
export const TableAskDeenAccessPatterns = {
    userById: (userId) => ({
        pk: `USER#${userId}`,
        sk: `USER#${userId}`,
    }),
    chatById: (chatId, userId) => ({
        pk: `CHAT#${userId}`,
        sk: `CHAT#${chatId}`,
    }),
    chatsByUserId: (userId) => ({
        pk: `CHAT#${userId}`,
        sk: `CHAT#`,
    }),
};
// FUNCTIONS
export const getUserById = async (userId, dbClientParam) => {
    const params = {
        TableName: tableName,
        Key: TableAskDeenAccessPatterns.userById(userId),
    };
    const response = await (dbClientParam ?? dbClient).get(params);
    return response.Item;
};
export const getChatById = async (chatId, userId, dbClientParam) => {
    const params = {
        TableName: tableName,
        Key: TableAskDeenAccessPatterns.chatById(chatId, userId),
    };
    try {
        const response = await (dbClientParam ?? dbClient).get(params);
        return response.Item;
    }
    catch (error) {
        return undefined;
    }
};
export const getChatsByUserId = async (userId, dbClientParam) => {
    const params = {
        TableName: tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk,:sk)",
        ExpressionAttributeValues: {
            ":pk": TableAskDeenAccessPatterns.chatsByUserId(userId).pk,
            ":sk": TableAskDeenAccessPatterns.chatsByUserId(userId).sk,
        },
        ScanIndexForward: false,
    };
    const response = await (dbClientParam ?? dbClient).query(params);
    return response.Items;
};
export const deleteChatById = async (chatId, userId, dbClientParam) => {
    const params = {
        TableName: tableName,
        Key: TableAskDeenAccessPatterns.chatById(chatId, userId),
    };
    const response = await (dbClientParam ?? dbClient).delete(params);
    return response;
};
export const deleteChatsByUserId = async (userId, dbClientParam) => {
    const db = dbClientParam ?? dbClient;
    const chats = await getChatsByUserId(userId, db);
    await Promise.all(chats.map((chat) => deleteChatById(chat.id, userId, db)));
};
export const putChat = async (chat, dbClientParam) => {
    const params = {
        TableName: tableName,
        Item: chat,
    };
    await (dbClientParam ?? dbClient).put(params);
    return chat;
};
